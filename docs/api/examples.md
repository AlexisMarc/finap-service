# Ejemplos

Payloads de ejemplo (JSON puro) para cada endpoint. Datos coherentes con los mockups.

## Auth

### POST `/auth/login`

Request:

```json
{ "email": "marcos@finap.app", "password": "secret123" }
```

Response `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u_1",
    "name": "Marcos García",
    "email": "marcos@finap.app",
    "currency": "USD"
  }
}
```

### GET `/auth/session`

Response `200`:

```json
{
  "user": { "id": "u_1", "name": "Marcos García", "email": "marcos@finap.app", "currency": "USD" }
}
```

## Cuentas

### GET `/accounts`

Response `200`:

```json
[
  { "id": "a_1", "name": "Cuenta principal", "balance": 24580.0, "currency": "USD" }
]
```

## Movimientos

### GET `/transactions?type=expense&page=1&pageSize=2&sort=date&order=desc`

Response `200`:

```json
{
  "items": [
    { "id": "t_3", "type": "expense", "amount": 86.4, "categoryId": "c_alim", "date": "2025-05-11", "note": "Mercado Central" },
    { "id": "t_4", "type": "expense", "amount": 24.5, "categoryId": "c_transporte", "date": "2025-05-10", "note": "Uber" }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 2
}
```

### POST `/transactions`

Request:

```json
{ "type": "expense", "amount": 86.4, "categoryId": "c_alim", "date": "2025-05-11", "note": "Mercado Central" }
```

Response `201`:

```json
{ "id": "t_3", "type": "expense", "amount": 86.4, "categoryId": "c_alim", "date": "2025-05-11", "note": "Mercado Central" }
```

## Categorías

### GET `/categories`

Response `200`:

```json
[
  { "id": "c_vivienda", "name": "Vivienda", "color": "#EB001B", "icon": "home" },
  { "id": "c_alim", "name": "Alimentación", "color": "#F79E1B", "icon": "shopping" },
  { "id": "c_transporte", "name": "Transporte", "color": "#7C4DFF", "icon": "car" },
  { "id": "c_ocio", "name": "Ocio", "color": "#2FC78A", "icon": "gamepad" },
  { "id": "c_otros", "name": "Otros", "color": "#9B9BA8", "icon": "tag" }
]
```

## Presupuestos

### GET `/budgets?month=2025-05`

Response `200`:

```json
[
  { "id": "b_1", "categoryId": "c_vivienda", "month": "2025-05", "limit": 1500.0, "spent": 1392.0 },
  { "id": "b_2", "categoryId": "c_alim", "month": "2025-05", "limit": 900.0, "spent": 870.0 }
]
```

## Deudas

### GET `/debts`

Response `200`:

```json
[
  { "id": "d_auto", "name": "Préstamo auto", "total": 2800.0, "paid": 1820.0 },
  { "id": "d_personal", "name": "Préstamo personal", "total": 640.0, "paid": 576.0 },
  { "id": "d_estudio", "name": "Préstamo estudio", "total": 4550.0, "paid": 1820.0 }
]
```

## Análisis

### GET `/analysis/summary?from=2025-05-01&to=2025-05-31`

Response `200`:

```json
{
  "income": 6200.0,
  "expense": 3480.0,
  "debt": 4280.0,
  "balance": 24580.0,
  "trend": 12.5,
  "categories": [
    { "categoryId": "c_vivienda", "name": "Vivienda", "color": "#EB001B", "amount": 1392.0, "percentage": 40 },
    { "categoryId": "c_alim", "name": "Alimentación", "color": "#F79E1B", "amount": 870.0, "percentage": 25 }
  ]
}
```

### GET `/analysis/evolution?from=2025-01-01&to=2025-05-31&interval=month`

Response `200`:

```json
{
  "points": [
    { "label": "Ene", "income": 6100.0, "expense": 3200.0 },
    { "label": "Feb", "income": 5900.0, "expense": 3600.0 },
    { "label": "Mar", "income": 6400.0, "expense": 3400.0 },
    { "label": "Abr", "income": 6050.0, "expense": 3520.0 },
    { "label": "May", "income": 6200.0, "expense": 3480.0 }
  ]
}
```

## Dashboard

### GET `/dashboard?month=2025-05`

Response `200`:

```json
{
  "balance": 24580.0,
  "income": 6200.0,
  "expense": 3480.0,
  "trend": 12.5,
  "categories": [
    { "categoryId": "c_vivienda", "name": "Vivienda", "color": "#EB001B", "amount": 1392.0, "percentage": 40 },
    { "categoryId": "c_alim", "name": "Alimentación", "color": "#F79E1B", "amount": 870.0, "percentage": 25 },
    { "categoryId": "c_transporte", "name": "Transporte", "color": "#7C4DFF", "amount": 522.0, "percentage": 15 },
    { "categoryId": "c_ocio", "name": "Ocio", "color": "#2FC78A", "amount": 418.0, "percentage": 12 },
    { "categoryId": "c_otros", "name": "Otros", "color": "#9B9BA8", "amount": 278.0, "percentage": 8 }
  ],
  "debts": [
    { "id": "d_auto", "name": "Préstamo auto", "total": 2800.0, "paid": 1820.0 },
    { "id": "d_personal", "name": "Préstamo personal", "total": 640.0, "paid": 576.0 }
  ],
  "recentTransactions": [
    { "id": "t_1", "type": "income", "amount": 2800.0, "categoryId": "c_nomina", "date": "2025-05-12", "note": "Salario" },
    { "id": "t_2", "type": "expense", "amount": 980.0, "categoryId": "c_vivienda", "date": "2025-05-12", "note": "Renta" },
    { "id": "t_3", "type": "expense", "amount": 86.4, "categoryId": "c_alim", "date": "2025-05-11", "note": "Mercado Central" },
    { "id": "t_4", "type": "expense", "amount": 24.5, "categoryId": "c_transporte", "date": "2025-05-10", "note": "Uber" },
    { "id": "t_5", "type": "expense", "amount": 15.99, "categoryId": "c_suscripciones", "date": "2025-05-09", "note": "Netflix" }
  ]
}
```

## Asistente IA

### POST `/assistant/ask`

Request:

```json
{ "question": "¿En qué gasté más este mes?" }
```

Response `200`:

```json
{ "answer": "Vivienda (40%). Te quedan $1,240." }
```

## Errores

### `401 Unauthorized`

```json
{ "error": { "code": "unauthorized", "message": "Credenciales inválidas" } }
```

### `422 Unprocessable Entity`

```json
{ "error": { "code": "validation_error", "message": "Datos inválidos", "details": { "amount": "requerido" } } }
```
