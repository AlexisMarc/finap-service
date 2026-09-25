# Deployment Specification

## Purpose
Define cómo debe comportarse el servicio Finap cuando se ejecuta desplegado en Vercel: función serverless que sirve la API, configuración por entorno con secretos, salud pública, conexión a Neon en ejecución efímera y aislamiento de los entornos de preview.

## Requirements

### Requirement: Servicio de la API como función serverless

El servicio desplegado SHALL exponer toda la API bajo `/api/v1` desde una función de Vercel, y SHALL responder con el mismo contrato que en local.

#### Scenario: Petición a un endpoint de la API

- **WHEN** un cliente llama a `/api/v1/<ruta>` en el dominio de Vercel
- **THEN** la función serverless enruta la petición a la aplicación NestJS y devuelve la respuesta del contrato

#### Scenario: Ruta inexistente

- **WHEN** un cliente llama a una ruta que no existe bajo `/api/v1`
- **THEN** el servicio responde `404` con el formato `{ error: { code: "not_found", message } }`

### Requirement: Health check público

El servicio SHALL exponer `GET /api/v1/health` sin autenticación y SHALL responder `200` con un estado saludable para los checks de la plataforma.

#### Scenario: Comprobación de salud

- **WHEN** Vercel o un operador llama a `GET /api/v1/health` sin `Authorization`
- **THEN** el servicio responde `200` con un cuerpo que indica estado saludable

### Requirement: Configuración validada por entorno

El servicio SHALL obtener su configuración de variables de entorno y SHALL fallar el arranque con un mensaje claro si falta alguna variable requerida, en lugar de servir tráfico en estado inconsistente.

#### Scenario: Variables requeridas presentes

- **WHEN** el entorno define `DATABASE_URL`, `DATABASE_URL_UNPOOLED` y `JWT_SECRET`
- **THEN** el arranque de la función completa y la API atiende peticiones

#### Scenario: Variable requerida ausente

- **WHEN** falta una variable requerida en el entorno de despliegue
- **THEN** el arranque falla con un error que nombra la variable ausente y no se atienden peticiones con configuración incompleta

### Requirement: Conexión a Neon en ejecución efímera

El servicio SHALL conectarse a Neon mediante la cadena **pooled** y reutilizar el pool entre invocaciones en Vercel Fluid compute, y NO SHALL ejecutar migraciones durante el arranque en tiempo de ejecución.

#### Scenario: Reutilización de conexiones

- **WHEN** la función recibe varias invocaciones concurrentes
- **THEN** reutiliza el pool de conexiones en lugar de abrir una conexión nueva por invocación

#### Scenario: Migraciones fuera del runtime

- **WHEN** se despliega una versión del servicio
- **THEN** no se ejecutan migraciones en el arranque de la función; se aplican por separado con la conexión directa

### Requirement: Aislamiento de entornos de preview

El servicio SHALL permitir que cada Preview Deployment use una base de datos Neon aislada (rama propia) y SHALL funcionar con variables de entorno específicas cuando la integración Neon↔Vercel está disponible.

#### Scenario: Preview con rama de Neon

- **WHEN** se crea un Preview Deployment con la integración de Neon activa
- **THEN** el servicio usa la cadena de conexión de la rama de Neon asociada a esa preview

#### Scenario: Preview sin integración

- **WHEN** no hay integración con Neon y la preview usa variables compartidas
- **THEN** el servicio arranca con las variables de Preview definidas y no depende de la rama de otro entorno

### Requirement: Ejecución sin estado persistente

El servicio SHALL funcionar sin sistema de archivos persistente ni estado en memoria entre invocaciones, apoyándose en la base de datos y en tokens JWT para el estado.

#### Scenario: Autenticación entre invocaciones

- **WHEN** un usuario obtiene un token en una invocación y lo usa en otra
- **THEN** el servicio valida el token sin depender de estado en memoria del proceso

### Requirement: CORS configurable

El servicio SHALL permitir configurar los orígenes permitidos por variable de entorno y SHALL aplicar las cabeceras CORS correspondientes.

#### Scenario: Origen permitido

- **WHEN** un cliente de un origen incluido en la lista permitida realiza una petición
- **THEN** el servicio responde con las cabeceras CORS que autorizan ese origen

#### Scenario: Origen no permitido

- **WHEN** un cliente de un origen fuera de la lista permitida realiza una petición de navegador
- **THEN** el servicio no autoriza ese origen en las cabeceras CORS
