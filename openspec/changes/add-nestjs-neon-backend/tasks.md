# Tasks

## 1. Setup del proyecto

- [ ] 1.1 Inicializar el proyecto NestJS en la raíz (`package.json`, `tsconfig.json`, `nest-cli.json`, `eslint`/`prettier`) y verificar que `npm run build` compila sin errores
- [ ] 1.2 Añadir dependencias (`@nestjs/common|core|platform-express|config`, `@prisma/client`, `prisma`, `@nestjs/jwt`, `bcrypt`, `class-validator`, `class-transformer`; y `@prisma/adapter-neon` + `@neondatabase/serverless` solo si el runtime es serverless/edge) y verificar que la instalación resuelve sin conflictos
- [ ] 1.3 Crear `src/main.ts` con prefijo global `api/v1` y validar que arranca y expone un endpoint de health o raíz
- [ ] 1.4 Configurar `@nestjs/config` con validación de `DATABASE_URL`, `DATABASE_URL_UNPOOLED` y `JWT_SECRET`, y verificar que el arranque falla con un mensaje claro ante variables ausentes

## 2. Aprovisionamiento Neon (skill `neon-postgres`)

- [ ] 2.1 Reutilizar el `DATABASE_URL` existente o resolver la organización/proyecto de Neon con la CLI/MCP, verificando que `neon` resuelve el contexto (o que existe `.neon`/`.env`)
- [ ] 2.2 Traer credenciales con `neon env pull` a `.env` (leyendo el archivo antes de modificarlo) y verificar que `DATABASE_URL` (pooled, con `-pooler`) y `DATABASE_URL_UNPOOLED` (direct) conectan
- [ ] 2.3 Crear una rama de Neon para desarrollo/pruebas y verificar con la CLI que existe y tiene su propio endpoint
- [ ] 2.4 Documentar en el README del backend qué cadena usa la app (pooled) y cuál usan migraciones/dumps (direct)

## 3. Base de datos y modelo Prisma

- [ ] 3.1 Definir el esquema Prisma (`User`, `Account`, `Category`, `Transaction`, `Budget`, `Debt`, `DebtPayment`) con `userId` e índices, y verificar `npx prisma validate`
- [ ] 3.2 Configurar Prisma con `url = DATABASE_URL` (pooled) y `directUrl = DATABASE_URL_UNPOOLED`, y verificar conexión con una consulta de prueba
- [ ] 3.3 Generar la migración inicial y probarla en la rama de Neon con la conexión directa (`prisma migrate dev/deploy`), verificando que se crea `prisma/migrations` y las tablas en la rama
- [ ] 3.4 Aplicar la migración a la rama de desarrollo con `DATABASE_URL_UNPOOLED` y verificar que las tablas existen
- [ ] 3.5 Implementar `PrismaModule`/`PrismaService` e inyectarlo, verificando que la app arranca con conexión activa

## 4. Transversal (errores, validación, paginación, auth base)

- [ ] 4.1 Implementar `HttpExceptionFilter` que normaliza errores a `{ error: { code, message, details? } }` y verificar con una prueba que `401`, `404`, `409` y `422` cumplen el formato
- [ ] 4.2 Configurar `ValidationPipe` global (`whitelist`, `transform`) mapeando fallos a `422 validation_error`, verificado con un DTO de prueba
- [ ] 4.3 Implementar el helper de paginación `page`/`pageSize` con defaults y límites, verificado con tests unitarios
- [ ] 4.4 Implementar `AuthGuard` global con decorador `@Public()` y estrategia JWT (`sub` = `userId`), verificado con tests: ruta protegida sin token → `401`, con token válido → pasa
- [ ] 4.5 Implementar mapeadores/serializadores de entidad a los tipos de `docs/api/types.md` (excluir `passwordHash`, `Decimal → number`), verificado con tests unitarios

## 5. Módulo auth

- [ ] 5.1 Implementar `POST /auth/login` con verificación bcrypt y emisión de JWT, verificando `200 AuthSession` y `401` con credenciales inválidas
- [ ] 5.2 Implementar `POST /auth/logout` (204) y `GET /auth/session` (200 `{ user }`), verificando ambos con tests e2e
- [ ] 5.3 Verificar la validación de payload de login (`422 validation_error`) con tests

## 6. Módulo accounts (`/me` y `/accounts`)

