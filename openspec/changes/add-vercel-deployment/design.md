# Design

## Context

Ver `proposal.md` para la motivación. El backend es NestJS 12 (ESM, `module: nodenext`) sobre Neon con Prisma 6 y el driver adapter `@prisma/adapter-pg` (node-postgres), y ya fuerza IPv4 con `dns.setDefaultResultOrder('ipv4first')` en `src/prisma/prisma.service.ts`. El contrato de la API vive en `docs/api/` y no cambia. La app es stateless (JWT), sin uso de sistema de archivos persistente.

Restricciones de Vercel relevantes:

- Ejecución serverless con instancias efímeras y arranque en frío; el estado en memoria solo sobrevive dentro de una misma instancia caliente.
- Variables de entorno separadas por Production / Preview / Development.
- Toda ruta bajo `/api` puede convertirse en función; el prefijo global de la app es `/api/v1`.

## Goals / Non-Goals

**Goals:**

- Publicar la API en Vercel sirviendo `/api/v1` con el mismo contrato.
- Reutilizar conexiones a Neon en Fluid compute y evitar agotarlas.
- Gestionar secretos y configuración por entorno, con aislamiento en previews.
- Definir un flujo seguro de migraciones, fuera del runtime.

**Non-Goals:**

- Cambiar el contrato de la API o la lógica de negocio.
- Desplegar el frontend.
- Sustituir Neon o mover la base de datos.
- Escalar a regiones múltiples o read replicas (fuera de alcance por ahora).

## Decisions

### 1. Entrypoint catch-all `api/[...path].ts`

Exponer un único handler serverless en `api/[...path].ts` que arranca/recupera la app Nest y delega la petición. Así `/api/v1/...` llega tal cual (Vercel pasa la ruta original) y el prefijo global `api/v1` no necesita reescrituras.

- **Por qué**: evita `rewrites` frágiles y conserva las rutas exactas del contrato.
- **Alternativa**: `api/index.ts` + rewrite `/(.*) -> /api` — descartada porque altera la ruta que ve Nest.

### 2. Bootstrap cacheado

Inicializar Nest una vez por instancia (promesa a nivel de módulo) y reutilizarla en las invocaciones calientes.

- **Por qué**: reduce el arranque en frío y permite reutilizar el pool entre invocaciones.
- **Alternativa**: crear la app por petición — descartada por coste y por multiplicar conexiones.

### 3. Pool de PostgreSQL compartido + `attachDatabasePool`

Crear un `pg.Pool` a nivel de módulo (`max` bajo, `idleTimeoutMillis`), pasarlo a `PrismaPg({ pool })` y registrar `attachDatabasePool(pool)` de `@vercel/functions` cuando se ejecute en Vercel (`process.env.VERCEL`).

- **Por qué**: Fluid compute reutiliza la instancia; `attachDatabasePool` permite que Vercel cierre conexiones inactivas de forma segura. En local el pool sigue funcionando igual.
- **Alternativa**: `new PrismaPg({ connectionString })` por instancia — descartada por no permitir el cierre gestionado por la plataforma.

### 4. Configuración por entorno y CORS

Leer configuración de variables de entorno con la validación existente (`validateEnv`). Añadir `CORS_ORIGINS` (lista separada por comas) y decidir los orígenes según `VERCEL_ENV`; el health check permanece público.

- **Por qué**: un único código para local/producción/preview y CORS explícito para el frontend.
- **Alternativa**: `origin: true` — descartada por permisiva en producción.

### 5. Migraciones fuera del runtime

El build ejecuta `prisma generate && nest build`; nunca `prisma migrate`. Las migraciones se aplican como paso separado con la conexión directa (`DATABASE_URL_UNPOOLED`) mediante el script `db:migrate:deploy`, antes de promover a producción.

- **Por qué**: el arranque serverless no debe mutar el esquema ni competir entre instancias.
- **Alternativa**: migrar en cold start — descartada por riesgo de concurrencia y fallos.

### 6. Aislamiento de preview con ramas de Neon

Recomendar la integración Neon↔Vercel para que cada Preview Deployment reciba las variables de una rama de Neon propia. Respaldo: definir variables con alcance **Preview** en Vercel apuntando a una rama/base de desarrollo compartida.

- **Por qué**: probar migraciones y cambios contra datos aislados sin tocar producción.
- **Alternativa**: todos los entornos a la misma base — descartada por riesgo.

### 7. Empaquetado y versión de Node

Fijar la versión de Node con `engines` en `package.json` (20.x) y configurar `vercel.json` con `functions.maxDuration` para la función catch-all. El trazado de dependencias de Vercel (nft) incluye `src/`, el cliente Prisma y `@prisma/adapter-pg`/`pg`.

- **Por qué**: evitar divergencias de runtime y timeouts en arranques fríos.
- **Alternativa**: runtime por defecto — descartada por reproducibilidad.

## Risks / Trade-offs

- **Arranque en frío + inicialización de Prisma**: puede superar el primer request → bootstrap cacheado, pool pequeño y `maxDuration` holgado.
- **Agotamiento de conexiones**: muchas instancias concurrentes abren pools → conexión pooled, `max` bajo y `attachDatabasePool`.
- **Bundle ESM/bundling en Vercel**: el proyecto es ESM `nodenext` con extensiones `.js` en imports → validar con un deploy de preview; si el bundler falla, ajustar `functions`/`includeFiles`.
- **Migraciones manuales**: olvidarlas provoca deriva de esquema → script dedicado y paso previo documentado en el flujo de despliegue/CI.
- **Desalineación de variables en preview**: la preview podría apuntar a producción → verificar el alcance de cada variable y preferir ramas de Neon por preview.
- **CORS mal configurado**: puede bloquear el frontend → `CORS_ORIGINS` por entorno y prueba en preview.

## Migration Plan

1. Añadir entrypoint, `vercel.json`, dependencia `@vercel/functions` y scripts; mantener el build local intacto.
2. Crear/vincular el proyecto en Vercel y definir variables por entorno (Production/Preview/Development).
3. Aplicar migraciones a Neon de producción con la conexión directa (`npm run db:migrate:deploy`).
4. Desplegar una preview y verificar `GET /api/v1/health`, login y un endpoint de lectura.
5. Promover a producción.
6. Rollback: rollback instantáneo de la versión en Vercel y, si hubo migración, restaurar con el historial de Neon (instant restore / rama desde punto en el tiempo).

## Open Questions

- Ninguna bloqueante: si se decide automatizar migraciones en CI (p. ej. GitHub Actions) o mantenerlas manuales, se resuelve al implementar la tarea del script de migración sin cambiar specs ni el desglose.
