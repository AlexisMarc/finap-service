import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import type { AssistantInput, AssistantProvider } from './assistant-provider.interface.js';

function monthRange(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, mon - 1, 1)),
    end: new Date(Date.UTC(year, mon, 0)),
  };
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

@Injectable()
export class RulesAssistantProvider implements AssistantProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  async ask(input: AssistantInput): Promise<string> {
    const question = input.question.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    const currency = user?.currency ?? 'USD';

    if (question.includes('deuda') || question.includes('debo')) {
      return this.answerDebts(input.userId, currency);
    }

    return this.answerSpending(input.userId, currency);
  }

  private async answerDebts(userId: string, currency: string): Promise<string> {
    const debts = await this.prisma.debt.findMany({ where: { userId } });
    if (debts.length === 0) {
      return 'No tienes deudas registradas.';
    }
    const pending = debts.reduce((acc, debt) => acc + (Number(debt.total) - Number(debt.paid)), 0);
    return `Tienes ${debts.length} deuda(s) con un saldo pendiente de ${this.money(pending, currency)}.`;
  }

  private async answerSpending(userId: string, currency: string): Promise<string> {
    let summary = await this.summaryForMonth(userId, currentMonth());

    if (summary.categories.length === 0) {
      const latest = await this.prisma.transaction.findFirst({
        where: { userId, type: 'expense' },
        orderBy: { date: 'desc' },
      });
      if (latest) {
        summary = await this.summaryForMonth(userId, latest.date.toISOString().slice(0, 7));
      }
    }

    const top = summary.categories[0];
    const remaining = summary.income - summary.expense;
    if (!top) {
      return `Aún no registras gastos. Te quedan ${this.money(remaining, currency)}.`;
    }
    return `${top.name} (${top.percentage}%). Te quedan ${this.money(remaining, currency)}.`;
  }

  private async summaryForMonth(userId: string, month: string) {
    const { start, end } = monthRange(month);
    return this.analytics.getSummary(
      userId,
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10),
    );
  }

  private money(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
