# Desglose de Tareas de Implementación (TDD): SPEC-018
## Módulo de Rutas, Logística y Matriz de Fletes Bucaramanga

---

### Fase 1: Capa de Dominio Puro (TDD) [x]
- [x] **TASK-018-01 (TDD)**: Escribir suite `tests/unit/logistica-rutas.service.test.ts` con cobertura de tarificación por zona/vehículo, cálculo de capacidad requerida, secuenciación de paradas y cálculo de avance porcentual.
- [x] **TASK-018-02 (Dominio)**: Implementar `src/core/services/logistica-rutas.service.ts` con tipado estricto, constantes de zonas metropolitanas de Bucaramanga y lógica pura haciendo pasar la suite al 100%.

---

### Fase 2: Capa de Base de Datos y Persistencia [x]
- [x] **TASK-018-03 (DDL Supabase)**: Crear migración `supabase/migrations/20261110_modulo_rutas_y_fletes_bucaramanga.sql` con las tablas `zonas_flete_bucaramanga`, `rutas_despacho`, `ruta_paradas`, seeder de zonas del área metropolitana y políticas RLS Zero-Trust.
- [x] **TASK-018-04 (Prisma)**: Sincronizar modelos en `prisma/schema.prisma` y validar con `npx prisma validate`.

---

### Fase 3: Server Actions & Backend Integration [ ]
- [ ] **TASK-018-05 (Server Actions)**: Desarrollar `src/app/actions/logistica.ts` (< 80 líneas por función) con validación Zod, `AuditLogger.logAsync`, revalidación de ruta y caché Upstash Redis.

---

### Fase 4: Componentes de UI/UX (Linear High-Density) [ ]
- [ ] **TASK-018-06 (Skeleton & RSC)**: Construir `LogisticaSkeleton.tsx` y el Server Component `src/app/logistica/page.tsx` con streaming concurrente vía `<Suspense>`.
- [ ] **TASK-018-07 (Client Island)**: Desarrollar `src/components/logistica/LogisticaInteractiveIsland.tsx` con métricas de flota, selector de fecha y timeline interactivo de paradas.
- [ ] **TASK-018-08 (Modales Operativos)**: Construir `CrearRutaModal.tsx` (despacho agrupado) y `RegistrarEvidenciaModal.tsx` (confirmación con foto y GPS).
- [ ] **TASK-018-09 (Integración Wizard)**: Integrar selector de zonas de Bucaramanga en `StepEquiposLogistica.tsx` enlazado reactivamente al cálculo de flete en `useAlquilerForm.ts`.

---

### Fase 5: QA Integral, Auditoría Harness² y Despliegue [ ]
- [ ] **TASK-018-10 (QA & Tests)**: Ejecutar `tsc --noEmit`, suite Vitest (`tests/unit/logistica-rutas.service.test.ts`), `npm run build` y suite obligatoria de Harness².
- [ ] **TASK-018-11 (Git & Despliegue)**: Registrar commit canónico, push a `origin/main` y actualizar `MEMORY.md`.
