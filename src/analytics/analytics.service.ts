import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { mapDebt, mapTransaction, toNumber } from '../common/serializers.js';
import type {
  AnalysisEvolutionDto,
  AnalysisPointDto,
  AnalysisSummaryDto,
  CategoryBreakdownDto,
  DashboardSummaryDto,
  TransactionType,
} from '../common/api-types.js';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const RECENT_TRANSACTIONS_LIMIT = 5;

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function monthRange(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, mon - 1, 1)),
    end: new Date(Date.UTC(year, mon, 1)),
  };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, from: string, to: string): Promise<AnalysisSummaryDto> {
    const start = new Date(from);
    const end = new Date(to);
    const [totals, previousTotals, balance, categories] = await Promise.all([
      this.totalsByType(userId, start, end),
      this.totalsForPrevious(userId, start, end),
      this.accountBalance(userId),
      this.breakdown(userId, start, end, 'expense'),
    ]);

    return {
      income: totals.income,
      expense: totals.expense,
      debt: totals.debt,
      balance,
      trend: this.trend(totals, previousTotals),
      categories,
    };
  }

  async getBreakdown(
    userId: string,
    from: string,
    to: string,
    type?: TransactionType,
  ): Promise<CategoryBreakdownDto[]> {
    return this.breakdown(userId, new Date(from), new Date(to), type);
  }

  async getEvolution(
    userId: string,
    from: string,
    to: string,
    interval: 'day' | 'week' | 'month',
  ): Promise<AnalysisEvolutionDto> {
    const start = new Date(from);
    const end = new Date(to);
    const rows = await this.prisma.$queryRaw<
      Array<{ bucket: Date; type: string; total: Prisma.Decimal }>
    >`
      SELECT date_trunc(${interval}, date) AS bucket, type::text AS type, SUM(amount) AS total
      FROM "Transaction"
      WHERE "userId" = ${userId} AND date >= ${start} AND date <= ${end}
      GROUP BY bucket, type
      ORDER BY bucket ASC
    `;

    const buckets = new Map<string, AnalysisPointDto>();
    for (const row of rows) {
      const key = row.bucket.toISOString();
      const existing = buckets.get(key) ?? {
        label: this.labelFor(row.bucket, interval),
        income: 0,
        expense: 0,
      };
      if (row.type === 'income') {
        existing.income = round(existing.income + toNumber(row.total), 2);
      } else if (row.type === 'expense') {
        existing.expense = round(existing.expense + toNumber(row.total), 2);
      }
      buckets.set(key, existing);
    }

    return { points: [...buckets.values()] };
  }

  async getDashboard(userId: string, month: string): Promise<DashboardSummaryDto> {
    const { start, end } = monthRange(month);
    const [totals, previousTotals, balance, categories, debts, recent] = await Promise.all([
      this.totalsByType(userId, start, end),
      this.totalsForPrevious(userId, start, end),
      this.accountBalance(userId),
      this.breakdown(userId, start, end, 'expense'),
      this.prisma.debt.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, take: 5 }),
      this.prisma.transaction.findMany({
        where: { userId, date: { gte: start, lt: end } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: RECENT_TRANSACTIONS_LIMIT,
      }),
    ]);

    return {
      balance,
      income: totals.income,
      expense: totals.expense,
      trend: this.trend(totals, previousTotals),
      categories,
      debts: debts.map(mapDebt),
      recentTransactions: recent.map(mapTransaction),
    };
  }

  private async totalsByType(userId: string, start: Date, end: Date) {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const totals = { income: 0, expense: 0, debt: 0 };
    for (const row of grouped) {
      totals[row.type as TransactionType] = toNumber(row._sum.amount);
    }
    return totals;
  }

  private async totalsForPrevious(userId: string, start: Date, end: Date) {
    const duration = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(start.getTime() - duration - 1);
    return this.totalsByType(userId, previousStart, previousEnd);
  }

  private trend(
    current: { income: number; expense: number },
    previous: { income: number; expense: number },
  ): number {
    const currentNet = current.income - current.expense;
    const previousNet = previous.income - previous.expense;
    if (previousNet === 0) {
      return 0;
    }
    return round(((currentNet - previousNet) / Math.abs(previousNet)) * 100, 1);
  }

  private async accountBalance(userId: string): Promise<number> {
    const result = await this.prisma.account.aggregate({
      where: { userId },
      _sum: { balance: true },
    });
    return round(toNumber(result._sum.balance), 2);
  }

  private async breakdown(
    userId: string,
    start: Date,
    end: Date,
    type?: TransactionType,
  ): Promise<CategoryBreakdownDto[]> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: { gte: start, lte: end },
        ...(type ? { type } : {}),
      },
      _sum: { amount: true },
    });
    if (grouped.length === 0) {
      return [];
    }

    const categories = await this.prisma.category.findMany({
      where: { userId, id: { in: grouped.map((row) => row.categoryId) } },
    });
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const total = grouped.reduce((acc, row) => acc + toNumber(row._sum.amount), 0);

    return grouped
      .map((row) => {
        const category = categoryMap.get(row.categoryId);
        const amount = toNumber(row._sum.amount);
        return {
          categoryId: row.categoryId,
          name: category?.name ?? 'Sin categoría',
          color: category?.color ?? '#9B9BA8',
          amount: round(amount, 2),
          percentage: total === 0 ? 0 : round((amount / total) * 100, 1),
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  private labelFor(bucket: Date, interval: 'day' | 'week' | 'month'): string {
    if (interval === 'month') {
      return MONTHS_ES[bucket.getUTCMonth()];
    }
    if (interval === 'week') {
      const year = bucket.getUTCFullYear();
      const week = this.isoWeek(bucket);
      return `${year}-W${String(week).padStart(2, '0')}`;
    }
    return bucket.toISOString().slice(0, 10);
  }

  private isoWeek(date: Date): number {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNumber = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNumber + 3);
    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
    const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);
    return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  }
}
