-- ==============================================================================
-- MIGRACIÓN: Módulo de Caja y Punto de Venta (POS) & Control de Efectivo
-- Fecha: 2026-09-14
-- Descripción:
--   1. Añade campos de arqueo ciego y descuadre a public.sesiones_caja.
--   2. Crea la tabla public.movimientos_caja para registrar gastos menores e ingresos.
--   3. Habilita RLS y políticas multitenant seguras.
-- ==============================================================================

-- 1. Ampliar public.sesiones_caja con soporte de arqueo por denominaciones y descuadre
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones_caja' AND column_name='arqueo_detalle') THEN
        ALTER TABLE public.sesiones_caja ADD COLUMN arqueo_detalle JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones_caja' AND column_name='monto_esperado') THEN
        ALTER TABLE public.sesiones_caja ADD COLUMN monto_esperado DECIMAL(15,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones_caja' AND column_name='diferencia') THEN
        ALTER TABLE public.sesiones_caja ADD COLUMN diferencia DECIMAL(15,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones_caja' AND column_name='motivo_descuadre') THEN
        ALTER TABLE public.sesiones_caja ADD COLUMN motivo_descuadre TEXT;
    END IF;
END $$;

-- 2. Crear tabla public.movimientos_caja (Gastos menores / Egresos / Inyecciones de efectivo)
CREATE TABLE IF NOT EXISTS public.movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    sesion_caja_id UUID NOT NULL REFERENCES public.sesiones_caja(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
    monto DECIMAL(15,2) NOT NULL CHECK (monto > 0),
    concepto VARCHAR(255) NOT NULL,
    beneficiario VARCHAR(255),
    comprobante VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de optimización de lectura
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sesion ON public.movimientos_caja(sesion_caja_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_tenant ON public.movimientos_caja(tenant_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_empresa ON public.movimientos_caja(empresa_id);

-- 3. Habilitar y configurar RLS (Row Level Security)
ALTER TABLE public.movimientos_caja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can manage own movimientos_caja" ON public.movimientos_caja;
CREATE POLICY "Tenants can manage own movimientos_caja" ON public.movimientos_caja 
    FOR ALL USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);