- [ ] 6.1 Implementar `GET /me` y `PATCH /me` (solo campos permitidos), verificando que `id`/`email`/`password` no se modifican
- [ ] 6.2 Implementar `GET /accounts` devolviendo `Account[]` del usuario, verificado con test para usuario con y sin cuentas
- [ ] 6.3 Verificar aislamiento de datos por usuario con un test que intente acceder a recursos ajenos y reciba `404`/`403`

## 7. Módulo categories

- [ ] 7.1 Implementar `GET /categories` y `POST /categories` con validación de `name`, `color` (hex) e `icon`, verificando `201` y `422`
- [ ] 7.2 Implementar `PATCH /categories/:id` y `DELETE /categories/:id`, verificando `409 conflict` al eliminar categorías con movimientos/presupuestos asociados
- [ ] 7.3 Verificar detección de nombre duplicado (`409`) con tests

## 8. Módulo transactions

- [ ] 8.1 Implementar `POST /transactions` con validación de `amount` positivo, `type` y `categoryId` existente, verificando `201` y `422`
- [ ] 8.2 Implementar `GET /transactions` paginado con filtros (`type`, `categoryId`, `from`, `to`, `search`, `sort`, `order`), verificado con tests de filtros combinados y página fuera de rango
- [ ] 8.3 Implementar `PATCH /transactions/:id` y `DELETE /transactions/:id`, verificando `200`/`204` y `404` en recursos inexistentes o ajenos

## 9. Módulo budgets

- [ ] 9.1 Implementar `POST /budgets` con validación y detección de duplicado por categoría+mes (`409`), verificado con tests
- [ ] 9.2 Implementar `GET /budgets?month=YYYY-MM` calculando `spent` por agregación, verificado con test de mes sin movimientos (`spent = 0`) y mes inválido (`422`)
- [ ] 9.3 Implementar `PATCH /budgets/:id` y `DELETE /budgets/:id`, verificando `200`/`204`

## 10. Módulo debts

- [ ] 10.1 Implementar `GET /debts`, `POST /debts` y `PATCH /debts/:id`, verificando validación de `paid <= total` (`422`)
- [ ] 10.2 Implementar `POST /debts/:id/payments` actualizando `paid` y creando `DebtPayment` en una transacción, verificado con test de pago válido y de exceso de saldo (`422`)
- [ ] 10.3 Implementar `DELETE /debts/:id` (204), verificado con test

## 11. Módulo analytics y dashboard

- [ ] 11.1 Implementar `GET /analysis/summary` con `income`/`expense`/`debt`/`balance`/`trend`/`categories`, verificado con tests de totales y de periodo vacío
- [ ] 11.2 Implementar `GET /analysis/by-category` con filtro `type` y cálculo de `percentage`, verificado con test de que los porcentajes son proporcionales
- [ ] 11.3 Implementar `GET /analysis/evolution` con `interval` (`day`/`week`/`month`), verificado con test de puntos por mes e intervalo inválido
- [ ] 11.4 Implementar `GET /dashboard?month=YYYY-MM` con `categories`, `debts` y `recentTransactions` limitadas, verificado con tests
- [ ] 11.5 Verificar cálculo de `trend` con y sin periodo previo (retorna `0` sin base)

## 12. Módulo assistant

- [ ] 12.1 Definir la interfaz `ASSISTANT_PROVIDER` e implementar `RulesAssistantProvider` determinista basado en datos del usuario, verificado con test de pregunta representativa
- [ ] 12.2 Implementar `POST /assistant/ask` con validación de `question` (`422`) y respuesta `200 { answer }`, verificado con tests
- [ ] 12.3 Implementar `LlmAssistantProvider` opcional activado por `LLM_API_KEY` con manejo de errores controlado, verificado con test del fallback

## 13. Seed

- [ ] 13.1 Implementar `prisma/seed.ts` con datos coherentes con `docs/api/examples.md`, verificado ejecutando `npx prisma db seed` dos veces de forma idempotente

## 14. Verificación integral

- [ ] 14.1 Escribir tests e2e que recorran el flujo login → dashboard → crear movimiento, verificando los contratos de `docs/api/`
- [ ] 14.2 Ejecutar `npm run lint` y `npm run test` y verificar que pasan sin errores
- [ ] 14.3 Verificar los endpoints contra los ejemplos de `docs/api/examples.md` (payloads y códigos de estado)
- [ ] 14.4 Diagnosticar el rendimiento de las consultas de analytics con `neon inspect db` (`outliers`, `seq-scans`, `lfc-hit-rate`) y verificar que no hay escaneos problemáticos
