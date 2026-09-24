export type TransactionType = 'income' | 'expense' | 'debt';
export type Currency = 'USD' | 'COP' | 'EUR';

export interface AuthUser {
  userId: string;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: Currency;
}

export interface AccountDto {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
}

export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface TransactionDto {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
}

export interface BudgetDto {
  id: string;
  categoryId: string;
  month: string;
  limit: number;
  spent: number;
}

export interface DebtDto {
  id: string;
  name: string;
  total: number;
  paid: number;
  dueDate?: string;
}

export interface CategoryBreakdownDto {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface AnalysisSummaryDto {
  income: number;
  expense: number;
  debt: number;
  balance: number;
  trend: number;
  categories: CategoryBreakdownDto[];
}

export interface AnalysisPointDto {
  label: string;
  income: number;
  expense: number;
}

export interface AnalysisEvolutionDto {
  points: AnalysisPointDto[];
}

export interface DashboardSummaryDto {
  balance: number;
  income: number;
  expense: number;
  trend: number;
  categories: CategoryBreakdownDto[];
  debts: DebtDto[];
  recentTransactions: TransactionDto[];
}

export interface AuthSessionDto {
  token: string;
  user: UserDto;
}

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
