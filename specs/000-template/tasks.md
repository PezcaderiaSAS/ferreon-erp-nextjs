# Desglose de Tareas de Implementación (TDD): [NNN-nombre-funcionalidad]

## Matriz de Tareas Atómicas
Cada tarea debe ser ejecutada de manera independiente por `@implementer` bajo el ciclo Red-Green-Refactor.

- [ ] **Tarea 1: Pruebas Unitarias de Esquema y Validación**
  - **Archivo de Test**: `src/lib/schemas/__tests__/ejemploSchema.test.ts`
  - **Objetivo**: Escribir pruebas que verifiquen validación de entradas inválidas (valores negativos, strings vacíos).
  - **Estado**: PENDIENTE

- [ ] **Tarea 2: Implementación de Esquema Zod y Tipos**
  - **Archivo de Implementación**: `src/lib/schemas/ejemploSchema.ts`
  - **Objetivo**: Crear esquema Zod que haga pasar a verde las pruebas de la Tarea 1.
  - **Estado**: PENDIENTE

- [ ] **Tarea 3: Pruebas de Integración de Server Action con Aislamiento RLS**
  - **Archivo de Test**: `src/app/actions/__tests__/ejemploAction.test.ts`
  - **Objetivo**: Validar que la acción falle si no hay sesión o si el `tenant_id` no coincide.
  - **Estado**: PENDIENTE

- [ ] **Tarea 4: Implementación de Server Action Defensivo**
  - **Archivo de Implementación**: `src/app/actions/ejemploAction.ts`
  - **Objetivo**: Desarrollar la acción con try-catch anidado y persistencia en Supabase.
  - **Estado**: PENDIENTE

- [ ] **Tarea 5: Pruebas de Renderizado y Responsividad Móvil (Cards)**
  - **Archivo de Test**: `src/components/modulo/__tests__/EjemploView.test.tsx`
  - **Objetivo**: Validar que en viewport móvil (<768px) se muestren tarjetas y en desktop la tabla.
  - **Estado**: PENDIENTE

- [ ] **Tarea 6: Componente UI con Tailwind CSS y Tokens de DESIGN.md**
  - **Archivo de Implementación**: `src/components/modulo/EjemploView.tsx`
  - **Objetivo**: Implementar componente con diseño líquido, estados de carga y manejo accesible de errores.
  - **Estado**: PENDIENTE
