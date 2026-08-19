-- ============================================================================
-- MIGRACIÓN DE ARQUITECTURA DE DATOS: INTEGRIDAD REFERENCIAL & SOFT DELETE
-- Proyecto: Alquileres ERP (ferreon-erp-nextjs)
-- ============================================================================

-- 1. TABLA CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nit_cedula VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(150),
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by VARCHAR(100) NULL
);

CREATE INDEX IF NOT EXISTS idx_clientes_busqueda ON public.clientes (nit_cedula, nombre) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_deleted ON public.clientes (deleted_at);

-- 2. TABLA EQUIPOS (BODEGA)
CREATE TABLE IF NOT EXISTS public.equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    tarifa_diaria NUMERIC(12, 2) NOT NULL CHECK (tarifa_diaria >= 0),
    peso_gramos BIGINT NOT NULL CHECK (peso_gramos >= 0),
    stock_total INT NOT NULL CHECK (stock_total >= 0),
    stock_disponible INT NOT NULL CHECK (stock_disponible >= 0),
    stock_en_obra INT NOT NULL CHECK (stock_en_obra >= 0),
    stock_mantenimiento INT NOT NULL DEFAULT 0 CHECK (stock_mantenimiento >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by VARCHAR(100) NULL,
    CONSTRAINT check_stock_balance CHECK (stock_disponible + stock_en_obra + stock_mantenimiento = stock_total)
);

CREATE INDEX IF NOT EXISTS idx_equipos_busqueda ON public.equipos (codigo, categoria) WHERE deleted_at IS NULL;

-- 3. TABLA ALQUILERES (CABECERA)
CREATE TABLE IF NOT EXISTS public.alquileres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consecutivo SERIAL UNIQUE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('COTIZACION', 'ACTIVO', 'FINALIZADO', 'CANCELADO')),
    subtotal_equipos NUMERIC(12, 2) NOT NULL DEFAULT 0,
    flete_entrega NUMERIC(12, 2) NOT NULL DEFAULT 0,
    flete_recogida NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal_general NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    deposito NUMERIC(12, 2) NOT NULL DEFAULT 0,
    garantia_monto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    garantia_tipo VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    garantia_estado VARCHAR(50) NOT NULL DEFAULT 'Activa',
    observaciones TEXT,
    detalles_logistica TEXT,
    creado_por VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by VARCHAR(100) NULL
);

CREATE INDEX IF NOT EXISTS idx_alquileres_cliente_id ON public.alquileres (cliente_id);
CREATE INDEX IF NOT EXISTS idx_alquileres_estado ON public.alquileres (estado) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alquileres_consecutivo ON public.alquileres (consecutivo);

-- 4. TABLA LINEAS DE ALQUILER (DETALLE)
CREATE TABLE IF NOT EXISTS public.alquiler_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alquiler_id UUID NOT NULL REFERENCES public.alquileres(id) ON DELETE CASCADE,
    equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    tarifa_aplicada NUMERIC(12, 2) NOT NULL CHECK (tarifa_aplicada >= 0),
    peso_gramos BIGINT NOT NULL CHECK (peso_gramos >= 0),
    dias_contratados INT NOT NULL CHECK (dias_contratados > 0),
    subtotal_linea NUMERIC(12, 2) NOT NULL CHECK (subtotal_linea >= 0),
    costo_dano NUMERIC(12, 2) NOT NULL DEFAULT 0,
    devuelto BOOLEAN NOT NULL DEFAULT FALSE,
    cantidad_devuelta INT NOT NULL DEFAULT 0,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alquiler_detalles_alquiler_id ON public.alquiler_detalles (alquiler_id);
CREATE INDEX IF NOT EXISTS idx_alquiler_detalles_equipo_id ON public.alquiler_detalles (equipo_id);

-- 5. TABLA FACTURAS Y CUENTAS DE COBRO
CREATE TABLE IF NOT EXISTS public.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_consecutivo SERIAL UNIQUE,
    tipo_documento VARCHAR(50) NOT NULL DEFAULT 'CUENTA_COBRO',
    alquiler_id UUID NOT NULL REFERENCES public.alquileres(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    subtotal NUMERIC(12, 2) NOT NULL,
    costos_dano NUMERIC(12, 2) NOT NULL DEFAULT 0,
    deposito_aplicado NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_pagar NUMERIC(12, 2) NOT NULL,
    estado_pago VARCHAR(30) NOT NULL DEFAULT 'EMITIDA' CHECK (estado_pago IN ('EMITIDA', 'PAGADA', 'ANULADA')),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by VARCHAR(100) NULL
);

CREATE INDEX IF NOT EXISTS idx_facturas_alquiler_id ON public.facturas (alquiler_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id ON public.facturas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas (estado_pago) WHERE deleted_at IS NULL;
