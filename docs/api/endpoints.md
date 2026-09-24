# Endpoints

Ver convenciones en [README](./README.md) y tipos en [types](./types.md).

## Autenticación

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| POST | `/auth/login` | `{ email, password }` | `200 AuthSession` |
| POST | `/auth/logout` | — | `204` |
| GET | `/auth/session` | — | `200 { user: User }` |

## Usuario y cuentas

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| GET | `/me` | — | `200 User` |
| PATCH | `/me` | `Partial<User>` | `200 User` |
| GET | `/accounts` | — | `200 Account[]` |

## Movimientos

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| GET | `/transactions` | query (abajo) | `200 Paginated<Transaction>` |
| POST | `/transactions` | `TransactionInput` | `201 Transaction` |
| PATCH | `/transactions/:id` | `Partial<TransactionInput>` | `200 Transaction` |
| DELETE | `/transactions/:id` | — | `204` |

**Query de `GET /transactions`**: `type` (`income`\|`expense`\|`debt`), `categoryId`, `from`, `to`, `search`, `sort` (`date`\|`amount`), `order` (`asc`\|`desc`), `page`, `pageSize`.

## Categorías

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| GET | `/categories` | — | `200 Category[]` |
| POST | `/categories` | `CategoryInput` | `201 Category` |
| PATCH | `/categories/:id` | `Partial<CategoryInput>` | `200 Category` |
| DELETE | `/categories/:id` | — | `204` |

## Presupuestos

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| GET | `/budgets` | query `month=YYYY-MM` | `200 Budget[]` |
| POST | `/budgets` | `BudgetInput` | `201 Budget` |
| PATCH | `/budgets/:id` | `Partial<BudgetInput>` | `200 Budget` |
| DELETE | `/budgets/:id` | — | `204` |

## Deudas

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| GET | `/debts` | — | `200 Debt[]` |
| POST | `/debts` | `DebtInput` | `201 Debt` |
| PATCH | `/debts/:id` | `Partial<DebtInput>` | `200 Debt` |
| POST | `/debts/:id/payments` | `{ amount }` | `200 Debt` |
| DELETE | `/debts/:id` | — | `204` |

## Análisis

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| GET | `/analysis/summary` | query `from`, `to` | `200 AnalysisSummary` |
| GET | `/analysis/by-category` | query `from`, `to`, `type` | `200 CategoryBreakdown[]` |
| GET | `/analysis/evolution` | query `from`, `to`, `interval` (`day`\|`week`\|`month`) | `200 AnalysisEvolution` |

## Dashboard

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| GET | `/dashboard` | query `month=YYYY-MM` | `200 DashboardSummary` |

## Asistente IA

| Método | Ruta | Request | Response |
|--------|------|---------|----------|
| POST | `/assistant/ask` | `{ question, context? }` | `200 { answer: string }` |
