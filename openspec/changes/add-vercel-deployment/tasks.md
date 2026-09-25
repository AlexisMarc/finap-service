# Tasks

## 1. Entrypoint serverless

- [ ] 1.1 Extraer el arranque de Nest a una función reutilizable (`src/bootstrap.ts` con `createApp()`) usada por `src/main.ts` y el handler, y verificar que `npm run start:dev` sigue levantando y `GET /api/v1/health` responde `200`
- [ ] 1.2 Crear `api/[...path].ts` que inicializa/cachea la app y delega la petición, y verificar con `vercel dev` que `/api/v1/health` responde `200` y `/api/v1/auth/login` opera con el contrato
- [ ] 1.3 Verificar que una ruta inexistente bajo `/api/v1` responde `404` con `{ error: { code: "not_found", message } }` en el runtime serverless

## 2. Configuración y conexión a Neon

- [ ] 2.1 Añadir `CORS_ORIGINS` (lista separada por comas) y decidir los orígenes según `VERCEL_ENV`, y verificar con una prueba que un origen permitido recibe las cabeceras CORS y uno no permitido no
- [ ] 2.2 Refactorizar `PrismaService` para usar un `pg.Pool` a nivel de módulo pasado a `PrismaPg({ pool })` y llamar `attachDatabasePool` solo cuando `process.env.VERCEL` esté definido, y verificar que app, tests e2e y seed siguen conectando en local
- [ ] 2.3 Definir `max` e `idleTimeoutMillis` del pool y verificar que no se superan las conexiones esperadas en una ráfaga de peticiones

## 3. Build y configuración de Vercel

- [ ] 3.1 Añadir la dependencia `@vercel/functions` y `engines.node` (20.x) a `package.json` y verificar que `npm install` y `npm run build` completan
- [ ] 3.2 Crear `vercel.json` con `buildCommand` (`prisma generate && nest build`) y `functions.maxDuration` para el handler, y verificar que `vercel build` completa sin errores
- [ ] 3.3 Verificar en los logs de build de Vercel que el cliente Prisma se genera y que `src/`, `@prisma/adapter-pg` y `pg` quedan incluidos en la función

## 4. Variables de entorno y secretos

- [ ] 4.1 Actualizar `.env.example` con `CORS_ORIGINS` y las notas de configuración en Vercel, verificado revisando que no contiene secretos reales
- [ ] 4.2 Configurar en Vercel las variables por entorno (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `JWT_SECRET`, `CORS_ORIGINS`, opcionales `LLM_*`) y verificar con `vercel env ls` que existen en Production, Preview y Development
- [ ] 4.3 Verificar que `.env` sigue en `.gitignore` y que `git grep` no encuentra secretos versionados

## 5. Migraciones

- [ ] 5.1 Añadir el script `db:migrate:deploy` que aplique migraciones con la conexión directa (`DATABASE_URL_UNPOOLED`) y verificar con `npx prisma migrate status`
- [ ] 5.2 Verificar el flujo aplicando una migración en una rama de Neon con el script y comprobando que las tablas se crean en esa rama y no en producción

## 6. Aislamiento de preview con Neon

- [ ] 6.1 Conectar la integración Neon↔Vercel y verificar que un Preview Deployment recibe variables de una rama de Neon propia (revisando `VERCEL_ENV` y la cadena usada)
- [ ] 6.2 Definir el respaldo de variables de Preview apuntando a una rama de desarrollo y verificar que una preview arranca correctamente sin la integración

## 7. Despliegue y verificación

- [ ] 7.1 Desplegar una preview y verificar `GET /api/v1/health`, login y un endpoint de lectura contra el contrato
- [ ] 7.2 Verificar que una operación de escritura en la preview afecta solo a su base/rama aislada y no a producción
- [ ] 7.3 Promover a producción y verificar `GET /api/v1/health`, login y `GET /api/v1/dashboard?month=YYYY-MM`
- [ ] 7.4 Verificar reutilización de conexiones con una ráfaga de peticiones y que no se agotan las conexiones de Neon

## 8. Documentación

- [ ] 8.1 Documentar en `README.md` el flujo de despliegue en Vercel (variables, migraciones, previews con ramas, rollback) y verificar siguiendo los pasos desde cero
