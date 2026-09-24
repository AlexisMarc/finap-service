# Tasks

## 1. Setup del proyecto

- [ ] 1.1 Inicializar el proyecto NestJS en la raíz (`package.json`, `tsconfig.json`, `nest-cli.json`, `eslint`/`prettier`) y verificar que `npm run build` compila sin errores
- [ ] 1.2 Añadir dependencias (`@nestjs/common|core|platform-express|config`, `@prisma/client`, `prisma`, `@prisma/adapter-neon`, `@neondatabase/serverless`, `@nestjs/jwt`, `bcrypt`, `class-validator`, `class-transformer`) y verificar que la instalación resuelve sin conflictos
- [ ] 1.3 Crear `src/main.ts` con prefijo global `api/v1` y validar que arranca y expone un endpoint de health o raíz
- [ ] 1.4 Configurar `@nestjs/config` con validación de `DATABASE_URL`, `DIRECT_URL` y `JWT_SECRET`, y verificar que el arranque falla con un mensaje claro ante variables ausentes

## 2. Base de datos y modelo Prisma

- [ ] 2.1 Definir el esquema Prisma (`User`, `Account`, `Category`, `Transaction`, `Budget`, `Debt`, `DebtPayment`) con `userId` e índices, y verificar `npx prisma validate`
- [ ] 2.2 Configurar el cliente Prisma con el driver adapter de Neon y verificar conexión con `npx prisma db pull`/consulta de prueba
- [ ] 2.3 Generar la migración inicial con `prisma migrate dev` y verificar que se crea el directorio `prisma/migrations` y las tablas en Neon
- [ ] 2.4 Implementar `PrismaModule`/`PrismaService` e inyectarlo, verificando que la app arranca con conexión activa

## 3. Transversal (errores, validación, paginación, auth base)

- [ ] 3.1 Implementar `HttpExceptionFilter` que normaliza errores a `{ error: { code, message, details? } }` y verificar con una prueba que `401`, `404`, `409` y `422` cumplen el formato
- [ ] 3.2 Configurar `ValidationPipe` global (`whitelist`, `transform`) mapeando fallos a `422 validation_error`, verificado con un DTO de prueba
- [ ] 3.3 Implementar el helper de paginación `page`/`pageSize` con defaults y límites, verificado con tests unitarios
- [ ] 3.4 Implementar `AuthGuard` global con decorador `@Public()` y estrategia JWT (`sub` = `userId`), verificado con tests: ruta protegida sin token → `401`, con token válido → pasa
- [ ] 3.5 Implementar mapeadores/serializadores de entidad a los tipos de `docs/api/types.md` (excluir `passwordHash`, `Decimal → number`), verificado con tests unitarios

## 4. Módulo auth

- [ ] 4.1 Implementar `POST /auth/login` con verificación bcrypt y emisión de JWT, verificando `200 AuthSession` y `401` con credenciales inválidas
- [ ] 4.2 Implementar `POST /auth/logout` (204) y `GET /auth/session` (200 `{ user }`), verificando ambos con tests e2e
- [ ] 4.3 Verificar la validación de payload de login (`422 validation_error`) con tests

## 5. Módulo accounts (`/me` y `/accounts`)

- [ ] 5.1 Implementar `GET /me` y `PATCH /me` (solo campos permitidos), verificando que `id`/`email`/`password` no se modifican
- [ ] 5.2 Implementar `GET /accounts` devolviendo `Account[]` del usuario, verificado con test para usuario con y sin cuentas
- [ ] 5.3 Verificar aislamiento de datos por usuario con un test que intente acceder a recursos ajenos y reciba `404`/`403`

## 6. Módulo categories

- [ ] 6.1 Implementar `GET /categories` y `POST /categories` con validación de `name`, `color` (hex) e `icon`, verificando `201` y `422`
- [ ] 6.2 Implementar `PATCH /categories/:id` y `DELETE /categories/:id`, verificando `409 conflict` al eliminar categorías con movimientos/presupuestos asociados
- [ ] 6.3 Verificar detección de nombre duplicado (`409`) con tests

## 7. Módulo transactions

- [ ] 7.1 Implementar `POST /transactions` con validación de `amount` positivo, `type` y `categoryId` existente, verificando `201` y `422`
- [ ] 7.2 Implementar `GET /transactions` paginado con filtros (`type`, `categoryId`, `from`, `to`, `search`, `sort`, `order`), verificado con tests de filtros combinados y página fuera de rango
- [ ] 7.3 Implementar `PATCH /transactions/:id` y `DELETE /transactions/:id`, verificando `200`/`204` y `404` en recursos inexistentes o ajenos

## 8. Módulo budgets

- [ ] 8.1 Implementar `POST /budgets` con validación y detección de duplicado por categoría+mes (`409`), verificado con tests
- [ ] 8.2 Implementar `GET /budgets?month=YYYY-MM` calculando `spent` por agregación, verificado con test de mes sin movimientos (`spent = 0`) y mes inválido (`422`)
- [ ] 8.3 Implementar `PATCH /budgets/:id` y `DELETE /budgets/:id`, verificando `200`/`204`

## 9. Módulo debts

- [ ] 9.1 Implementar `GET /debts`, `POST /debts` y `PATCH /debts/:id`, verificando validación de `paid <= total` (`422`)
- [ ] 9.2 Implementar `POST /debts/:id/payments` actualizando `paid` y creando `DebtPayment` en una transacción, verificado con test de pago válido y de exceso de saldo (`422`)
- [ ] 9.3 Implementar `DELETE /debts/:id` (204), verificado con test

## 10. Módulo analytics y dashboard

- [ ] 10.1 Implementar `GET /analysis/summary` con `income`/`expense`/`debt`/`balance`/`trend`/`categories`, verificado con tests de totales y de periodo vacío
- [ ] 10.2 Implementar `GET /analysis/by-category` con filtro `type` y cálculo de `percentage`, verificado con test de que los porcentajes son proporcionales
- [ ] 10.3 Implementar `GET /analysis/evolution` con `interval` (`day`/`week`/`month`), verificado con test de puntos por mes e intervalo inválido
- [ ] 10.4 Implementar `GET /dashboard?month=YYYY-MM` con `categories`, `debts` y `recentTransactions` limitadas, verificado con tests
- [ ] 10.5 Verificar cálculo de `trend` con y sin periodo previo (retorna `0` sin base)

## 11. Módulo assistant

- [ ] 11.1 Definir la interfaz `ASSISTANT_PROVIDER` e implementar `RulesAssistantProvider` determinista basado en datos del usuario, verificado con test de pregunta representativa
- [ ] 11.2 Implementar `POST /assistant/ask` con validación de `question` (`422`) y respuesta `200 { answer }`, verificado con tests
- [ ] 11.3 Implementar `LlmAssistantProvider` opcional activado por `LLM_API_KEY` con manejo de errores controlado, verificado con test del fallback

## 12. Seed

- [ ] 12.1 Implementar `prisma/seed.ts` con datos coherentes con `docs/api/examples.md`, verificado ejecutando `npx prisma db seed` dos veces de forma idempotente

## 13. Verificación integral

- [ ] 13.1 Escribir tests e2e que recorran el flujo login → dashboard → crear movimiento, verificando los contratos de `docs/api/`
- [ ] 13.2 Ejecutar `npm run lint` y `npm run test` y verificar que pasan sin errores
- [ ] 13.3 Verificar los endpoints contra los ejemplos de `docs/api/examples.md` (payloads y códigos de estado)
