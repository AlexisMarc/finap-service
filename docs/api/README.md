# API de Finap

Contratos que el frontend necesita del backend. **No** modela base de datos: describe endpoints, tipos y ejemplos.

## Convenciones

- **Base URL**: `/api/v1`
- **Auth**: `Authorization: Bearer <token>` (excepto en login)
- **Fechas**: ISO 8601 (`2025-05-12` para días, `2025-05-12T10:00:00Z` para timestamps)
- **Moneda**: importes decimales con 2 decimales; `currency` ISO 4217 (`USD`, `COP`, `EUR`)
- **Paginación**: `page` (1-based) y `pageSize`; respuesta `{ items, total, page, pageSize }`
- **Errores**: `{ error: { code, message, details? } }` con códigos HTTP estándar
- **Signo**: `amount` siempre positivo; el campo `type` determina ingreso/gasto/deuda

## Documentos

- [Endpoints](./endpoints.md)
- [Tipos](./types.md)
- [Ejemplos](./examples.md)

## Índice de endpoints

| Área | Endpoints |
|------|-----------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/session` |
| Usuario | `GET /me` |
| Cuentas | `GET /accounts` |
| Movimientos | `GET /transactions`, `POST /transactions`, `PATCH /transactions/:id`, `DELETE /transactions/:id` |
| Categorías | `GET/POST /categories`, `PATCH/DELETE /categories/:id` |
| Presupuestos | `GET /budgets`, `POST /budgets`, `PATCH/DELETE /budgets/:id` |
| Deudas | `GET /debts`, `POST /debts`, `PATCH/DELETE /debts/:id` |
| Análisis | `GET /analysis/summary`, `GET /analysis/by-category` |
| Dashboard | `GET /dashboard` |
| Asistente IA | `POST /assistant/ask` |

Referencia de decisiones: [`docs/adr/0005-capa-de-datos.md`](../adr/0005-capa-de-datos.md).
