# Memoria de Sesión Persistente — Alquileres System

## Estado actual
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
- Los tests de integración con `@supabase/supabase-js` requieren cargar explícitamente `.env.local` con `dotenv` para resolver las claves en el runner de Vitest.
- Las migraciones complejas de RLS se ordenan secuencialmente comenzando por `ENABLE ROW LEVEL SECURITY` antes de crear políticas `FOR ALL TO authenticated`.

## Próximos pasos
1. Aplicar las migraciones generadas en el SQL Editor de Supabase Cloud.
2. Iniciar el desarrollo del siguiente hito: Módulo de rutas y logística de fletes Bucaramanga (**SPEC-018**).
