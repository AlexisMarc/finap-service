# Spec Delta

## Purpose

Gestiona los movimientos financieros (ingresos, gastos y deuda) que alimentan balances, presupuestos y análisis.

## ADDED Requirements

### Requirement: Listado paginado y filtrado de movimientos

El sistema SHALL exponer `GET /transactions` devolviendo `200 Paginated<Transaction>` según los filtros y la paginación solicitados.

#### Scenario: Paginación y orden por defecto

- **WHEN** el usuario invoca `GET /transactions` sin parámetros
- **THEN** el sistema responde `200` con `{ items, total, page, pageSize }` usando una página por defecto (1) y un tamaño de página por defecto

#### Scenario: Filtros combinados

- **WHEN** el usuario envía `type`, `categoryId`, `from`, `to` o `search`
- **THEN** el sistema filtra los movimientos por esos criterios y devuelve solo los que cumplen todos

#### Scenario: Orden explícito

- **WHEN** el usuario envía `sort` (`date` o `amount`) y `order` (`asc` o `desc`)
- **THEN** el sistema ordena los resultados por el campo y la dirección indicados

#### Scenario: Paginación fuera de rango

- **WHEN** el usuario solicita una `page` mayor al número de páginas disponibles
- **THEN** el sistema responde `200` con `items` vacío y el `total` real

### Requirement: Creación de movimientos

El sistema SHALL crear un movimiento con `POST /transactions` a partir de `TransactionInput` y SHALL responder `201 Transaction`.

#### Scenario: Creación válida

- **WHEN** el usuario envía `{ type, amount, categoryId, date, note? }` con `amount` positivo y una categoría válida
- **THEN** el sistema persiste el movimiento y responde `201` con la `Transaction` creada, incluido su `id`

#### Scenario: Validación de entrada

- **WHEN** el usuario envía `amount` no positivo o no numérico, `type` fuera de `income|expense|debt`, `date` inválida o `categoryId` inexistente
- **THEN** el sistema responde `422` con `error.code = "validation_error"` y no crea el movimiento

### Requirement: Actualización de movimientos

El sistema SHALL actualizar un movimiento mediante `PATCH /transactions/:id` con `Partial<TransactionInput>` y SHALL responder `200 Transaction`.

#### Scenario: Actualización parcial

- **WHEN** el usuario envía uno o más campos modificables de un movimiento propio
- **THEN** el sistema persiste solo esos campos y responde `200` con el movimiento actualizado

#### Scenario: Movimiento inexistente

- **WHEN** el usuario intenta actualizar un `id` que no existe o que no le pertenece
- **THEN** el sistema responde `404` con `error.code = "not_found"`

### Requirement: Eliminación de movimientos

El sistema SHALL eliminar un movimiento mediante `DELETE /transactions/:id` respondiendo `204`.

#### Scenario: Eliminación exitosa

- **WHEN** el usuario elimina un movimiento propio existente
- **THEN** el sistema lo elimina y responde `204` sin contenido

#### Scenario: Eliminación de recurso ajeno

- **WHEN** el usuario intenta eliminar un movimiento que no le pertenece
- **THEN** el sistema responde `404` o `403` y no elimina el recurso

### Requirement: Signo y moneda del importe

El sistema SHALL almacenar `amount` como valor positivo y SHALL interpretar el sentido del movimiento por el campo `type`.

#### Scenario: Gasto con importe positivo

- **WHEN** se registra un movimiento de tipo `expense` con `amount` positivo
- **THEN** el sistema lo trata como egreso en los cálculos y conserva el `amount` positivo
