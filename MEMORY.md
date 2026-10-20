# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **Aislamiento Multi-Tenant Certificado (SPEC-009)**: 21 Server Actions y Servicios blindados con Dual-Layer Defense. 7/7 pruebas adversariales aprobadas en Vitest. 0 errores en `tsc --noEmit`. Desplegado a producción (`d479f52c`).
- **Plan Maestro Empresarial Especificado (SPEC-010)**: Formalizado en `specs/010-core-operativo-alquileres-pos/` (`spec.md`, `plan.md`, `tasks.md`). Arquitectura de 5 fases y 20 tareas atómicas TDD centrada en Modo Mostrador POS (<30s), cotizaciones 1-clic, adendas versionadas (`v1.0 -> v1.1`) e inspección con semáforo paramétrico.

## Decisiones (y por qué)
- **Prioridad Operativa de Mostrador (Fase 1 de SPEC-010)**: Se priorizó el despacho y recepción ultra-rápida (< 30s) en mostrador con atajos de teclado (F2-F9) y lector de código de barras/QR frente al autoservicio web.
- **Adendas Versionadas In-Place**: Las modificaciones a contratos activos generan adendas (`alquiler_adendas`) preservando el historial y recalculando inventario y saldos sin romper el contrato original.
- **Checklist Visual con Costos Paramétricos**: En devoluciones, las averías o limpiezas se tasan con `catalogo_averias_equipos` y se cruzan automáticamente contra el depósito en caja.

## Aprendizajes y errores a evitar
- Siempre versionar las especificaciones SDD dentro de `ferreon-erp-nextjs/specs/` para asegurar su rastreo y distribución en Git.
- Respetar el flujo TDD: escribir primero las pruebas unitarias de las Server Actions y RPCs antes de tocar la interfaz visual.

## Próximos pasos
- Al iniciar la próxima sesión (tras `git pull`), ejecutar de inmediato la **Fase 1 de SPEC-010**:
  - `TASK-010-01`: RPC PostgreSQL `alquiler_crear_pos_rapido_v1`.
  - `TASK-010-02`: Server Action `crearAlquilerRapidoPosAction` con Zod.
  - `TASK-010-03`: Componente `MostradorPosModal` con atajos F2-F9.
  - `TASK-010-04`: Suite de pruebas unitarias `tests/unit/pos-alquiler-rapido.test.ts`.
