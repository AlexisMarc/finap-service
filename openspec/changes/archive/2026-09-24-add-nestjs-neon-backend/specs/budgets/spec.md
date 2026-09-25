# Spec Delta

## Purpose

Define límites de gasto mensuales por categoría y calcula el gasto acumulado del periodo.

## ADDED Requirements

### Requirement: Consulta de presupuestos por mes

El sistema SHALL exponer `GET /budgets` aceptando el query `month=YYYY-MM` y SHALL devolver `200 Budget[]` con el gasto acumulado (`spent`) calculado a partir de los movimientos del mes.

#### Scenario: Presupuestos del mes

- **WHEN** el usuario solicita `GET /budgets?month=2025-05`
- **THEN** el sistema responde `200` con cada `{ id, categoryId, month, limit, spent }` donde `spent` es la suma de gastos de esa categoría en el mes

#### Scenario: Mes sin movimientos

- **WHEN** el mes solicitado no tiene movimientos para una categoría presupuestada
- **THEN** el sistema devuelve `spent` igual a `0`

#### Scenario: Mes inválido

- **WHEN** el query `month` no tiene el formato `YYYY-MM`
- **THEN** el sistema responde `422` con `error.code = "validation_error"`

### Requirement: Creación de presupuestos

El sistema SHALL crear un presupuesto con `POST /budgets` a partir de `BudgetInput` y SHALL responder `201 Budget`.

#### Scenario: Creación válida

- **WHEN** el usuario envía `{ categoryId, month, limit }` con `limit` positivo y una categoría válida
- **THEN** el sistema persiste el presupuesto y responde `201` con el `Budget` creado

#### Scenario: Presupuesto duplicado

- **WHEN** el usuario crea un presupuesto para una categoría y mes que ya tienen uno
- **THEN** el sistema responde `409` con `error.code = "conflict"`

### Requirement: Actualización de presupuestos

El sistema SHALL actualizar un presupuesto con `PATCH /budgets/:id` usando `Partial<BudgetInput>` y SHALL responder `200 Budget`.

#### Scenario: Cambio de límite

- **WHEN** el usuario modifica el `limit` de un presupuesto propio
- **THEN** el sistema persiste el nuevo límite y responde `200` con el presupuesto actualizado

### Requirement: Eliminación de presupuestos

El sistema SHALL eliminar un presupuesto con `DELETE /budgets/:id` respondiendo `204`.

#### Scenario: Eliminación exitosa

- **WHEN** el usuario elimina un presupuesto propio existente
- **THEN** el sistema lo elimina y responde `204`
