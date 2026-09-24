# Design

## Context

Ver `proposal.md` para la motivación. El repositorio hoy solo contiene `docs/api/` (contrato del frontend) y el scaffold de OpenSpec; no existe código de backend. El contrato (`docs/api/endpoints.md`, `types.md`, `examples.md`) es la entrada vinculante: define rutas `/api/v1`, payloads, códigos de estado y el formato de error `{ error: { code, message, details? } }`.

Restricciones relevantes:

- Base de datos en Neon (PostgreSQL serverless) con conexiones potencialmente efímeras.
- Debe existir un modo de desarrollo/pruebas que no dependa de servicios externos (LLM).
- Los tipos del frontend (`TransactionType`, `Currency`, etc.) deben respetarse tal cual.

## Goals / Non-Goals

**Goals:**

- Servicio NestJS modular que implemente exactamente el contrato de `docs/api/`.
- Persistencia en Neon mediante Prisma con migraciones versionadas y seed reproducible.
- Capa de agregación eficiente (no traer todos los movimientos al proceso para sumar).
- Autenticación JWT propia y aislamiento de datos por usuario.
- Asistente desacoplado tras una interfaz, con fallback determinista.

**Non-Goals:**

- Frontend o cambios en `docs/api/`.
- Multi-tenant, roles/permisos granulares o colaboración entre usuarios.
- Integración obligatoria con un LLM real (queda opcional).
- Despliegue/infra concretos (IaC, CI/CD) más allá de variables de entorno.

## Decisions

### 1. Monolito modular NestJS en la raíz del repo

`src/main.ts` con prefijo global `api/v1`, y módulos por dominio: `auth`, `users` (perfil/`/me`), `accounts`, `transactions`, `categories`, `budgets`, `debts`, `analytics`, `assistant`, más `prisma` y `common`.

- **Por qué**: un solo servicio corresponde al alcance; los módulos por dominio mantienen límites claros y facilitan tests.
- **Alternativa**: separar analytics en un servicio aparte — descartada, sobredimensiona el alcance sin beneficio actual.

### 2. Prisma + driver adapter de Neon

Usar Prisma Client con `@prisma/adapter-neon` + `@neondatabase/serverless`, alimentado por `DATABASE_URL` (endpoint pooled) y `DIRECT_URL` para migraciones.

- **Por qué**: el adapter de Neon funciona bien con conexiones serverless y evita problemas de pooling; Prisma aporta migraciones y tipado del modelo.
- **Alternativa**: Drizzle (más ligero, menos opinado) — descartado por preferencia de migraciones y ecosistema; `pg` directo — descartado por falta de tipado/migraciones.

### 3. Modelo de datos relacional por usuario

Entidades: `User`, `Account`, `Category`, `Transaction`, `Budget`, `Debt`, `DebtPayment`. Todas las entidades de negocio llevan `userId` con relación a `User` y índices por `(userId, date)`, `(userId, categoryId)`, `(userId, month)`.

- Montos con `Decimal(14,2)`; el signo lo da `type` (`income|expense|debt`), `amount` siempre positivo.
- `Budget.spent` **no** se persiste: se calcula por agregación. Evita desincronización.
- `DebtPayment` registra abonos; `Debt.paid` se persiste como acumulado para lecturas rápidas y se actualiza en la misma transacción que el pago.
- **Por qué**: consistencia y consultas de dashboard baratas.

### 4. Contrato de error y validación centralizados

`ValidationPipe` global (`whitelist`, `transform`) + un `HttpExceptionFilter` que normaliza toda salida de error al shape `{ error: { code, message, details? } }`. Errores de validación → `422 validation_error`; no autenticado → `401 unauthorized`; no encontrado → `404 not_found`; conflicto → `409 conflict`.

- **Por qué**: el frontend depende de un único formato; centralizarlo evita divergencias por módulo.
- **Alternativa**: mapear en cada controlador — descartada por repetitiva y propensa a inconsistencias.

