# Design

## Context

Ver `proposal.md` para la motivación. El repositorio hoy solo contiene `docs/api/` (contrato del frontend) y el scaffold de OpenSpec; no existe código de backend. El contrato (`docs/api/endpoints.md`, `types.md`, `examples.md`) es la entrada vinculante: define rutas `/api/v1`, payloads, códigos de estado y el formato de error `{ error: { code, message, details? } }`.

Restricciones relevantes:

- Base de datos en Neon (PostgreSQL serverless) con conexiones potencialmente efímeras; el aprovisionamiento, las conexiones y las migraciones siguen el skill `neon-postgres` (`.opencode/skills/neon-postgres/SKILL.md`).
- Debe existir un modo de desarrollo/pruebas que no dependa de servicios externos (LLM).
- Los tipos del frontend (`TransactionType`, `Currency`, etc.) deben respetarse tal cual.

## Goals / Non-Goals

**Goals:**

- Servicio NestJS modular que implemente exactamente el contrato de `docs/api/`.
- Persistencia en Neon mediante Prisma con migraciones versionadas, aplicando las prácticas del skill `neon-postgres` (pooled vs direct, branching, migraciones en ramas).
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

### 2. Aprovisionamiento y entornos con el skill `neon-postgres`

Seguir el flujo de setup del skill: si ya existe un `DATABASE_URL` (prompt, entorno o repo) o un archivo `.neon`, usarlo y no crear un segundo proyecto; en caso contrario resolver organización/proyecto y conexión con la CLI (`neon`) o el MCP. Guardar las cadenas en `.env` con `neon env pull` (nombres `DATABASE_URL` y `DATABASE_URL_UNPOOLED`), leyendo el archivo antes de modificarlo. Usar ramas de Neon para entornos aislados (desarrollo/preview) y para probar migraciones contra datos similares a producción antes de aplicarlas.

- **Por qué**: evita duplicar proyectos, mantiene el esquema como código y permite validar migraciones de forma segura.
- **Alternativa**: crear un proyecto nuevo por entorno — descartada por coste y deriva de configuración.

### 3. Prisma + estrategia de conexión Neon (pooled vs direct)

Usar Prisma como ORM y migraciones. Aplicación y runtime usan la conexión **pooled** (`DATABASE_URL`, hostname con `-pooler`); las migraciones, dumps y tareas de sesión usan la conexión **direct** (`DATABASE_URL_UNPOOLED`), mapeada a `directUrl` de Prisma. El runtime usa el **driver adapter `@prisma/adapter-pg`** (node-postgres) con un pool reutilizado, adecuado para un servidor Node de larga duración. En entornos serverless/edge la alternativa es `@prisma/adapter-neon` + `@neondatabase/serverless`.

- **Por qué**: PgBouncer (transaction mode) no soporta operaciones a nivel de sesión; separar pooled y direct evita fallos silenciosos en migraciones (`prepared statement "s0" already exists`, `SET search_path` que no persiste, transacciones read-only). El skill recomienda además Drizzle para TypeScript nuevo sin elección previa; se mantiene Prisma por migraciones y tipado, aceptando la recomendación como alternativa.
- **Alternativa**: `@neondatabase/serverless` para todo — válido solo si el runtime es serverless/edge; para un servidor de larga duración, `node-postgres`/pool estándar es más simple.

### 4. Modelo de datos relacional por usuario

Entidades: `User`, `Account`, `Category`, `Transaction`, `Budget`, `Debt`, `DebtPayment`. Todas las entidades de negocio llevan `userId` con relación a `User` y índices por `(userId, date)`, `(userId, categoryId)`, `(userId, month)`.

- Montos con `Decimal(14,2)`; el signo lo da `type` (`income|expense|debt`), `amount` siempre positivo.
- `Budget.spent` **no** se persiste: se calcula por agregación. Evita desincronización.
- `DebtPayment` registra abonos; `Debt.paid` se persiste como acumulado para lecturas rápidas y se actualiza en la misma transacción que el pago.
- **Por qué**: consistencia y consultas de dashboard baratas.

### 5. Contrato de error y validación centralizados

`ValidationPipe` global (`whitelist`, `transform`) + un `HttpExceptionFilter` que normaliza toda salida de error al shape `{ error: { code, message, details? } }`. Errores de validación → `422 validation_error`; no autenticado → `401 unauthorized`; no encontrado → `404 not_found`; conflicto → `409 conflict`.

- **Por qué**: el frontend depende de un único formato; centralizarlo evita divergencias por módulo.
- **Alternativa**: mapear en cada controlador — descartada por repetitiva y propensa a inconsistencias.

### 6. Autenticación JWT propia

`AuthGuard` global con decorador `@Public()` para login. Contraseñas con `bcrypt`; token JWT HS256 (`JWT_SECRET`, expiración configurable). `sub` = `userId`. Las consultas filtran siempre por el usuario autenticado.

- **Por qué**: el contrato exige `POST /auth/login` con email/password y `Authorization: Bearer`.
- **Alternativa**: proveedor externo (Supabase/Neon Auth) — descartado para no acoplar el contrato a un tercero.

### 7. Serialización y tipos de respuesta

