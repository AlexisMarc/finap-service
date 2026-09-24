import type {
  Account as PrismaAccount,
  Budget as PrismaBudget,
  Category as PrismaCategory,
  Debt as PrismaDebt,
  Transaction as PrismaTransaction,
  User as PrismaUser,
} from '@prisma/client';
import type {
  AccountDto,
  BudgetDto,
  CategoryDto,
  Currency,
  DebtDto,
  TransactionDto,
  TransactionType,
  UserDto,
} from './api-types.js';

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}

export function toDateOnly(value: Date | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.toISOString().slice(0, 10);
}

export function mapUser(user: PrismaUser): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    currency: user.currency as Currency,
  };
}

export function mapAccount(account: PrismaAccount): AccountDto {
  return {
    id: account.id,
    name: account.name,
    balance: toNumber(account.balance),
    currency: account.currency as Currency,
  };
}

export function mapCategory(category: PrismaCategory): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
  };
}

export function mapTransaction(transaction: PrismaTransaction): TransactionDto {
  return {
    id: transaction.id,
    type: transaction.type as TransactionType,
    amount: toNumber(transaction.amount),
    categoryId: transaction.categoryId,
    date: toDateOnly(transaction.date) ?? '',
    ...(transaction.note ? { note: transaction.note } : {}),
  };
}

export function mapBudget(budget: PrismaBudget, spent: number): BudgetDto {
  return {
    id: budget.id,
    categoryId: budget.categoryId,
    month: budget.month,
    limit: toNumber(budget.limit),
    spent,
  };
}

export function mapDebt(debt: PrismaDebt): DebtDto {
  return {
    id: debt.id,
    name: debt.name,
    total: toNumber(debt.total),
    paid: toNumber(debt.paid),
    ...(debt.dueDate ? { dueDate: toDateOnly(debt.dueDate) } : {}),
  };
}
