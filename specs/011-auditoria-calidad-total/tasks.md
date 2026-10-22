# Tareas de Auditoría y Evaluación: SPEC-011
## Plan de Auditoría Integral 360° con Agencias de Agentes y Harness2

## Fase 1: Auditoría de Arquitectura de Código, Server Actions y Tipado Estricto [x]
- [x] **TASK-011-01 (Next.js & RSC)**: Auditar fronteras de componentes cliente vs servidor en `/alquileres`, `/cotizaciones`, `/bodega` y `/caja`.
- [x] **TASK-011-02 (Server Actions & Zod)**: Inspeccionar todas las Server Actions en `src/app/actions/` verificando validación en tiempo de ejecución, sanitización de entradas y delgadez de controladores.
- [x] **TASK-011-03 (TypeScript & Acoplamiento)**: Analizar acoplamiento de stores Zustand, tipado estricto y ausencia de `any` no tipados en entidades de dominio.

## Fase 2: Auditoría de Persistencia, Concurrencia y DBRE [x]
- [x] **TASK-011-04 (Locking & Overbooking)**: Auditar todas las funciones RPC de Supabase para validar bloqueo pesimista `SELECT ... FOR UPDATE` ordenado por clave primaria e integridad atómica de stock.
- [x] **TASK-011-05 (Multi-Tenant & RLS)**: Revisar políticas de aislamiento Row Level Security en tablas críticas (`alquileres`, `alquiler_detalles`, `alquiler_adendas`, `devoluciones`, `movimientos_caja`, `empresas`).
- [x] **TASK-011-06 (Conexiones & Pooler)**: Verificar configuración de puertos de conexión (Transaction Pooler 6543 vs Session 5432) y manejo de timeouts transaccionales.

## Fase 3: Auditoría de Rendimiento, Caching, UI/UX y Accesibilidad [x]
- [x] **TASK-011-07 (Caché & Revalidación)**: Auditar la estrategia de invalidación en Upstash Redis (`invalidateTenantCache`) y revalidación de rutas Next.js (`safeRevalidatePath`).
- [x] **TASK-011-08 (Design Tokens & UI)**: Verificar apego a tokens de `DESIGN.md` (colores HSL, tipografías, espaciados) y consistencia del sistema Glassmorphism.
- [x] **TASK-011-09 (A11y & Responsividad)**: Evaluar accesibilidad WCAG 2.1 AA (trampas de foco en modales, atajos de teclado, contraste) y visualización en Laptop 1366x768 y Móvil 375px.

## Fase 4: Benchmark y Testing Automatizado en Harness2 [x]
- [x] **TASK-011-10 (Harness2 Suite)**: Ejecutar suite de pruebas pytest en `harness2` y validar funcionamiento del cliente Google GenAI y sistema de locking de plataforma.
- [x] **TASK-011-11 (Vitest Cobertura)**: Evaluar cobertura de pruebas unitarias en todas las suites POS y flujos comerciales.
- [x] **TASK-011-12 (LLM Judging)**: Diseñar caso de prueba de evaluación con LLM Judge para validar coherencia de contratos y cálculo de adendas.

## Fase 5: Consolidación, Scorecard y Emisión de Reporte [x]
- [x] **TASK-011-13 (Scorecard Global)**: Consolidar puntuación ponderada 0-100 en `scorecard.md`.
- [x] **TASK-011-14 (Matriz de Hallazgos)**: Tabular todos los hallazgos por severidad con impacto y remediación recomendada.
- [x] **TASK-011-15 (Plan de Remediación)**: Elaborar el roadmap de remediación TDD para someter a aprobación del usuario.
