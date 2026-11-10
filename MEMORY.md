# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **Flexibilidad Total en Contratos, Fechas de Corte y Depósitos Opcionales**:
  - Depósitos no obligatorios: Eliminada la restricción de colateral del 10% en `useAlquilerForm.ts`, permitiendo formalizar y editar contratos con $0 de depósito. Etiquetado como `(Opcional)` en `StepClienteGarantias.tsx` y `StepResumenLiquidacion.tsx`.
  - Reconciliación de stock en edición: `verificarStockItem` acredita la maquinaria asignada al contrato actual, eliminando falsos bloqueos de "Stock insuficiente" y doble descuento en Zustand.
  - Sincronización de fechas: Propagación sincrónica de fechas maestras a ítems en `useAlquilerForm.ts`, selectores de fecha final explícita en `EditarContratoAdendaModal.tsx`, y sincronización reactiva en `EmitirCuentaCobroModal.tsx`.
  - Facturación recurrente corregida: Eliminadas columnas inexistentes en `alquileres`, seteado `estado_pago: 'EMITIDA'`, y mapeo de `tarifa_aplicada` en `facturacion-recurrente.service.ts`.
  - Test suites: Harness2 (5/5 tests pasados en 0.57s), Vitest (18/18 tests en `edicion-contrato-fechas-cortes.test.ts`, 4/4 en `alquiler-registro-fallo.test.tsx`), TypeScript `tsc --noEmit` con 0 errores y `npm run build` en código 0 (32/32 páginas).

- **Suite de Migraciones Estructurales DB Desplegada (Fases 0 a 4)**:
  - Commit `ab815855` subido a `origin/main` y desplegado en Vercel Producción (`READY`).
  - Creadas las 5 migraciones canónicas SQL en `supabase/migrations/`:
    1. `20261104130000_p0_security_seal_rls_hotfix.sql`: Sellado RLS Zero-Trust para anonKey en 14 tablas.
    2. `20261104140000_p1_tenancy_and_referential_integrity.sql`: Purgado de tenant_id, FKs empresas(id) y constraint compuesto (alquiler_id, cliente_id).
    3. `20261104150000_p1_reconciliacion_financiera_ciclo_alquileres.sql`: Columnas de ciclo presupuestado vs liquidado, backfill y corrección de seeder.
    4. `20261104160000_p2_dbre_partial_indexes_and_cleanup.sql`: Índices parciales sesiones_caja y ocupación.
    5. `20261104170000_p2_cop_integer_currency_check_constraints.sql`: CHECK constraints COP entero.
  - Sincronizado `prisma/schema.prisma` removiendo modelos fantasma de bodegas. Prisma Client y `tsc --noEmit` con 0 errores; `npm run build` con 32/32 rutas.
  - Test suites: Harness2 (5/5 tests pasados en 0.54s y 79.23s) y suite de integración live en Supabase (3/3 tests pasados).

## Decisiones (y por qué)
- **Eliminación de Modelos Fantasma en Prisma**: Al no existir la tabla física `bodegas` en PostgreSQL, eliminar `Warehouse` y `WarehouseStock` evita que Prisma genere relaciones rotas o tipos incompatibles.
- **Suite de Integración Viva (`tests/integration/rls-zero-trust.test.ts`)**: Permite auditar en CI la inmunidad contra peticiones anónimas directamente contra Supabase.

## Aprendizajes y errores a evitar
- Los tests de integración con `@supabase/supabase-js` utilizan la función nativa `process.loadEnvFile('.env.local')` protegida por `fs.existsSync` para evitar dependencias externas en Vitest.
- En la tabla `facturas`, el CHECK constraint de PostgreSQL sólo admite `EMITIDA`, `PAGADA` o `ANULADA` (no `PENDIENTE`).
- En `alquiler_detalles`, la columna que almacena la tarifa en PostgreSQL se llama `tarifa_aplicada`.
- En edición de contratos, la verificación de stock debe acreditar los ítems previamente asignados al mismo contrato para evitar bloqueos espurios de stock.
- Los depósitos en garantía son opcionales en el flujo comercial de FerreOn y no deben bloquear la formalización ni adición de contratos.
- En migraciones de constraints COP entero (`TRUNC`), siempre se debe ejecutar un saneamiento previo con `ROUND()` sobre los datos legacy para garantizar que `ADD CONSTRAINT` nunca aborte por centavos residuales.
- El script consolidado `supabase/migrations/CONSOLIDADO_EJECUCION_SUPABASE_CLOUD.sql` reúne las 5 fases en un solo bloque transaccional (`BEGIN ... COMMIT`) con registro en `schema_migrations`.

## Próximos pasos
1. Aplicar el script consolidado o las 5 migraciones en el SQL Editor de Supabase Cloud.
2. Iniciar el desarrollo del siguiente hito: Módulo de rutas y logística de fletes Bucaramanga (**SPEC-018**).
