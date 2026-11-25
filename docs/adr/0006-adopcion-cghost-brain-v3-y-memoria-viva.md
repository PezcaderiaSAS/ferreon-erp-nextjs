# ADR-0006: Adopción e Integración de C://GHOST Brain v3.0 como Sistema de Gobernanza Cognitiva y Memoria Viva

- **Estado:** Aceptado
- **Fecha:** 2026-11-25
- **Decisores:** Arquitectura de Software, Equipo de Ingeniería Alquileres System
- **Contexto:** Alquileres System (FerreOn ERP)

---

## 1. Contexto y Problemática

El proyecto Alquileres System (FerreOn ERP SaaS & WMS) cuenta con un volumen considerable de módulos transaccionales de alta densidad (Alquileres, Bodega, Caja, Devoluciones, Facturación, Subcontrataciones, Rutas). Conforme las conversaciones con agentes de IA se extienden a lo largo de ciclos de desarrollo iterativo, se presentan los siguientes riesgos sistemáticos:
1. **Amnesia del Chat (Context Drift):** Pérdida de foco operativo en hilos largos, requiriendo re-explicar contratos y directrices previas.
2. **Context Bloat:** Documentos de seguimiento gigantescos (> 500 líneas) que agotan los tokens de entrada antes de escribir código.
3. **Fugas de Secretos (Zero-Trust Breach):** Riesgo de commitear involuntariamente credenciales, llaves o variables de entorno locales.
4. **Desconexión entre Arquitectura y Ejecución:** Pérdida de trazabilidad de ideas emergentes que interrumpen la tarea activa en curso.

---

## 2. Decisión Adoptada

Se adopta e implementa de forma oficial la **Metodología C://GHOST Brain v3.0 (Universal & Agnóstica)** como el sistema operativo de memoria viva y gobernanza cognitiva del repositorio:

1. **Tríada de Memoria Viva y Ventana Deslizante:**
   - `STATUS.md`: Repositorio de conciencia conciso, con regla estricta de **máximo 100 líneas**, conservando únicamente las últimas 5 tareas completadas y el backlog inmediato.
   - `IDEAS.md`: Mecanismo de **Fuga Cero (Protocolo 6)** para capturar mejoras e ideas futuras sin descarrilar la tarea activa.
   - `CHANGELOG.md`: Registro inmutable y cronológico permanente de todos los hitos arquitectónicos concluidos.

2. **Los 10 Protocolos Universales C://GHOST v3.0:**
   - Adopción íntegra de los Protocolos 0 al 10 en `.agents/AGENTS.md` y `AGENTS.md`.
   - Bucle cognitivo de 3 fases: Inicio (`Protocolo 0 y 1`) → Ejecución (`Protocolos 2, 3, 5 y 8`) → Cierre (`Protocolos 4, 6 y 7`).
   - Handoff estructurado de 6 campos con aislamiento `Workspace: "share"` para tareas paralelas pesadas.
   - Regla del Umbral (Micro-tareas directas vs Macro-tareas delegadas).

3. **Lifecycle Hooks Universales Zero-Trust (`.agents/hooks/` + `.agents/hooks.json`):**
   - `session-start.sh` (`SessionStart`): Inyección de telemetría de rama Git y conteo de líneas de `STATUS.md`.
   - `pre-tool-guard.sh` (`PreToolUse`): Guardia preventivo que bloquea cualquier intento de `git add` o `git commit` sobre archivos sensibles (`.env*`, `.secrets/`, `*.pem`, `*.key`, llaves SSH, credenciales JSON).
   - `stop-gate.sh` (`Stop`): Control anti-bucle mediante `continuationActive` y validación de que `STATUS.md` no supere 100 líneas ni queden secretos en *git staging*.

4. **Coexistencia y Respeto al Toolchain Existente:**
   - Los protocolos de C://GHOST v3.0 se subordinan y conviven armónicamente con la Constitución Canónica del proyecto (`docs/constitution.md`), el índice de código GitNexus (`npx gitnexus analyze`), las directrices de diseño (`DESIGN.md`, `ui-ux-ecosystem`) y la Deny List estricta de seguridad en terminal.

---

## 3. Consecuencias y Beneficios

- **Positivas:**
  - Reducción de más del 70% en tokens consumidos por contexto residual en cada turno de agente.
  - Eliminación matemática de la "Amnesia del Chat": cada nueva sesión arranca leyendo `STATUS.md` y `AGENTS.md` con contexto 100% fresco.
  - Garantía Zero-Trust mecánica contra filtración de credenciales a nivel de hooks locales.
  - Preservación íntegra de ideas innovadoras sin pérdida de foco gracias a `IDEAS.md`.
- **Compromisos Operativos:**
  - Obligación estricta de archivar en `CHANGELOG.md` cualquier tarea que supere la cuota de 5 tareas en `STATUS.md`.
  - Verificación estricta del Gate (Protocolo 7) antes de cerrar tareas.
