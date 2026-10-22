# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **SPEC-010 POS Desplegado en Producción (100% Completado)**:
  - Fases 1 a 4: POS rápido, Cotizaciones 1-Clic, Adendas v1.0->v1.1, Devoluciones y Averías (29/29 tests Vitest). Desplegado en `main` (commit `8a58a7c`).
- **SPEC-011 Auditoría 360° & Remediación de Datos / DBRE**:
  - **Scorecard Global**: **94.5 / 100 (Grado Enterprise A)** en 4 frentes.
  - **Data Engineering Review**: [`specs/011-auditoria-calidad-total/data-engineering-review.md`](file:///c:/Users/USUARIO/Documents/Aplicaciones/FerreOn/Alquileres_erp/specs/011-auditoria-calidad-total/data-engineering-review.md).
  - **HAL-DB-01 (Resuelto)**: Migración `20261022_dbre_deadlock_prevention_and_indexes.sql` con pre-bloqueo `ORDER BY id ASC FOR UPDATE` e índices multi-tenant compuestos.
  - **HAL-ARC-01 & 02 (Resueltos)**: Zod en `ajustarStockEquipoAction` y tipos estrictos `AlquilerDetalleItemUI` en `alquilerStore.ts` y `mappers.ts`.
  - **Certificación**: 0 errores en `tsc --noEmit`, 29/29 tests POS vitest pasando, 5/5 pytest en Harness2.

## Decisiones (y por qué)
- **Deadlock Prevention Determinista**: Adquisición monótona ascendente (`ORDER BY id ASC FOR UPDATE`) en PostgreSQL eliminando interbloqueos `40P01` entre cajeros.
- **Índices Compuestos Parciales**: `(empresa_id, created_at DESC) WHERE deleted_at IS NULL` para evitar ordenamientos costosos en memoria.
- **Harness2 PlatformLock**: Secuencialización estricta (`k=1`, `max_tasks=1`) para evitar errores 429 de cuota con Google GenAI.

## Aprendizajes y errores a evitar
- Siempre ordenar por PK ascendente antes de bloquear múltiples filas en transacciones PostgreSQL.
- Mantener tipado estricto en stores Zustand y mappers de dominio evitando `any[]`.
- Mantener siempre `MEMORY.md` en $\le 50$ líneas.

## Próximos pasos
- Migración canónica `20261022221833_pos_core_suite_and_dbre_optimizations` registrada y activa en Supabase remoto.
- Tipos TypeScript sincronizados en `database.types.ts` (0 errores tsc, 29/29 tests POS vitest).
- Realizar commit y sincronización git en `main`.


