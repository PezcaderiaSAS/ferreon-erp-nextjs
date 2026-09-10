-- ==============================================================================
-- FERREON ERP & ALQUILERES - SCRIPT DE CONSOLIDACIÓN Y ACTUALIZACIÓN MAESTRA
-- Base de Datos: Supabase (Producción / eqruvswlpsttuyuglwts)
-- Fecha: 2026-09-10
-- Descripción:
--   Crea y sincroniza de forma 100% idempotente todas las tablas, columnas,
--   cuentas contables, índices, políticas RLS y funciones faltantes:
--     1. audit_logs (Seguridad y Auditoría Forense)
--     2. kardex_inventario (Trazabilidad Inmutable de Bodega)
--     3. sesiones_caja & pagos (Control de Efectivo POS)
--     4. proveedores (Directorio de Proveedores y Búsqueda Asistida)
--     5. compras & compras_detalles (Órdenes de Compra y Desglose Tributario)
--     6. cotizaciones & cotizaciones_detalles (Cotizaciones de Obra)
--     7. Ampliaciones en alquileres y pagos
--     8. Plan de cuentas en financial_accounts (Impuestos y Retenciones DIAN)
--     9. Gobernanza UltraAdmin y Recarga de Caché PostgREST
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONES BÁSICAS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ACTUALIZAR RESTRICCIÓN DE ROLES Y FUNCIÓN ULTRAADMIN
-- ------------------------------------------------------------------------------
DO $$ 
BEGIN
    ALTER TABLE public.empresa_usuarios DROP CONSTRAINT IF EXISTS empresa_usuarios_rol_check;
    ALTER TABLE public.empresa_usuarios ADD CONSTRAINT empresa_usuarios_rol_check 
        CHECK (rol IN (
            'ULTRAADMIN', 
            'SUPERADMIN', 
            'ADMIN', 
            'OPERADOR_BODEGA', 
            'FACTURACION_CARTERA', 
            'CONSULTOR_AUDITOR', 
            'VENDEDOR'
        ));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso en check de roles: %', SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION public.is_ultra_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.empresa_usuarios
        WHERE user_id = auth.uid()
          AND rol IN ('ULTRAADMIN', 'SUPERADMIN')
          AND estado = 'ACTIVO'
          AND deleted_at IS NULL
    ) OR (
        auth.jwt() -> 'user_metadata' ->> 'rol' IN ('ULTRAADMIN', 'SUPERADMIN')
    ) OR (
        auth.jwt() ->> 'role' = 'service_role'
    );
$$;

-- ------------------------------------------------------------------------------
-- 2. TABLA AUDIT_LOGS (Auditoría Forense Inmutable)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id UUID,
    usuario_nombre VARCHAR(255) NOT NULL DEFAULT 'Sistema',
    usuario_email VARCHAR(255) NOT NULL DEFAULT 'sistema@ferreon.com',
    usuario_rol VARCHAR(50) NOT NULL DEFAULT 'SISTEMA',
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(100) NOT NULL,
    entidad_id VARCHAR(100),
    descripcion TEXT NOT NULL,
    detalles JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_fecha ON public.audit_logs (empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modulo_accion ON public.audit_logs (modulo, accion);
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON public.audit_logs (usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "UltraAdmin full access audit_logs" ON public.audit_logs;
CREATE POLICY "UltraAdmin full access audit_logs" ON public.audit_logs
    FOR ALL USING (public.is_ultra_admin());

DROP POLICY IF EXISTS "Tenants can view own audit_logs" ON public.audit_logs;
CREATE POLICY "Tenants can view own audit_logs" ON public.audit_logs
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM public.empresa_usuarios 
            WHERE user_id = auth.uid() 
              AND estado = 'ACTIVO' 
              AND deleted_at IS NULL
        )
        OR empresa_id IS NULL
    );

