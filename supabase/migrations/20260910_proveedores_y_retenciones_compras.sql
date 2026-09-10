-- ==============================================================================
-- MIGRACIÓN: MÓDULO DE PROVEEDORES, COMPRAS TRIBUTARIAS Y RETENCIONES LEDGER
-- Proyecto: FerreOn ERP
-- Fecha: 2026-09-10
-- ==============================================================================

BEGIN;

-- 1. TABLA DE PROVEEDORES
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    nombre VARCHAR(255) NOT NULL,
    nit VARCHAR(50) NOT NULL,
    contacto VARCHAR(150),
    telefono VARCHAR(50),
    email VARCHAR(100),
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    dias_credito INT NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda ágil para autocompletado y búsquedas asistidas
CREATE INDEX IF NOT EXISTS idx_proveedores_tenant ON public.proveedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_nit ON public.proveedores(nit);
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON public.proveedores(nombre);

-- 2. ASEGURAR CAMPOS TRIBUTARIOS EN TABLA DE COMPRAS
DO $$ 
BEGIN
    -- Crear tabla compras si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compras' AND table_schema = 'public') THEN
        CREATE TABLE public.compras (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            numero_orden VARCHAR(50) NOT NULL,
            proveedor_nombre VARCHAR(255) NOT NULL,
            proveedor_nit VARCHAR(50),
            proveedor_telefono VARCHAR(50),
            proveedor_email VARCHAR(100),
            fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
            metodo_pago VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO' CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CREDITO')),
            subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
            impuestos DECIMAL(15,2) NOT NULL DEFAULT 0,
            total DECIMAL(15,2) NOT NULL DEFAULT 0,
            estado VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA' CHECK (estado IN ('PENDIENTE', 'COMPLETADA', 'ANULADA')),
            observaciones TEXT,
            transaction_id UUID,
            usuario_id UUID,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;

    -- Añadir proveedor_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'proveedor_id') THEN
        ALTER TABLE public.compras ADD COLUMN proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL;
    END IF;

    -- Añadir desglose tributario
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'aplica_iva') THEN
        ALTER TABLE public.compras ADD COLUMN aplica_iva BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'valor_iva') THEN
        ALTER TABLE public.compras ADD COLUMN valor_iva DECIMAL(15,2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'aplica_retefuente') THEN
        ALTER TABLE public.compras ADD COLUMN aplica_retefuente BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'porcentaje_retefuente') THEN
        ALTER TABLE public.compras ADD COLUMN porcentaje_retefuente DECIMAL(5,2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'valor_retefuente') THEN
        ALTER TABLE public.compras ADD COLUMN valor_retefuente DECIMAL(15,2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'aplica_reteica') THEN
        ALTER TABLE public.compras ADD COLUMN aplica_reteica BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'porcentaje_reteica') THEN
        ALTER TABLE public.compras ADD COLUMN porcentaje_reteica DECIMAL(5,2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'valor_reteica') THEN
        ALTER TABLE public.compras ADD COLUMN valor_reteica DECIMAL(15,2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'neto_pagar') THEN
        ALTER TABLE public.compras ADD COLUMN neto_pagar DECIMAL(15,2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 3. TABLA DE DETALLES DE COMPRA
CREATE TABLE IF NOT EXISTS public.compras_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
    equipo_id BIGINT NOT NULL REFERENCES public.equipos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(15,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INYECTAR CUENTAS CONTABLES TRIBUTARIAS EN FINANCIAL_ACCOUNTS
INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'IVA Descontable en Compras', 'ASSET', false, 'Impuesto a las ventas descontable en compras de bienes y activos (Cuenta 2408)'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'IVA Descontable en Compras');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'ReteFuente por Pagar (Compras)', 'LIABILITY', false, 'Retenciones practicadas a proveedores por compras (Cuenta 2365)'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'ReteFuente por Pagar (Compras)');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'ReteICA por Pagar (Compras)', 'LIABILITY', false, 'Retención de Industria y Comercio practicada a proveedores (Cuenta 2368)'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'ReteICA por Pagar (Compras)');

-- 5. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own proveedores" ON public.proveedores;
CREATE POLICY "Tenants can view own proveedores" ON public.proveedores 
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IS NULL);

DROP POLICY IF EXISTS "Tenants can insert own proveedores" ON public.proveedores 
    FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL);

DROP POLICY IF EXISTS "Tenants can update own proveedores" ON public.proveedores 
    FOR UPDATE USING (tenant_id = auth.uid() OR tenant_id IS NULL);

COMMIT;
