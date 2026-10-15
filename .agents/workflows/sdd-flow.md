---
description: Orquesta el pipeline SDD completo para nuevas características con especificación en EARS, plan técnico, tareas atómicas y verificación continua en DevTools.
argument-hint: "<nombre-funcionalidad>"
---

# Workflow: /sdd-flow

**Roles**: `@coordinator` -> `@planner` -> `@implementer` -> `@reviewer`  
**Objetivo**: Implementar una característica completa bajo la metodología Spec-Driven Development (SDD), asegurando total trazabilidad, contratos de datos y cero regresiones.

## Fases del Pipeline SDD

### Fase 1: Especificación (`@planner`)
- Crear directorio `specs/NNN-<nombre-funcionalidad>/`.
- Redactar `spec.md` en **notación EARS** (Easy Approach to Requirements Syntax):
  - *Ubiquitous Requirements*: "El sistema deberá..."
  - *Event-driven*: "CUANDO [evento], el sistema deberá..."
  - *State-driven*: "MIENTRAS [estado], el sistema deberá..."
  - *Optional*: "DONDE [condición], el sistema deberá..."
  - *Unwanted Behavior*: "SI [error], ENTONCES el sistema deberá..."

### Fase 2: Plan Técnico y Desglose de Tareas (`@planner`)
- Redactar `plan.md`:
  - Modelo relacional (PostgreSQL / Supabase RLS).
  - Contratos de API / Server Actions con Zod.
  - Componentes React Server vs Client Islands.
  - Estrategia de tests.
- Redactar `tasks.md` con tareas atómicas, incluyendo el criterio innegociable:
  - *"Verificado con chrome-devtools MCP (consola limpia + captura en pantalla Laptop 1366x768 px + captura Móvil 375 px)"*.
- **Punto de Control Humano**: Presentar los artefactos y esperar aprobación explícita antes de programar.

### Fase 3: Construcción e Implementación TDD (`@implementer`)
- Ejecutar en *Turbo Mode*.
- Red-Green-Refactor con pruebas automatizadas (`node --test` / Vitest).
- Implementar la lógica de negocio y componentes.
- Tras cada tarea completada, correr la inspección DevTools dual y certificar 0 errores de consola.

### Fase 4: Auditoría Final y Cierre (`@reviewer` + `@coordinator`)
- Validar paridad con `docs/constitution.md`.
- Verificar cobertura de pruebas e integridad de tipos (`tsc --noEmit`).
- Actualizar `MEMORY.md` y `docs/memory-bank/`.
