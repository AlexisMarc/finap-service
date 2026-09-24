# Spec Delta

## Purpose

Permite a los usuarios autenticarse con email y contraseña y operar la API con una sesión respaldada por un token JWT.

## ADDED Requirements

### Requirement: Inicio de sesión con credenciales

El sistema SHALL autenticar al usuario en `POST /auth/login` a partir de `{ email, password }` y SHALL devolver `200 AuthSession` con `{ token, user }` cuando las credenciales son válidas.

#### Scenario: Credenciales válidas

- **WHEN** el usuario envía un `email` registrado y la `password` correcta
- **THEN** el sistema responde `200` con un `token` JWT y el objeto `user` sin exponer la contraseña

#### Scenario: Credenciales inválidas

- **WHEN** el usuario envía un `email` no registrado o una `password` incorrecta
- **THEN** el sistema responde `401` con `{ error: { code: "unauthorized", message: "Credenciales inválidas" } }`

#### Scenario: Payload inválido

- **WHEN** el usuario omite `email` o `password` o envía un email con formato inválido
- **THEN** el sistema responde `422` con `error.code = "validation_error"` y el detalle de los campos inválidos

### Requirement: Cierre de sesión

El sistema SHALL exponer `POST /auth/logout` que responde `204` sin contenido para una sesión autenticada.

#### Scenario: Logout autenticado

- **WHEN** un usuario autenticado invoca `POST /auth/logout`
- **THEN** el sistema responde `204` y la sesión deja de ser utilizable

### Requirement: Consulta de sesión

El sistema SHALL exponer `GET /auth/session` que devuelve `200 { user }` para la sesión autenticada.

#### Scenario: Sesión válida

- **WHEN** un usuario con token válido invoca `GET /auth/session`
- **THEN** el sistema responde `200` con el `user` de la sesión

#### Scenario: Sesión ausente o expirada

- **WHEN** la petición no incluye `Authorization: Bearer <token>` o el token es inválido o expiró
- **THEN** el sistema responde `401` con `error.code = "unauthorized"`

### Requirement: Protección de rutas autenticadas

El sistema SHALL exigir `Authorization: Bearer <token>` en todos los endpoints salvo los de login, y SHALL rechazar tokens ausentes, inválidos o expirados con `401`.

#### Scenario: Acceso sin token a ruta protegida

- **WHEN** una petición a un endpoint protegido no incluye cabecera `Authorization`
- **THEN** el sistema responde `401` con `error.code = "unauthorized"` sin ejecutar la lógica de negocio

#### Scenario: Acceso con token válido

- **WHEN** una petición a un endpoint protegido incluye un token JWT válido
- **THEN** el sistema resuelve la identidad del usuario y continúa con la petición
