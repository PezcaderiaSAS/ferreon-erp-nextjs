-- ==============================================================================
-- MIGRACIÓN: MÓDULO DE COTIZACIONES DE OBRA, IMPUESTOS SELECCIONABLES Y FACTURAS
-- Proyecto: FerreOn ERP
-- Fecha: 2026-09-10
-- ==============================================================================

BEGIN;

-- 1. ASEGURAR CUENTAS CONTABLES PARA IMPUESTOS EN EL PLAN DE CUENTAS
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    is_cash_equivalent BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Impuesto sobre las Ventas por Pagar (IVA 19%)', 'LIABILITY', false, 'Pasivo fiscal por IVA recaudado/generado en alquileres'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Impuesto sobre las Ventas por Pagar (IVA 19%)');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Anticipo de Impuestos (ReteFuente / ICA)', 'ASSET', false, 'Retenciones en la fuente e ICA practicadas por clientes corporativos'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Anticipo de Impuestos (ReteFuente / ICA)');

-- 2. TABLA DE COTIZACIONES DE OBRA
CREATE TABLE IF NOT EXISTS public.cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    consecutivo VARCHAR(50) UNIQUE NOT NULL,
    cliente_id BIGINT REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_documento VARCHAR(50),
    cliente_telefono VARCHAR(50),
    cliente_email VARCHAR(100),
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    obra_nombre VARCHAR(255),
    obra_direccion TEXT,
    
    -- Parámetros de Impuestos Seleccionables
    aplica_iva BOOLEAN NOT NULL DEFAULT true,
    tasa_iva DECIMAL(5,2) NOT NULL DEFAULT 19.00,
    aplica_retefuente BOOLEAN NOT NULL DEFAULT false,
    tasa_retefuente DECIMAL(5,2) NOT NULL DEFAULT 2.50,
    aplica_reteica BOOLEAN NOT NULL DEFAULT false,
    tasa_reteica DECIMAL(5,2) NOT NULL DEFAULT 0.966,

    -- Desglose Financiero
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_iva DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_retefuente DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_reteica DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_transporte DECIMAL(15,2) NOT NULL DEFAULT 0,
    deposito_garantia DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Estado y Trazabilidad de Conversión a Contrato
    estado VARCHAR(30) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'CONVERTIDA')),
    alquiler_id BIGINT REFERENCES public.alquileres(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA DE LÍNEAS DE DETALLE DE COTIZACIÓN
CREATE TABLE IF NOT EXISTS public.cotizaciones_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_id UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
    equipo_id BIGINT NOT NULL REFERENCES public.equipos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    dias INT NOT NULL CHECK (dias > 0),
    tarifa_diaria DECIMAL(15,2) NOT NULL CHECK (tarifa_diaria >= 0),
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AMPLIAR TABLA ALQUILERES PARA MANTENER CAMPOS DE IMPUESTOS AL CONVERTIR
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquileres' AND column_name='aplica_iva') THEN
        ALTER TABLE public.alquileres ADD COLUMN aplica_iva BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquileres' AND column_name='valor_iva') THEN
        ALTER TABLE public.alquileres ADD COLUMN valor_iva DECIMAL(15,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquileres' AND column_name='aplica_retefuente') THEN
        ALTER TABLE public.alquileres ADD COLUMN aplica_retefuente BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquileres' AND column_name='valor_retefuente') THEN
        ALTER TABLE public.alquileres ADD COLUMN valor_retefuente DECIMAL(15,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquileres' AND column_name='aplica_reteica') THEN
        ALTER TABLE public.alquileres ADD COLUMN aplica_reteica BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquileres' AND column_name='valor_reteica') THEN
        ALTER TABLE public.alquileres ADD COLUMN valor_reteica DECIMAL(15,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquileres' AND column_name='valor_transporte') THEN
        ALTER TABLE public.alquileres ADD COLUMN valor_transporte DECIMAL(15,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquileres' AND column_name='cotizacion_origen_id') THEN
        ALTER TABLE public.alquileres ADD COLUMN cotizacion_origen_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_cotizaciones_tenant ON public.cotizaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON public.cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON public.cotizaciones(fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON public.cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_detalles_cot ON public.cotizaciones_detalles(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_detalles_eq ON public.cotizaciones_detalles(equipo_id);

-- 6. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones_detalles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own cotizaciones" ON public.cotizaciones;
CREATE POLICY "Tenants can view own cotizaciones" ON public.cotizaciones 
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IS NULL);

DROP POLICY IF EXISTS "Tenants can insert own cotizaciones" ON public.cotizaciones;
CREATE POLICY "Tenants can insert own cotizaciones" ON public.cotizaciones 
    FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL);

DROP POLICY IF EXISTS "Tenants can update own cotizaciones" ON public.cotizaciones;
CREATE POLICY "Tenants can update own cotizaciones" ON public.cotizaciones 
    FOR UPDATE USING (tenant_id = auth.uid() OR tenant_id IS NULL);

DROP POLICY IF EXISTS "Tenants can view own cotizaciones_detalles" ON public.cotizaciones_detalles;
CREATE POLICY "Tenants can view own cotizaciones_detalles" ON public.cotizaciones_detalles 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenants can insert own cotizaciones_detalles" ON public.cotizaciones_detalles;
CREATE POLICY "Tenants can insert own cotizaciones_detalles" ON public.cotizaciones_detalles 
    FOR INSERT WITH CHECK (true);

COMMIT;