### 5. Autenticación JWT propia

`AuthGuard` global con decorador `@Public()` para login. Contraseñas con `bcrypt`; token JWT HS256 (`JWT_SECRET`, expiración configurable). `sub` = `userId`. Las consultas filtran siempre por el usuario autenticado.

- **Por qué**: el contrato exige `POST /auth/login` con email/password y `Authorization: Bearer`.
- **Alternativa**: proveedor externo (Supabase/Neon Auth) — descartado para no acoplar el contrato a un tercero.

### 6. Serialización y tipos de respuesta

Mapeadores por dominio convierten entidades Prisma a los tipos de `docs/api/types.md` (excluir `passwordHash`, `Decimal → number`). Nada de exponer entidades Prisma directamente.

- **Por qué**: control explícito de la superficie de la API y de la precisión monetaria.

### 7. Paginación y filtrado

Helper común que parsea `page`/`pageSize` (con defaults y límites) y construye `where`/`orderBy`; respuesta `{ items, total, page, pageSize }`.

- **Por qué**: `GET /transactions` es la única lista paginada y conviene tenerla probada una vez.

### 8. Agregaciones en base de datos

`analytics` y `Budget.spent` usan `groupBy`/consultas agregadas de Prisma (o SQL parametrizado) filtrando por `userId` y rango de fechas; `percentage` y `trend` se calculan en el servicio a partir de esos totales.

- **Por qué**: escalar sin traer movimientos completos; `trend` compara con el periodo anterior equivalente.

### 9. Asistente tras interfaz con fallback determinista

Token de inyección `ASSISTANT_PROVIDER`. Implementación por defecto `RulesAssistantProvider` que responde con totales/desglose reales ("Vivienda (40%). Te quedan $1,240."). Si `LLM_API_KEY` está configurada, `LlmAssistantProvider` puede sustituirla sin tocar el controlador.

- **Por qué**: permite desarrollar y testear sin claves ni coste, cumpliendo el contrato.
- **Alternativa**: LLM obligatorio — descartado por dependencia externa y coste en dev/CI.

### 10. Configuración y seed

`@nestjs/config` con validación de entorno (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, opcionales). `prisma/seed.ts` carga un usuario, cuentas, categorías, movimientos, presupuestos y deudas coherentes con `docs/api/examples.md`.

- **Por qué**: onboarding inmediato y base para tests e2e.

## Risks / Trade-offs

- **Pooling/Neon**: conexiones mal configuradas provocan agotamiento de conexiones → usar endpoint pooled + adapter de Neon y `DIRECT_URL` solo para migraciones.
- **Precisión monetaria**: mezclar `number` de JS con `Decimal` puede perder precisión → mantener `Decimal` en persistencia y redondear solo al serializar.
- **`Debt.paid` desnormalizado**: puede desincronizarse → actualizar siempre dentro de una transacción que también crea `DebtPayment`, y ofrecer recomputación.
- **`trend` sin base**: periodos sin periodo anterior comparable producen `0` por diseño (documentado en la spec) → evitar división por cero y comunicarlo en UI.
- **Asistente real opcional**: no se garantiza calidad de un LLM externo → mantener el fallback determinista como comportamiento por defecto y controlar errores del proveedor.
- **Eliminación de categorías**: integridad referencial → restringir con `409` cuando haya movimientos/presupuestos, según spec.

## Migration Plan

1. Añadir dependencias y configuración; crear el proyecto NestJS sin tocar `docs/`.
2. Definir el esquema Prisma y aplicar la migración inicial contra Neon (`prisma migrate deploy`).
3. Ejecutar el seed en desarrollo.
4. Rollback: revertir la migración (`prisma migrate resolve`/migración inversa) y eliminar el servicio; al ser un backend nuevo no hay consumidores en producción.

## Open Questions

- Ninguna bloqueante: la elección concreta de proveedor LLM y su prompt pueden definirse al activar `LLM_API_KEY`, sin cambiar las specs ni el desglose de tareas.
