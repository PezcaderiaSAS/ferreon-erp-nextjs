-- ==============================================================================
-- FERREON ERP & WMS - MIGRACIÓN MÓDULO LOGÍSTICA DE BODEGAS Y STOCKS
-- Base de Datos: Supabase / PostgreSQL
-- Fecha: 2026-09-11
-- Descripción:
--   1. Crea tabla public.bodegas con aislamiento por empresa (Multi-Tenant).
--   2. Crea tabla public.bodega_stocks con cantidades estrictas en enteros y RLS.
--   3. Sembrado automático de bodega principal y balance inicial por equipo.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. TABLA BODEGAS (Infraestructura WMS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bodegas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    direccion TEXT,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT bodegas_empresa_codigo_unique UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_bodegas_empresa_id ON public.bodegas (empresa_id);
CREATE INDEX IF NOT EXISTS idx_bodegas_codigo ON public.bodegas (codigo);

-- Habilitar RLS en bodegas
ALTER TABLE public.bodegas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can manage own bodegas" ON public.bodegas;
CREATE POLICY "Tenants can manage own bodegas" ON public.bodegas
    FOR ALL USING (
        empresa_id IN (
            SELECT eu.empresa_id 
            FROM public.empresa_usuarios eu 
            WHERE eu.user_id = auth.uid() AND eu.es_empresa_activa = TRUE
        )
    );

DROP POLICY IF EXISTS "UltraAdmin full access bodegas" ON public.bodegas;
CREATE POLICY "UltraAdmin full access bodegas" ON public.bodegas
    FOR ALL USING (public.is_ultra_admin());

-- ------------------------------------------------------------------------------
-- 2. TABLA BODEGA_STOCKS (Balances WMS por Bodega y Equipo)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bodega_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    bodega_id UUID NOT NULL REFERENCES public.bodegas(id) ON DELETE RESTRICT,
    equipo_id BIGINT NOT NULL REFERENCES public.equipos(id) ON DELETE RESTRICT,
    stock_fisico INTEGER NOT NULL DEFAULT 0 CHECK (stock_fisico >= 0),
    stock_reservado INTEGER NOT NULL DEFAULT 0 CHECK (stock_reservado >= 0),
    ubicacion_bin VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bodega_stocks_empresa_bodega_equipo_unique UNIQUE (empresa_id, bodega_id, equipo_id),
    CONSTRAINT bodega_stocks_reservado_check CHECK (stock_reservado <= stock_fisico)
);

CREATE INDEX IF NOT EXISTS idx_bodega_stocks_empresa_id ON public.bodega_stocks (empresa_id);
CREATE INDEX IF NOT EXISTS idx_bodega_stocks_bodega_id ON public.bodega_stocks (bodega_id);
CREATE INDEX IF NOT EXISTS idx_bodega_stocks_equipo_id ON public.bodega_stocks (equipo_id);

-- Habilitar RLS en bodega_stocks
ALTER TABLE public.bodega_stocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can manage own bodega_stocks" ON public.bodega_stocks;
CREATE POLICY "Tenants can manage own bodega_stocks" ON public.bodega_stocks
    FOR ALL USING (
        empresa_id IN (
            SELECT eu.empresa_id 
            FROM public.empresa_usuarios eu 
            WHERE eu.user_id = auth.uid() AND eu.es_empresa_activa = TRUE
        )
    );

DROP POLICY IF EXISTS "UltraAdmin full access bodega_stocks" ON public.bodega_stocks;
CREATE POLICY "UltraAdmin full access bodega_stocks" ON public.bodega_stocks
    FOR ALL USING (public.is_ultra_admin());

-- ------------------------------------------------------------------------------
-- 3. SEMBRADO DE BODEGA PRINCIPAL Y ASIGNACIÓN DE STOCKS EXISTENTES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_empresa RECORD;
    v_bodega_id UUID;
    v_equipo RECORD;
BEGIN
    FOR v_empresa IN SELECT id FROM public.empresas WHERE deleted_at IS NULL LOOP
        -- Verificar si la empresa ya tiene bodega principal
        SELECT id INTO v_bodega_id 
        FROM public.bodegas 
        WHERE empresa_id = v_empresa.id AND codigo = 'BG-01';

        IF v_bodega_id IS NULL THEN
            INSERT INTO public.bodegas (
                empresa_id,
                nombre,
                codigo,
                direccion,
                es_principal,
                activa
            ) VALUES (
                v_empresa.id,
                'Bodega Principal',
                'BG-01',
                'Sede Principal de Operaciones',
                TRUE,
                TRUE
            ) RETURNING id INTO v_bodega_id;
        END IF;

        -- Migrar stock de equipos existentes a bodega_stocks
        FOR v_equipo IN 
            SELECT id, stock_total, stock_disponible 
            FROM public.equipos 
            WHERE empresa_id = v_empresa.id AND deleted_at IS NULL
        LOOP
            INSERT INTO public.bodega_stocks (
                empresa_id,
                bodega_id,
                equipo_id,
                stock_fisico,
                stock_reservado
            ) VALUES (
                v_empresa.id,
                v_bodega_id,
                v_equipo.id,
                COALESCE(v_equipo.stock_total, 0),
                GREATEST(0, COALESCE(v_equipo.stock_total, 0) - COALESCE(v_equipo.stock_disponible, 0))
            )
            ON CONFLICT (empresa_id, bodega_id, equipo_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

COMMIT;
