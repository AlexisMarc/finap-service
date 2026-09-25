# Proposal

## Why

El backend NestJS ya funciona en local contra Neon, pero no hay una configuración de despliegue, así que el frontend no puede consumir una API pública. Desplegarlo en Vercel permite publicar la API con entornos de producción y preview, secretos gestionados y una base Neon por entorno.

## What Changes

- Añadir un entrypoint serverless que expone la app NestJS como función de Vercel en el mismo dominio, manteniendo las rutas `/api/v1`.
- Añadir `vercel.json` con build, runtime, rewrites a la función y `maxDuration`.
- Configurar la ejecución en **Vercel Fluid compute** reutilizando el pool de PostgreSQL mediante `attachDatabasePool` de `@vercel/functions`, con la conexión **pooled** (`DATABASE_URL`).
- Gestionar los secretos y variables por entorno en Vercel (Production, Preview, Development): `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `JWT_SECRET` y opcionales del asistente.
- Integrar Neon con Vercel para que cada **Preview Deployment** use una **rama de Neon** propia, con respaldo manual (variables compartidas) si la integración no está disponible.
- Ejecutar las migraciones **fuera del deploy** (CI o manual) contra la conexión directa; nunca en el arranque de la función serverless.
- Ajustar el build para generar el cliente Prisma en la nube y hacer configurable CORS y `PORT` por entorno.
- Documentar el flujo de despliegue, variables y diagnóstico en el `README`.
- No cambia el contrato de la API (`docs/api/` se mantiene) ni el comportamiento funcional de los dominios existentes.

## Capabilities

### New Capabilities

- `deployment`: comportamiento del servicio desplegado en Vercel: función serverless que sirve `/api/v1`, health check sin autenticación, configuración por entorno con secretos, aislamiento por preview y manejo de la conexión a Neon en entornos efímeros.

### Modified Capabilities

- Ninguna: el contrato de las capabilities existentes (`auth`, `accounts`, `transactions`, `categories`, `budgets`, `debts`, `analytics`, `assistant`) no cambia.

## Impact

- **Código**: nuevo `api/index.ts` (handler serverless), `vercel.json`, ajustes en `package.json` (scripts y `@vercel/functions`), `src/main.ts` (bootstrap reutilizable), `.env.example` y `README.md`.
- **APIs**: se conserva `/api/v1`; se expone `GET /api/v1/health` para health checks de Vercel.
- **Dependencias**: `@vercel/functions`; ya se usa `@prisma/adapter-pg` + `pg`, compatible con Fluid compute.
- **Infraestructura/externo**: proyecto en Vercel, variables de entorno por entorno y, opcionalmente, integración Neon↔Vercel para ramas de preview.
- **Base de datos**: Neon ya provisionada; las migraciones se aplican desde CI/manual con la conexión directa.
- **Compatibilidad**: la app debe arrancar sin sistema de archivos persistente ni estado en memoria.
