-- ========================================================
-- FerreOn ERP - Initial Schema Migration
-- Destino: Supabase PostgreSQL
-- Fecha: 2026-08-18
-- ========================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERADOR', 'LECTOR');
CREATE TYPE alquiler_estado AS ENUM ('COTIZACION', 'ACTIVO', 'FINALIZADO', 'CANCELADO');

-- 1. Tabla de Usuarios (Sincronizada con Supabase Auth)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol user_role NOT NULL DEFAULT 'OPERADOR',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Clientes
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nit_cedula TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Items / Catálogo de Equipos
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    tarifa_diaria NUMERIC(12, 2) NOT NULL CHECK (tarifa_diaria >= 0),
    stock_total INT NOT NULL CHECK (stock_total >= 0),
    stock_disponible INT NOT NULL CHECK (stock_disponible >= 0),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de Alquileres (Cabecera)
CREATE TABLE public.alquileres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consecutivo SERIAL UNIQUE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    estado alquiler_estado NOT NULL DEFAULT 'COTIZACION',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deposito NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    garantia_monto NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    garantia_tipo TEXT DEFAULT 'Efectivo',
    garantia_estado TEXT DEFAULT 'Activa',
    observaciones_generales TEXT,
    creado_por UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Detalles de Alquiler (Renglones)
CREATE TABLE public.alquileres_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alquiler_id UUID NOT NULL REFERENCES public.alquileres(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    tarifa_aplicada NUMERIC(12, 2) NOT NULL CHECK (tarifa_aplicada >= 0),
    peso_gramos BIGINT NOT NULL DEFAULT 0 CHECK (peso_gramos >= 0), -- Peso en gramos enteros
    subtotal_linea NUMERIC(12, 2) NOT NULL CHECK (subtotal_linea >= 0),
    costo_dano NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (costo_dano >= 0),
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    estado_devolucion TEXT DEFAULT 'PENDIENTE'
);

-- 6. Facturas / Cuentas de Cobro Header
CREATE TABLE public.facturas_header (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_cc TEXT UNIQUE NOT NULL,
    alquiler_id UUID NOT NULL REFERENCES public.alquileres(id) ON DELETE RESTRICT,
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    saldo_pendiente NUMERIC(12, 2) NOT NULL CHECK (saldo_pendiente >= 0),
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Logs de Auditoría
CREATE TABLE public.logs_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id),
    accion TEXT NOT NULL,
    id_alquiler UUID REFERENCES public.alquileres(id) ON DELETE SET NULL,
    detalle JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alquileres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alquileres_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuarios autenticados leen usuarios" ON public.usuarios
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Lectura de clientes autenticados" ON public.clientes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Escritura de clientes por operadores y admin" ON public.clientes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = auth.uid() AND rol IN ('ADMIN', 'OPERADOR') AND activo = true
        )
    );

CREATE POLICY "Lectura de items autenticados" ON public.items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Lectura de alquileres autenticados" ON public.alquileres
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Escritura de alquileres por operadores y admin" ON public.alquileres
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = auth.uid() AND rol IN ('ADMIN', 'OPERADOR') AND activo = true
        )
    );

CREATE POLICY "Lectura de detalles autenticados" ON public.alquileres_detalle
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Escritura de detalles por operadores y admin" ON public.alquileres_detalle
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = auth.uid() AND rol IN ('ADMIN', 'OPERADOR') AND activo = true
        )
    );

CREATE POLICY "Lectura de facturas autenticadas" ON public.facturas_header
    FOR SELECT USING (auth.role() = 'authenticated');
