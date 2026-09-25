# Analytics Specification

## Purpose
Calcula agregados financieros (resumen, desglose por categoría, evolución temporal y resumen de dashboard) a partir de los movimientos del usuario.

## Requirements

### Requirement: Resumen de análisis

El sistema SHALL exponer `GET /analysis/summary` con query `from` y `to` y SHALL devolver `200 AnalysisSummary` con `income`, `expense`, `debt`, `balance`, `trend` y `categories`.

#### Scenario: Resumen del periodo

- **WHEN** el usuario solicita `GET /analysis/summary?from=2025-05-01&to=2025-05-31`
- **THEN** el sistema responde `200` con los totales de ingresos, gastos y deuda, el balance resultante y la tendencia

#### Scenario: Periodo sin movimientos

- **WHEN** el periodo no tiene movimientos
- **THEN** el sistema responde `200` con totales en `0` y `categories` vacío

#### Scenario: Rango de fechas inválido

- **WHEN** `from` es posterior a `to` o alguna fecha es inválida
- **THEN** el sistema responde `422` con `error.code = "validation_error"`

### Requirement: Desglose por categoría

El sistema SHALL exponer `GET /analysis/by-category` con query `from`, `to` y `type` opcional, y SHALL devolver `200 CategoryBreakdown[]`.

#### Scenario: Desglose de gastos

- **WHEN** el usuario solicita `GET /analysis/by-category?from=2025-05-01&to=2025-05-31&type=expense`
- **THEN** el sistema responde `200` con `{ categoryId, name, color, amount, percentage }` por categoría, donde los porcentajes suman `100`

#### Scenario: Sin filtro de tipo

- **WHEN** el usuario omite `type`
- **THEN** el sistema incluye todos los tipos de movimiento en el desglose

### Requirement: Evolución temporal

El sistema SHALL exponer `GET /analysis/evolution` con query `from`, `to` e `interval` (`day`, `week` o `month`) y SHALL devolver `200 AnalysisEvolution` con `points`.

#### Scenario: Evolución mensual

- **WHEN** el usuario solicita `GET /analysis/evolution?from=2025-01-01&to=2025-05-31&interval=month`
- **THEN** el sistema responde `200` con un punto por mes que incluye `{ label, income, expense }`

#### Scenario: Intervalo inválido

- **WHEN** `interval` no es `day`, `week` ni `month`
- **THEN** el sistema responde `422` con `error.code = "validation_error"`

### Requirement: Resumen de dashboard

El sistema SHALL exponer `GET /dashboard` con query `month=YYYY-MM` y SHALL devolver `200 DashboardSummary` con `balance`, `income`, `expense`, `trend`, `categories`, `debts` y `recentTransactions`.

#### Scenario: Dashboard del mes

- **WHEN** el usuario solicita `GET /dashboard?month=2025-05`
- **THEN** el sistema responde `200` con el resumen del mes, el desglose por categoría, las deudas y los movimientos recientes

#### Scenario: Límite de movimientos recientes

- **WHEN** el mes tiene más movimientos que el máximo de la lista reciente
- **THEN** el sistema devuelve solo los más recientes hasta el límite definido

### Requirement: Cálculo de tendencia

El sistema SHALL calcular `trend` como la variación porcentual respecto al periodo anterior comparable y SHALL devolver `0` cuando no exista base de comparación.

#### Scenario: Sin periodo anterior

- **WHEN** no hay datos del periodo anterior
- **THEN** el sistema devuelve `trend = 0`

### Requirement: Cálculo de porcentajes de categoría

El sistema SHALL calcular `percentage` de cada categoría como su participación en el total, redondeada a una precisión definida.

#### Scenario: Porcentajes consistentes

- **WHEN** el sistema devuelve un desglose por categoría
- **THEN** cada `percentage` es proporcional al `amount` de la categoría sobre el total
