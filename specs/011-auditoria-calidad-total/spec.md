# Especificación Técnica: SPEC-011
## Auditoría Integral de Calidad Total, Resiliencia y Benchmarking con Agencias y Harness2

### 1. Resumen Ejecutivo
**SPEC-011** establece el marco de evaluación 360° para auditar exhaustivamente la calidad, seguridad, concurrencia, rendimiento, accesibilidad y capacidad de judging automatizado de **Alquileres System (FerreOn ERP SaaS)** tras el despliegue del Core Operativo POS (**SPEC-010**).

La evaluación sigue el principio innegociable de **Diagnóstico Completo Primero**: auditar todos los frentes, clasificar hallazgos en una matriz con severidad y generar el plan de remediación TDD antes de ejecutar cualquier cambio en código productivo.

---

### 2. Dimensiones de Evaluación (Scorecard 0-100)
La calidad total del sistema se evalúa bajo 4 frentes estructurados:

1. **Frente 1: Arquitectura de Software, Server Actions y Clean Code (25%)**
   - Fronteras claras RSC (React Server Components) vs Client Components.
   - Server Actions delgadas con validación estricta Zod en tiempo de ejecución.
   - Cobertura de tipado TypeScript estricto (`tsc --noEmit` = 0 errores).
   - Acoplamiento, gestión de estado Zustand y principio de responsabilidad única.

2. **Frente 2: Concurrencia, Persistencia y Base de Datos / DBRE (25%)**
   - Bloqueo pesimista `SELECT ... FOR UPDATE` ordenado por clave primaria en RPCs.
   - Prevención matemática absoluta de overbooking / sobre-alquiler.
   - Aislamiento multi-tenant Dual-Layer con PostgreSQL Row Level Security (RLS).
   - Manejo de pooler Supabase (Transaction Pooler 6543 vs Session 5432) e Idempotencia transaccional.

3. **Frente 3: Rendimiento, Caching, UI/UX y Accesibilidad (25%)**
   - Invalidación quirúrgica en Upstash Redis por tenant y `safeRevalidatePath`.
   - Adherencia a tokens cromáticos y tipográficos de `DESIGN.md`.
   - Accesibilidad WCAG 2.1 AA (trampa de foco, escape, contraste y lectores de pantalla).
   - Responsividad garantizada en Laptop Mostrador (1366x768) y Móvil Bodega (375px).

4. **Frente 4: Harness2 & Automatización de Pruebas con LLM-as-a-Judge (25%)**
   - Robustez del framework local `harness2` (Python 3.12, pytest, client Google GenAI).
   - Cobertura de pruebas unitarias Vitest en flujos críticos de negocio.
   - Diseño de evaluadores y prompts de judging para validar coherencia contractual y edge cases.

---

### 3. Matriz de Clasificación de Severidad
- 🔴 **CRÍTICA**: Afecta integridad de datos, sobreventa concurrente, fuga de tenant o vulnerabilidad de seguridad.
- 🟠 **ALTA**: Afecta rendimiento severo, memory leaks, fallos de revalidación o inconsistencia contable.
- 🟡 **MEDIA**: Incumplimiento de estándares de código, duplicación de lógica o degradación menor de UX.
- 🟢 **BAJA / MEJORA**: Oportunidades de optimización visual, micro-interacciones o limpieza de comentarios.

---

### 4. Gobernanza y Compromisos
- Idioma oficial: **Español**.
- Longitud de `MEMORY.md`: Estrictamente $\le 50$ líneas.
- Seguridad de Despliegue: Prohibido mutar código sin confirmación expresa del usuario.
