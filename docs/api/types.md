# Tipos

Tipos esperados por el frontend (TypeScript). Deben coincidir con `src/services/types.ts`.

```ts
export type TransactionType = 'income' | 'expense' | 'debt';
export type Currency = 'USD' | 'COP' | 'EUR';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: Currency;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface CategoryInput {
  name: string;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string;
  limit: number;
  spent: number;
}

export interface BudgetInput {
  categoryId: string;
  month: string;
  limit: number;
}

export interface Debt {
  id: string;
  name: string;
  total: number;
  paid: number;
  dueDate?: string;
}

export interface DebtInput {
  name: string;
  total: number;
  paid?: number;
  dueDate?: string;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface AnalysisSummary {
  income: number;
  expense: number;
  debt: number;
  balance: number;
  trend: number;
  categories: CategoryBreakdown[];
}

export interface AnalysisPoint {
  label: string;
  income: number;
  expense: number;
}

export interface AnalysisEvolution {
  points: AnalysisPoint[];
}

export interface DashboardSummary {
  balance: number;
  income: number;
  expense: number;
  trend: number;
  categories: CategoryBreakdown[];
  debts: Debt[];
  recentTransactions: Transaction[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface AssistantAnswer {
  answer: string;
}
```
