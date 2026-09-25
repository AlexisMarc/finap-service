# Proposal

## Why

El proyecto Finap define el contrato del frontend en `docs/api/` (endpoints, tipos y ejemplos) pero aún no existe un backend que lo implemente. Sin una API real el frontend depende de mocks y no puede persistir ni analizar datos. Este cambio introduce el servicio backend en NestJS con base de datos en Neon (PostgreSQL serverless) que cumple ese contrato.

## What Changes

- Crear un backend NestJS en la raíz del repositorio, exponiendo la API bajo `/api/v1` según `docs/api/`.
- Persistir los datos en Neon PostgreSQL usando Prisma como ORM con migraciones versionadas, siguiendo el skill `neon-postgres` para el aprovisionamiento, las conexiones pooled/direct y las migraciones.
- Aprovisionar el proyecto Neon y los entornos mediante el flujo del skill: reutilizar un `DATABASE_URL` existente o resolverlo con la CLI/MCP, guardar `DATABASE_URL` (pooled) y `DATABASE_URL_UNPOOLED` (direct) en `.env`, y usar ramas (branching) para probar migraciones y entornos de preview.
- Implementar autenticación con JWT propio (email + password), guard global y endpoint de sesión.
- Implementar los dominios de negocio: cuentas, movimientos, categorías, presupuestos, deudas, análisis, dashboard y asistente.
- Calcular agregados (balance, tendencia, desglose por categoría, evolución) en el servidor sobre los movimientos persistidos.
- Exponer el asistente IA mediante una interfaz de proveedor con implementación determinista basada en reglas; la integración con un LLM real será opcional y configurable por variable de entorno.
- Incluir datos semilla (seed) coherentes con `docs/api/examples.md` para desarrollo y pruebas.
- Estandarizar errores con el formato `{ error: { code, message, details? } }` y validación de entrada.
- **BREAKING**: no aplica; es un servicio nuevo y no hay backend previo.

## Capabilities

### New Capabilities

- `auth`: inicio y cierre de sesión y consulta de sesión (`POST /auth/login`, `POST /auth/logout`, `GET /auth/session`), emisión y validación de JWT.
- `accounts`: perfil del usuario (`GET/PATCH /me`) y listado de cuentas (`GET /accounts`).
- `transactions`: CRUD y listado paginado/filtrado de movimientos (`/transactions`).
- `categories`: CRUD de categorías (`/categories`).
- `budgets`: CRUD y consulta mensual de presupuestos (`/budgets`), incluyendo el gasto acumulado (`spent`).
- `debts`: CRUD de deudas y registro de pagos (`/debts`, `POST /debts/:id/payments`).
- `analytics`: resumen, desglose por categoría, evolución temporal y resumen de dashboard (`/analysis/*`, `/dashboard`).
- `assistant`: respuesta a preguntas en lenguaje natural sobre los datos financieros (`POST /assistant/ask`).

### Modified Capabilities

- Ninguna: no existen specs previas en `openspec/specs/`.

## Impact

- **Código**: nuevo servicio backend (NestJS) en la raíz del repo: `src/`, `prisma/`, configuración de build y tests. No modifica `docs/` (el contrato se toma como entrada).
- **APIs**: implementa `/api/v1` según `docs/api/endpoints.md` y `docs/api/types.md`.
- **Dependencias**: `@nestjs/*`, `@prisma/client`, `prisma`, `@nestjs/jwt`, `bcrypt`, `class-validator`, `class-transformer`, `@nestjs/swagger` (opcional), entre otras.
- **Infraestructura**: requiere `DATABASE_URL` (pooled) y `DATABASE_URL_UNPOOLED` (direct, para migraciones) de Neon y `JWT_SECRET`; opcionalmente credenciales de proveedor LLM para el asistente. El aprovisionamiento y el diagnóstico de Neon se guían por el skill `neon-postgres`.
- **Compatibilidad**: el backend debe respetar los tipos de `src/services/types.ts` referidos en `docs/api/types.md`.