Mapeadores por dominio convierten entidades Prisma a los tipos de `docs/api/types.md` (excluir `passwordHash`, `Decimal → number`). Nada de exponer entidades Prisma directamente.

- **Por qué**: control explícito de la superficie de la API y de la precisión monetaria.

### 8. Paginación y filtrado

Helper común que parsea `page`/`pageSize` (con defaults y límites) y construye `where`/`orderBy`; respuesta `{ items, total, page, pageSize }`.

- **Por qué**: `GET /transactions` es la única lista paginada y conviene tenerla probada una vez.

### 9. Agregaciones en base de datos

`analytics` y `Budget.spent` usan `groupBy`/consultas agregadas de Prisma (o SQL parametrizado) filtrando por `userId` y rango de fechas; `percentage` y `trend` se calculan en el servicio a partir de esos totales.

- **Por qué**: escalar sin traer movimientos completos; `trend` compara con el periodo anterior equivalente.
- **Diagnóstico**: para consultas de análisis lentas, inspeccionar con el skill (`neon inspect db outliers|calls|seq-scans`) y `EXPLAIN (ANALYZE, BUFFERS, PREFETCH, FILECACHE)` para ver la Local File Cache de Neon; si el problema es de forma de consulta/índices, seguir `postgres-best-practices`.

### 10. Asistente tras interfaz con fallback determinista

Token de inyección `ASSISTANT_PROVIDER`. Implementación por defecto `RulesAssistantProvider` que responde con totales/desglose reales ("Vivienda (40%). Te quedan $1,240."). Si `LLM_API_KEY` está configurada, `LlmAssistantProvider` puede sustituirla sin tocar el controlador.

- **Por qué**: permite desarrollar y testear sin claves ni coste, cumpliendo el contrato.
- **Alternativa**: LLM obligatorio — descartado por dependencia externa y coste en dev/CI.

### 11. Configuración y seed

`@nestjs/config` con validación de entorno (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `JWT_SECRET`, opcionales). `prisma/seed.ts` carga un usuario, cuentas, categorías, movimientos, presupuestos y deudas coherentes con `docs/api/examples.md`.

- **Por qué**: onboarding inmediato y base para tests e2e.

### 12. Migraciones y diagnóstico guiados por el skill

Gestionar el esquema como código (Prisma Migrate). Probar cada migración en una rama de Neon contra datos similares a producción antes de aplicarla a producción, usando siempre la conexión directa. Para diagnóstico de rendimiento usar los checks predefinidos y de solo lectura de Neon (`neon inspect db ...`) antes de escribir consultas al catálogo; interpretar `unused-indexes`/`bloat` como candidatos, no como acciones automáticas. Considerar autoscaling y scale-to-zero (cold start de cientos de ms tras suspensión) al dimensionar.

- **Por qué**: reduce riesgo de migraciones destructivas y evita diagnosticar a ciegas.

## Risks / Trade-offs

- **Pooling/Neon**: usar la conexión pooled para migraciones falla de forma no evidente → pooled (`DATABASE_URL`) solo para tráfico de la app; direct (`DATABASE_URL_UNPOOLED`/`directUrl`) para migraciones, dumps y sesiones.
- **Resolución IPv6 de Neon**: el endpoint publica AAAA y una red sin salida IPv6 al 5432 produce `P1001` aun con la base activa → el runtime con `@prisma/adapter-pg` ejecuta `dns.setDefaultResultOrder('ipv4first')` (igual en el seed); verificado que IPv4 responde y IPv6 no.
- **Cold start (scale-to-zero)**: la primera consulta tras suspensión tarda cientos de ms → tolerar el pico inicial o ajustar el timeout de suspensión si la latencia importa.
- **Precisión monetaria**: mezclar `number` de JS con `Decimal` puede perder precisión → mantener `Decimal` en persistencia y redondear solo al serializar.
- **`Debt.paid` desnormalizado**: puede desincronizarse → actualizar siempre dentro de una transacción que también crea `DebtPayment`, y ofrecer recomputación.
- **`trend` sin base**: periodos sin periodo anterior comparable producen `0` por diseño (documentado en la spec) → evitar división por cero y comunicarlo en UI.
- **Asistente real opcional**: no se garantiza calidad de un LLM externo → mantener el fallback determinista como comportamiento por defecto y controlar errores del proveedor.
- **Eliminación de categorías**: integridad referencial → restringir con `409` cuando haya movimientos/presupuestos, según spec.

## Migration Plan

1. Aprovisionar/confirmar el proyecto Neon y traer credenciales con `neon env pull` (`.env` con `DATABASE_URL` y `DATABASE_URL_UNPOOLED`).
2. Añadir dependencias y configuración; crear el proyecto NestJS sin tocar `docs/`.
3. Definir el esquema Prisma y probar la migración inicial en una rama de Neon.
4. Aplicar la migración a la rama principal/desarrollo con la conexión directa (`prisma migrate deploy`) y ejecutar el seed.
5. Rollback: usar el historial de la rama de Neon (instant restore / branch from point-in-time) o revertir la migración; al ser un backend nuevo no hay consumidores en producción.

## Open Questions

- Ninguna bloqueante: la elección concreta de proveedor LLM y su prompt pueden definirse al activar `LLM_API_KEY`, sin cambiar las specs ni el desglose de tareas.
