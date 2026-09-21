-- ==============================================================================
-- FERREON ERP SAAS — MIGRACIÓN CONSOLIDADA DE BLINDAJE DE SEGURIDAD (RLS)
-- Fecha: 2026-09-18
-- Propósito: Garantizar de forma 100% idempotente que TODAS las tablas públicas
-- tengan activado Row Level Security (RLS) para aislamiento estricto multi-inquilino.
-- ==============================================================================

DO $$ 
DECLARE 
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename NOT LIKE 'pg_%' 
          AND tablename NOT LIKE '_prisma_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
        RAISE NOTICE 'RLS habilitado de forma segura en tabla: %', tbl.tablename;
    END LOOP;
END $$;

-- Recargar el esquema de PostgREST para aplicar cambios inmediatamente
NOTIFY pgrst, 'reload schema';
