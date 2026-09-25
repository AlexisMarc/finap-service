# Debts Specification

## Purpose
Registra deudas y su progreso de pago para que el usuario y el dashboard conozcan el saldo pendiente.

## Requirements

### Requirement: Listado de deudas

El sistema SHALL exponer `GET /debts` devolviendo `200 Debt[]` con las deudas del usuario autenticado.

#### Scenario: Deudas existentes

- **WHEN** el usuario autenticado invoca `GET /debts`
- **THEN** el sistema responde `200` con la lista de `{ id, name, total, paid, dueDate? }`

### Requirement: Creación de deudas

El sistema SHALL crear una deuda con `POST /debts` a partir de `DebtInput` y SHALL responder `201 Debt`.

#### Scenario: Creación válida

- **WHEN** el usuario envía `{ name, total, paid?, dueDate? }` con `total` positivo
- **THEN** el sistema persiste la deuda y responde `201` con la `Debt` creada

#### Scenario: Pago inicial mayor al total

- **WHEN** el usuario envía `paid` mayor que `total`
- **THEN** el sistema responde `422` con `error.code = "validation_error"` y no crea la deuda

### Requirement: Actualización de deudas

El sistema SHALL actualizar una deuda con `PATCH /debts/:id` usando `Partial<DebtInput>` y SHALL responder `200 Debt`.

#### Scenario: Actualización parcial

- **WHEN** el usuario modifica `name`, `total`, `paid` o `dueDate` de una deuda propia con valores válidos
- **THEN** el sistema persiste los cambios y responde `200` con la deuda actualizada

### Requirement: Registro de pagos

El sistema SHALL registrar abonos mediante `POST /debts/:id/payments` con cuerpo `{ amount }` y SHALL responder `200 Debt` con el `paid` incrementado.

#### Scenario: Pago válido

- **WHEN** el usuario envía `{ amount }` positivo a una deuda propia
- **THEN** el sistema incrementa `paid` en `amount` y responde `200` con la deuda actualizada

#### Scenario: Pago que excede el saldo pendiente

- **WHEN** el `amount` del pago hace que `paid` supere a `total`
- **THEN** el sistema responde `422` con `error.code = "validation_error"` y no registra el pago

#### Scenario: Monto inválido

- **WHEN** el usuario envía un `amount` no positivo o no numérico
- **THEN** el sistema responde `422` con `error.code = "validation_error"`

### Requirement: Eliminación de deudas

El sistema SHALL eliminar una deuda con `DELETE /debts/:id` respondiendo `204`.

#### Scenario: Eliminación exitosa

- **WHEN** el usuario elimina una deuda propia existente
- **THEN** el sistema la elimina y responde `204`
