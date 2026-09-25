# Finap Service

Backend NestJS de Finap. Implementa la API `/api/v1` descrita en [`docs/api/`](../docs/api/) y persiste los datos en **Neon PostgreSQL** mediante Prisma.

## Requisitos

- Node.js 20+ (probado con v24)
- Una base de datos Neon y su cadena de conexión
- Opcional: [Neon CLI](https://neon.com/docs/cli) (`neonctl`) para aprovisionar y diagnosticar

## Configuración

Copia `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Conexión **pooled** (hostname con `-pooler`). La usa la aplicación. |
| `DATABASE_URL_UNPOOLED` | Conexión **direct** (sin `-pooler`). La usan Prisma Migrate, dumps y tareas de sesión. |
| `JWT_SECRET` | Secreto para firmar los JWT. |
| `JWT_EXPIRES_IN` | Expiración del token (por defecto `7d`). |
| `PORT` | Puerto HTTP (por defecto `3000`). |
| `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | Opcionales: activan el proveedor LLM del asistente. Sin ellos se usa el proveedor determinista. |

### Pooled vs. direct (Neon)

Neon expone dos cadenas para la misma base de datos:

- **Pooled** (`DATABASE_URL`, con `-pooler`): tráfico normal de la aplicación. Pasa por PgBouncer en modo transacción.
- **Direct** (`DATABASE_URL_UNPOOLED`): migraciones, `pg_dump`/`pg_restore`, replicación y operaciones que dependen de estado de sesión. PgBouncer no soporta operaciones a nivel de sesión, por eso las migraciones usan la cadena directa (`directUrl` en `prisma/schema.prisma`).

En un proyecto Neon existente puedes traer las credenciales con `neonctl env pull --branch <rama>` o `neonctl connection-string --branch <rama> [--pooled]`. Si usas ramas (branching), apunta `.env` a la rama de desarrollo mientras trabajas.

## Puesta en marcha

```bash
npm install
npx prisma migrate deploy   # aplica migraciones (usa la conexión directa)
npx prisma db seed          # datos de ejemplo (idempotente)
npm run start:dev
```

La API queda en `http://localhost:3000/api/v1`. Usuario del seed: `marcos@finap.app` / `secret123`.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Servidor en modo watch |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta `dist/main` |
| `npm run lint` | oxlint |
| `npm test` | Tests unitarios (vitest) |
| `npm run test:e2e` | Tests de contrato e2e (requiere base de datos) |
| `npx prisma migrate dev` | Crea/aplica migraciones en desarrollo |
| `npx prisma db seed` | Carga datos de ejemplo |

## Endpoints

Base URL `/api/v1`. Autenticación `Authorization: Bearer <token>` salvo `POST /auth/login` y `GET /health`.

`auth` · `me` · `accounts` · `transactions` · `categories` · `budgets` · `debts` · `analysis` · `dashboard` · `assistant`.

El contrato completo (tipos y ejemplos) está en [`docs/api/`](../docs/api/).

## Estructura

```
src/
  common/        filtro de errores, pipe de validación, guard JWT, tipos y serializers
  prisma/        PrismaModule/PrismaService
  auth/          login, logout, session
  accounts/      /me y /accounts
  categories/    CRUD de categorías
  transactions/  CRUD y listado paginado
  budgets/       CRUD y gasto acumulado
  debts/         CRUD y pagos
  analytics/     analysis/* y dashboard
  assistant/     proveedor determinista y LLM opcional
prisma/          schema.prisma, migraciones y seed
```

## Conexión a Neon

La aplicación usa Prisma con el **driver adapter `@prisma/adapter-pg`** (node-postgres) en lugar del engine binario. Así el pool reutiliza conexiones y el runtime usa el resolver DNS de Node, lo que permite forzar IPv4.

En `src/prisma/prisma.service.ts` se ejecuta `dns.setDefaultResultOrder('ipv4first')`: Neon también publica direcciones IPv6 y algunas redes no enrutan IPv6 al puerto 5432, lo que provoca `P1001: Can't reach database server`. Forzando IPv4 se evita. El seed hace lo mismo.

### Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `P1001: Can't reach database server ...:5432` | La red no enruta IPv6 al 5432 y se elige AAAA | Ya se fuerza `ipv4first` en `PrismaService` y `seed.ts`. Verifica salida IPv4 con `node -e "require('dns').resolve4('<host>',console.log)"`. |
| El primer request tarda | La computa de Neon estaba suspendida (scale-to-zero) | Es normal: el arranque en frío tarda unos cientos de ms. |
| `prisma migrate` no conecta pero la app sí | El CLI usa el engine binario (no el resolver de Node) | Ejecuta `npx prisma migrate deploy` con la red en IPv4, o usa la conexión directa. |

