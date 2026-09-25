# Assistant Specification

## Purpose
Responde preguntas en lenguaje natural sobre los datos financieros del usuario con una respuesta breve y contextual.

## Requirements

### Requirement: Consulta al asistente

El sistema SHALL exponer `POST /assistant/ask` con cuerpo `{ question, context? }` y SHALL devolver `200 { answer }`.

#### Scenario: Pregunta válida

- **WHEN** el usuario autenticado envía `{ "question": "¿En qué gasté más este mes?" }`
- **THEN** el sistema responde `200` con `{ answer }` en texto que resume la información financiera relevante

#### Scenario: Pregunta vacía

- **WHEN** el usuario envía una `question` vacía o ausente
- **THEN** el sistema responde `422` con `error.code = "validation_error"`

### Requirement: Respuesta basada en datos del usuario

El sistema SHALL fundamentar la respuesta en los datos del usuario autenticado y SHALL limitar el tamaño de la respuesta para su uso en UI.

#### Scenario: Aislamiento de datos

- **WHEN** el usuario consulta el asistente
- **THEN** la respuesta se calcula solo con los movimientos, categorías y deudas del propio usuario

### Requirement: Proveedor de asistente intercambiable

El sistema SHALL resolver el asistente a través de una interfaz de proveedor y SHALL soportar una implementación determinista sin dependencias externas cuando no haya credenciales de LLM configuradas.

#### Scenario: Sin credenciales de LLM

- **WHEN** el servicio arranca sin configuración de proveedor externo
- **THEN** el asistente responde usando la implementación determinista basada en los datos del usuario

#### Scenario: Error del proveedor externo

- **WHEN** el proveedor externo configurado falla o expira
- **THEN** el sistema responde con un error controlado y registra la falla sin exponer detalles internos
