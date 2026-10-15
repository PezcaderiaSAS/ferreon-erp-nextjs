---
name: sdd
description: Flujo Spec-Driven Development (SDD): redactar specs en notación formal EARS, planes técnicos atómicos y desgloses de tareas verificables.
---

# Skill: Spec-Driven Development (SDD)

Esta habilidad guía la redacción rigurosa de especificaciones funcionales y planes técnicos antes de escribir código.

## 1. Notación EARS (Easy Approach to Requirements Syntax)

Al definir requisitos funcionales (`RF-x`), utiliza exclusivamente uno de los 5 patrones EARS:

- **Ubiquitous (General)**:
  `El sistema deberá <acción de respuesta>.`
- **Event-driven (Disparado por evento)**:
  `CUANDO <evento o acción del usuario>, el sistema deberá <acción de respuesta>.`
- **State-driven (Basado en estado)**:
  `MIENTRAS <el sistema o entidad esté en estado X>, el sistema deberá <comportamiento requerido>.`
- **Optional (Característica condicional)**:
  `DONDE <la entidad tenga habilitado X>, el sistema deberá <comportamiento opcional>.`
- **Unwanted Behavior (Manejo de errores/excepciones)**:
  `SI <ocurre condición no deseada o error>, ENTONCES el sistema deberá <acción de mitigación/feedback>.`

## 2. Estructura de Artefactos de Especificación

Toda característica debe estructurarse en `specs/NNN-<nombre>/`:
- `spec.md`: Visión del usuario, diagramas de flujo de usuario, requisitos EARS y matriz de trazabilidad.
- `plan.md`: Arquitectura, contratos de base de datos (PostgreSQL), Server Actions (Zod), límites RSC/Client Island y estrategia de pruebas.
- `tasks.md`: Lista de tareas atómicas donde cada tarea de frontend o endpoint incluye el criterio de aceptación obligatorio de **0 errores en consola JS y validación en Laptop (1366x768 / 1440x900 px) y Móvil (375 px)**.
