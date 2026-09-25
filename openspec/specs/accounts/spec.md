# Accounts Specification

## Purpose
Expone el perfil del usuario autenticado y sus cuentas financieras, base para el cálculo de balances y el resto de dominios.

## Requirements

### Requirement: Consulta del perfil

El sistema SHALL exponer `GET /me` que devuelve `200 User` correspondiente al usuario autenticado.

#### Scenario: Perfil del usuario autenticado

- **WHEN** un usuario autenticado invoca `GET /me`
- **THEN** el sistema responde `200` con `{ id, name, email, avatarUrl?, currency }` del usuario, sin datos sensibles

### Requirement: Actualización del perfil

El sistema SHALL permitir actualizar campos del perfil mediante `PATCH /me` con un cuerpo `Partial<User>` y SHALL devolver `200 User` con el estado resultante.

#### Scenario: Actualización de campos permitidos

- **WHEN** el usuario envía `PATCH /me` con `name`, `avatarUrl` o `currency` válidos
- **THEN** el sistema persiste los cambios y responde `200` con el `User` actualizado

#### Scenario: Actualización no permitida

- **WHEN** el usuario intenta modificar `id`, `email` o `password` mediante `PATCH /me`
- **THEN** el sistema ignora o rechaza esos campos y no altera los valores protegidos

### Requirement: Listado de cuentas

El sistema SHALL exponer `GET /accounts` que devuelve `200 Account[]` con las cuentas del usuario autenticado.

#### Scenario: Cuentas del usuario

- **WHEN** un usuario autenticado con cuentas invoca `GET /accounts`
- **THEN** el sistema responde `200` con la lista de `{ id, name, balance, currency }` de sus cuentas

#### Scenario: Usuario sin cuentas

- **WHEN** un usuario autenticado no tiene cuentas
- **THEN** el sistema responde `200` con un arreglo vacío

### Requirement: Aislamiento de datos por usuario

El sistema SHALL devolver únicamente los datos del usuario autenticado y SHALL rechazar el acceso a datos de otros usuarios con `404` o `403`.

#### Scenario: Acceso a recurso de otro usuario

- **WHEN** un usuario solicita un recurso que pertenece a otra cuenta de usuario
- **THEN** el sistema no expone el recurso y responde con un error de recurso no encontrado o prohibido
