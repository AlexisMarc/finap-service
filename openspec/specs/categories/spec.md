# Categories Specification

## Purpose
Administra las categorías usadas para clasificar movimientos y presupuestos.

## Requirements

### Requirement: Listado de categorías

El sistema SHALL exponer `GET /categories` devolviendo `200 Category[]` con las categorías disponibles para el usuario.

#### Scenario: Categorías existentes

- **WHEN** el usuario autenticado invoca `GET /categories`
- **THEN** el sistema responde `200` con la lista de `{ id, name, color, icon }`

### Requirement: Creación de categorías

El sistema SHALL crear una categoría con `POST /categories` a partir de `CategoryInput` y SHALL responder `201 Category`.

#### Scenario: Creación válida

- **WHEN** el usuario envía `{ name, color, icon }` válidos
- **THEN** el sistema persiste la categoría y responde `201` con la `Category` creada

#### Scenario: Nombre duplicado

- **WHEN** el usuario intenta crear una categoría con un `name` ya existente para él
- **THEN** el sistema responde `409` con `error.code = "conflict"` y no crea la categoría

### Requirement: Actualización de categorías

El sistema SHALL actualizar una categoría con `PATCH /categories/:id` usando `Partial<CategoryInput>` y SHALL responder `200 Category`.

#### Scenario: Actualización parcial

- **WHEN** el usuario modifica `name`, `color` o `icon` de una categoría propia
- **THEN** el sistema persiste los cambios y responde `200` con la categoría actualizada

### Requirement: Eliminación de categorías

El sistema SHALL eliminar una categoría con `DELETE /categories/:id` respondiendo `204`, y SHALL impedir la eliminación si existen movimientos o presupuestos asociados.

#### Scenario: Eliminación sin dependencias

- **WHEN** el usuario elimina una categoría propia sin movimientos ni presupuestos asociados
- **THEN** el sistema la elimina y responde `204`

#### Scenario: Eliminación con movimientos asociados

- **WHEN** el usuario intenta eliminar una categoría referenciada por movimientos o presupuestos
- **THEN** el sistema responde `409` con `error.code = "conflict"` y no elimina la categoría

### Requirement: Validación del color e icono

El sistema SHALL validar que `color` sea un valor hexadecimal válido y que `icon` corresponda a un identificador permitido.

#### Scenario: Color inválido

- **WHEN** el usuario envía un `color` que no es un hex válido
- **THEN** el sistema responde `422` con `error.code = "validation_error"`
