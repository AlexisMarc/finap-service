import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { notFound, validationError } from '../common/api-error';
import { mapDebt, toNumber } from '../common/serializers';
import type { DebtDto } from '../common/api-types';
import type { CreateDebtDto } from './dto/create-debt.dto';
import type { UpdateDebtDto } from './dto/update-debt.dto';
import type { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<DebtDto[]> {
    const debts = await this.prisma.debt.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return debts.map(mapDebt);
  }

  async create(userId: string, dto: CreateDebtDto): Promise<DebtDto> {
    const paid = dto.paid ?? 0;
    if (paid > dto.total) {
      throw validationError({ paid: 'paid no puede superar a total' });
    }

    const debt = await this.prisma.debt.create({
      data: {
        userId,
        name: dto.name,
        total: new Prisma.Decimal(dto.total),
        paid: new Prisma.Decimal(paid),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
    return mapDebt(debt);
  }

  async update(userId: string, id: string, dto: UpdateDebtDto): Promise<DebtDto> {
    const current = await this.findOneOrFail(userId, id);
    const total = dto.total ?? toNumber(current.total);
    const paid = dto.paid ?? toNumber(current.paid);
    if (paid > total) {
      throw validationError({ paid: 'paid no puede superar a total' });
    }

    const debt = await this.prisma.debt.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.total !== undefined ? { total: new Prisma.Decimal(dto.total) } : {}),
        ...(dto.paid !== undefined ? { paid: new Prisma.Decimal(dto.paid) } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null } : {}),
      },
    });
    return mapDebt(debt);
  }

  async addPayment(userId: string, id: string, dto: CreatePaymentDto): Promise<DebtDto> {
    const current = await this.findOneOrFail(userId, id);
    const total = toNumber(current.total);
    const paid = toNumber(current.paid);
    if (paid + dto.amount > total) {
      throw validationError({ amount: 'el pago excede el saldo pendiente' });
    }

    const debt = await this.prisma.$transaction(async (tx) => {
      await tx.debtPayment.create({
        data: { debtId: id, amount: new Prisma.Decimal(dto.amount) },
      });
      return tx.debt.update({
        where: { id },
        data: { paid: { increment: new Prisma.Decimal(dto.amount) } },
      });
    });
    return mapDebt(debt);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOneOrFail(userId, id);
    await this.prisma.debt.delete({ where: { id } });
  }

  private async findOneOrFail(userId: string, id: string) {
    const debt = await this.prisma.debt.findFirst({ where: { id, userId } });
    if (!debt) {
      throw notFound('Deuda no encontrada');
    }
    return debt;
  }
}
