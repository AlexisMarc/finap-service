import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { conflict, notFound, validationError } from '../common/api-error.js';
import { mapBudget, toNumber } from '../common/serializers.js';
import type { BudgetDto } from '../common/api-types.js';
import type { CreateBudgetDto } from './dto/create-budget.dto.js';
import type { UpdateBudgetDto } from './dto/update-budget.dto.js';

function monthRange(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 1));
  return { start, end };
}

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, month: string): Promise<BudgetDto[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, month },
      orderBy: { createdAt: 'asc' },
    });
    if (budgets.length === 0) {
      return [];
    }

    const { start, end } = monthRange(month);
    const spentByCategory = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'expense',
        categoryId: { in: budgets.map((budget) => budget.categoryId) },
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });
    const spentMap = new Map(
      spentByCategory.map((row) => [row.categoryId, toNumber(row._sum.amount)]),
    );

    return budgets.map((budget) => mapBudget(budget, spentMap.get(budget.categoryId) ?? 0));
  }

  async create(userId: string, dto: CreateBudgetDto): Promise<BudgetDto> {
    await this.assertCategory(userId, dto.categoryId);
    const duplicate = await this.prisma.budget.findFirst({
      where: { userId, categoryId: dto.categoryId, month: dto.month },
    });
    if (duplicate) {
      throw conflict('Ya existe un presupuesto para esa categoría y mes');
    }

    const budget = await this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        month: dto.month,
        limit: new Prisma.Decimal(dto.limit),
      },
    });
    const spent = await this.spentFor(userId, budget.categoryId, budget.month);
    return mapBudget(budget, spent);
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto): Promise<BudgetDto> {
    const current = await this.findOneOrFail(userId, id);
    const categoryId = dto.categoryId ?? current.categoryId;
    const month = dto.month ?? current.month;

    if (dto.categoryId !== undefined) {
      await this.assertCategory(userId, dto.categoryId);
    }
    if (categoryId !== current.categoryId || month !== current.month) {
      const duplicate = await this.prisma.budget.findFirst({
        where: { userId, categoryId, month, NOT: { id } },
      });
      if (duplicate) {
        throw conflict('Ya existe un presupuesto para esa categoría y mes');
      }
    }

    const budget = await this.prisma.budget.update({
      where: { id },
      data: {
        categoryId,
        month,
        ...(dto.limit !== undefined ? { limit: new Prisma.Decimal(dto.limit) } : {}),
      },
    });
    const spent = await this.spentFor(userId, budget.categoryId, budget.month);
    return mapBudget(budget, spent);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOneOrFail(userId, id);
    await this.prisma.budget.delete({ where: { id } });
  }

  private async spentFor(userId: string, categoryId: string, month: string): Promise<number> {
    const { start, end } = monthRange(month);
    const result = await this.prisma.transaction.aggregate({
      where: { userId, type: 'expense', categoryId, date: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    return toNumber(result._sum.amount);
  }

  private async assertCategory(userId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, userId } });
    if (!category) {
      throw validationError({ categoryId: 'categoría inexistente' });
    }
  }

  private async findOneOrFail(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) {
      throw notFound('Presupuesto no encontrado');
    }
    return budget;
  }
}