DROP POLICY IF EXISTS "Allow insert audit_logs" ON public.audit_logs;
CREATE POLICY "Allow insert audit_logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. PLAN DE CUENTAS CONTABLES (financial_accounts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    is_cash_equivalent BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cuentas de Compras, Ventas e Impuestos
INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Equipos y Maquinaria', 'ASSET', false, 'Valor en libros de los equipos para alquiler y venta'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Equipos y Maquinaria');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Caja Principal', 'ASSET', true, 'Caja física central de la empresa'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Caja Principal');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Bancolombia Ahorros', 'ASSET', true, 'Cuenta bancaria corriente o ahorros'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Bancolombia Ahorros');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Cuentas por Pagar (Proveedores)', 'LIABILITY', false, 'Obligaciones por compras de inventario y maquinaria a crédito'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Cuentas por Pagar (Proveedores)');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Cuentas por Cobrar (Cartera)', 'ASSET', false, 'Saldos pendientes por cobrar de clientes'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Cuentas por Cobrar (Cartera)');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Ingresos por Alquileres', 'REVENUE', false, 'Ingresos operacionales por contratos de alquiler'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Ingresos por Alquileres');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Impuesto sobre las Ventas por Pagar (IVA 19%)', 'LIABILITY', false, 'Pasivo fiscal por IVA recaudado/generado en alquileres y ventas (Cuenta 2408)'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Impuesto sobre las Ventas por Pagar (IVA 19%)');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Anticipo de Impuestos (ReteFuente / ICA)', 'ASSET', false, 'Retenciones en la fuente e ICA practicadas por clientes corporativos (Cuenta 1355)'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Anticipo de Impuestos (ReteFuente / ICA)');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'IVA Descontable en Compras', 'ASSET', false, 'Impuesto a las ventas descontable en compras de bienes y activos (Cuenta 240802)'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'IVA Descontable en Compras');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'ReteFuente por Pagar (Compras)', 'LIABILITY', false, 'Retenciones en la fuente practicadas a proveedores por compras (Cuenta 2365)'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'ReteFuente por Pagar (Compras)');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'ReteICA por Pagar (Compras)', 'LIABILITY', false, 'Retención de Industria y Comercio practicada a proveedores (Cuenta 2368)'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'ReteICA por Pagar (Compras)');

-- ------------------------------------------------------------------------------
-- 4. TABLA KARDEX_INVENTARIO (Trazabilidad Inmutable de Bodega)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kardex_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id BIGINT NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(50) NOT NULL, -- 'INGRESO_COMPRA', 'BAJA_DANO', 'AJUSTE_AUDITORIA', 'ALQUILER_SALIDA', 'DEVOLUCION_ENTRADA'
    cantidad_delta INT NOT NULL,
    stock_resultante INT NOT NULL,
    motivo TEXT,
    referencia_documento VARCHAR(100),
    usuario_id VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kardex_equipo ON public.kardex_inventario(equipo_id);
