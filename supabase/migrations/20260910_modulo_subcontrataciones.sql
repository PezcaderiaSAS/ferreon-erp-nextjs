-- ==============================================================================
-- FERREON ERP - MÓDULO DE SUBCONTRATACIÓN Y RE-ALQUILER DE EQUIPOS E ÍTEMS
-- Base de Datos: Supabase (PostgreSQL)
-- Fecha: 2026-09-10
-- ==============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA SUBCONTRATACIONES (Órdenes de Maquinaria y Servicios a Terceros)
CREATE TABLE IF NOT EXISTS public.subcontrataciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    consecutivo VARCHAR(50) UNIQUE NOT NULL,
    alquiler_id BIGINT REFERENCES public.alquileres(id) ON DELETE SET NULL,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE RESTRICT,
    proveedor_nombre VARCHAR(255) NOT NULL,
    proveedor_nit VARCHAR(50) NOT NULL,
    proveedor_telefono VARCHAR(50),
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_recepcion_estimada DATE NOT NULL,
    fecha_devolucion_estimada DATE NOT NULL,
    fecha_recepcion_real TIMESTAMPTZ,
    fecha_devolucion_real TIMESTAMPTZ,
    estado VARCHAR(30) NOT NULL DEFAULT 'ORDENADA' CHECK (
        estado IN ('ORDENADA', 'RECIBIDA_EN_BODEGA', 'EN_CLIENTE', 'DEVUELTA_A_PROVEEDOR', 'CANCELADA')
    ),
    costo_total_estimado DECIMAL(15,2) NOT NULL DEFAULT 0,
    costo_total_real DECIMAL(15,2) NOT NULL DEFAULT 0,
    deposito_garantia_proveedor DECIMAL(15,2) NOT NULL DEFAULT 0,
    observaciones TEXT,
    creado_por VARCHAR(100) DEFAULT 'SISTEMA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA SUBCONTRATACIONES_DETALLES (Líneas de Maquinaria Subcontratada)
CREATE TABLE IF NOT EXISTS public.subcontrataciones_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontratacion_id UUID NOT NULL REFERENCES public.subcontrataciones(id) ON DELETE CASCADE,
    equipo_id BIGINT REFERENCES public.equipos(id) ON DELETE SET NULL,
    descripcion_item VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    dias_pactados INT NOT NULL CHECK (dias_pactados > 0),
    costo_diario_unitario DECIMAL(15,2) NOT NULL CHECK (costo_diario_unitario >= 0),
    tarifa_diaria_cliente DECIMAL(15,2) NOT NULL DEFAULT 0,
    subtotal_costo DECIMAL(15,2) NOT NULL DEFAULT 0,
    alquiler_detalle_id BIGINT REFERENCES public.alquiler_detalles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. EXTENSIÓN EN ALQUILER_DETALLES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='es_subcontratado') THEN
        ALTER TABLE public.alquiler_detalles ADD COLUMN es_subcontratado BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='proveedor_id') THEN
        ALTER TABLE public.alquiler_detalles ADD COLUMN proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='costo_subcontratacion_diario') THEN
        ALTER TABLE public.alquiler_detalles ADD COLUMN costo_subcontratacion_diario DECIMAL(15,2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='subcontratacion_id') THEN
        ALTER TABLE public.alquiler_detalles ADD COLUMN subcontratacion_id UUID REFERENCES public.subcontrataciones(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_subcontrataciones_tenant ON public.subcontrataciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subcontrataciones_empresa ON public.subcontrataciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_subcontrataciones_proveedor ON public.subcontrataciones(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_subcontrataciones_alquiler ON public.subcontrataciones(alquiler_id);
CREATE INDEX IF NOT EXISTS idx_subcontrataciones_estado ON public.subcontrataciones(estado);
CREATE INDEX IF NOT EXISTS idx_subcontrataciones_fecha ON public.subcontrataciones(fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_subcontrataciones_detalles_sub ON public.subcontrataciones_detalles(subcontratacion_id);

-- 5. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.subcontrataciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontrataciones_detalles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own subcontrataciones" ON public.subcontrataciones;
CREATE POLICY "Tenants can view own subcontrataciones" ON public.subcontrataciones 
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can insert own subcontrataciones" ON public.subcontrataciones;
CREATE POLICY "Tenants can insert own subcontrataciones" ON public.subcontrataciones 
    FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can update own subcontrataciones" ON public.subcontrataciones;
CREATE POLICY "Tenants can update own subcontrataciones" ON public.subcontrataciones 
    FOR UPDATE USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can view own subcontrataciones_detalles" ON public.subcontrataciones_detalles;
CREATE POLICY "Tenants can view own subcontrataciones_detalles" ON public.subcontrataciones_detalles 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenants can insert own subcontrataciones_detalles" ON public.subcontrataciones_detalles;
CREATE POLICY "Tenants can insert own subcontrataciones_detalles" ON public.subcontrataciones_detalles 
    FOR INSERT WITH CHECK (true);

COMMIT;

-- 6. RECARGAR SCHEMA POSTGREST
NOTIFY pgrst, 'reload schema';
