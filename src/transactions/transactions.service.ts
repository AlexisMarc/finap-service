import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { notFound, validationError } from '../common/api-error.js';
import { mapTransaction } from '../common/serializers.js';
import { resolvePagination } from '../common/validation.pipe.js';
import type { PaginatedDto, TransactionDto, TransactionType } from '../common/api-types.js';
import type { CreateTransactionDto } from './dto/create-transaction.dto.js';
import type { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import type { QueryTransactionsDto } from './dto/query-transactions.dto.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: QueryTransactionsDto): Promise<PaginatedDto<TransactionDto>> {
    const pagination = resolvePagination(query.page, query.pageSize);
    const where = this.buildWhere(userId, query);
    const sortField = query.sort ?? 'date';
    const order = query.order ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: [{ [sortField]: order }, { createdAt: order }],
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map(mapTransaction),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionDto> {
    await this.assertCategory(userId, dto.categoryId);
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        type: dto.type as TransactionType,
        amount: new Prisma.Decimal(dto.amount),
        categoryId: dto.categoryId,
        date: new Date(dto.date),
        note: dto.note ?? null,
      },
    });
    return mapTransaction(transaction);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<TransactionDto> {
    await this.findOneOrFail(userId, id);
    if (dto.categoryId !== undefined) {
      await this.assertCategory(userId, dto.categoryId);
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type as TransactionType } : {}),
        ...(dto.amount !== undefined ? { amount: new Prisma.Decimal(dto.amount) } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
      },
    });
    return mapTransaction(transaction);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOneOrFail(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
  }

  private buildWhere(userId: string, query: QueryTransactionsDto): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = { userId };

    if (query.type) {
      where.type = query.type as TransactionType;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.from || query.to) {
      where.date = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { note: { contains: query.search, mode: 'insensitive' } },
        { category: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private async assertCategory(userId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, userId } });
    if (!category) {
      throw validationError({ categoryId: 'categoría inexistente' });
    }
  }

  private async findOneOrFail(userId: string, id: string): Promise<void> {
    const transaction = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!transaction) {
      throw notFound('Movimiento no encontrado');
    }
  }
}