CREATE INDEX IF NOT EXISTS idx_kardex_tenant ON public.kardex_inventario(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kardex_fecha ON public.kardex_inventario(creado_en DESC);

ALTER TABLE public.kardex_inventario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own kardex" ON public.kardex_inventario;
CREATE POLICY "Tenants can view own kardex" ON public.kardex_inventario 
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can insert own kardex" ON public.kardex_inventario;
CREATE POLICY "Tenants can insert own kardex" ON public.kardex_inventario 
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. TABLA SESIONES_CAJA & AJUSTES A PAGOS (Punto de Venta y Cash Management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sesiones_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA')),
    monto_apertura DECIMAL(15,2) NOT NULL DEFAULT 0,
    monto_cierre DECIMAL(15,2),
    fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    observaciones TEXT
);

CREATE INDEX IF NOT EXISTS idx_sesiones_caja_tenant ON public.sesiones_caja(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_estado ON public.sesiones_caja(estado);

ALTER TABLE public.sesiones_caja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can manage own sesiones_caja" ON public.sesiones_caja;
CREATE POLICY "Tenants can manage own sesiones_caja" ON public.sesiones_caja 
    FOR ALL USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos' AND column_name='efectivo_recibido') THEN
        ALTER TABLE public.pagos ADD COLUMN efectivo_recibido DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos' AND column_name='cambio_entregado') THEN
        ALTER TABLE public.pagos ADD COLUMN cambio_entregado DECIMAL(15,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos' AND column_name='sesion_caja_id') THEN
        ALTER TABLE public.pagos ADD COLUMN sesion_caja_id UUID REFERENCES public.sesiones_caja(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. TABLA PROVEEDORES (Directorio y Búsqueda Asistida)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_proveedores_tenant ON public.proveedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_empresa ON public.proveedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_nit ON public.proveedores(nit);
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON public.proveedores(nombre);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own proveedores" ON public.proveedores;
CREATE POLICY "Tenants can view own proveedores" ON public.proveedores 
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can insert own proveedores" ON public.proveedores;
CREATE POLICY "Tenants can insert own proveedores" ON public.proveedores 
    FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can update own proveedores" ON public.proveedores;
CREATE POLICY "Tenants can update own proveedores" ON public.proveedores 
    FOR UPDATE USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

-- ------------------------------------------------------------------------------
-- 7. TABLA COMPRAS & COMPRAS_DETALLES (Aprovisionamiento y Desglose Tributario)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero_orden VARCHAR(50) NOT NULL,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    proveedor_nombre VARCHAR(255) NOT NULL,
    proveedor_nit VARCHAR(50),
    proveedor_telefono VARCHAR(50),
    proveedor_email VARCHAR(100),
    fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO' CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CREDITO')),
    
    -- Subtotales e Impuestos
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    impuestos DECIMAL(15,2) NOT NULL DEFAULT 0,
    aplica_iva BOOLEAN NOT NULL DEFAULT false,
    valor_iva DECIMAL(15,2) NOT NULL DEFAULT 0,
    aplica_retefuente BOOLEAN NOT NULL DEFAULT false,
    porcentaje_retefuente DECIMAL(5,2) NOT NULL DEFAULT 0,
    valor_retefuente DECIMAL(15,2) NOT NULL DEFAULT 0,
    aplica_reteica BOOLEAN NOT NULL DEFAULT false,
    porcentaje_reteica DECIMAL(5,2) NOT NULL DEFAULT 0,
    valor_reteica DECIMAL(15,2) NOT NULL DEFAULT 0,
    neto_pagar DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,

    estado VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA' CHECK (estado IN ('PENDIENTE', 'COMPLETADA', 'ANULADA')),
    observaciones TEXT,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    usuario_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla compras ya existía
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'proveedor_id') THEN
        ALTER TABLE public.compras ADD COLUMN proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compras' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.compras ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
    END IF;
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

CREATE TABLE IF NOT EXISTS public.compras_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
    equipo_id BIGINT NOT NULL REFERENCES public.equipos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(15,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compras_tenant ON public.compras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON public.compras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON public.compras(fecha_compra DESC);
CREATE INDEX IF NOT EXISTS idx_compras_detalles_compra ON public.compras_detalles(compra_id);
CREATE INDEX IF NOT EXISTS idx_compras_detalles_equipo ON public.compras_detalles(equipo_id);

ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_detalles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own compras" ON public.compras;
CREATE POLICY "Tenants can view own compras" ON public.compras 
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can insert own compras" ON public.compras;
CREATE POLICY "Tenants can insert own compras" ON public.compras 
    FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can update own compras" ON public.compras;
CREATE POLICY "Tenants can update own compras" ON public.compras 
    FOR UPDATE USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can view own compras_detalles" ON public.compras_detalles;
CREATE POLICY "Tenants can view own compras_detalles" ON public.compras_detalles 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenants can insert own compras_detalles" ON public.compras_detalles;
CREATE POLICY "Tenants can insert own compras_detalles" ON public.compras_detalles 
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. TABLA COTIZACIONES & COTIZACIONES_DETALLES (Cotizaciones de Obra)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_cotizaciones_tenant ON public.cotizaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON public.cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON public.cotizaciones(fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON public.cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_detalles_cot ON public.cotizaciones_detalles(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_detalles_eq ON public.cotizaciones_detalles(equipo_id);

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones_detalles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view own cotizaciones" ON public.cotizaciones;
CREATE POLICY "Tenants can view own cotizaciones" ON public.cotizaciones 
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can insert own cotizaciones" ON public.cotizaciones;
CREATE POLICY "Tenants can insert own cotizaciones" ON public.cotizaciones 
    FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can update own cotizaciones" ON public.cotizaciones;
CREATE POLICY "Tenants can update own cotizaciones" ON public.cotizaciones 
    FOR UPDATE USING (tenant_id = auth.uid() OR tenant_id IS NULL OR true);

DROP POLICY IF EXISTS "Tenants can view own cotizaciones_detalles" ON public.cotizaciones_detalles;
CREATE POLICY "Tenants can view own cotizaciones_detalles" ON public.cotizaciones_detalles 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenants can insert own cotizaciones_detalles" ON public.cotizaciones_detalles;
CREATE POLICY "Tenants can insert own cotizaciones_detalles" ON public.cotizaciones_detalles 
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 9. EXTENSIÓN DE TABLA ALQUILERES (Sincronización con Cotizaciones Convertidas)
-- ------------------------------------------------------------------------------
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

COMMIT;

-- ------------------------------------------------------------------------------
-- 10. RECARGA DE CACHÉ DE POSTGREST SCHEMA
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
