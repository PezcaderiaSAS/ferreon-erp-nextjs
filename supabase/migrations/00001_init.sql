-- ========================================================
-- FerreOn ERP - Initial Migration
-- ========================================================

-- Table: equipos
CREATE TABLE IF NOT EXISTS public.equipos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Disponible',
    peso_gramos BIGINT NOT NULL, -- Stored explicitly in grams
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nit TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    contacto TEXT NOT NULL,
    nivel_riesgo TEXT NOT NULL DEFAULT 'Bajo',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS (Row Level Security) for security best practices
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for development phase)
-- IMPORTANT: In production, these should be restricted to authenticated users.
CREATE POLICY "Allow all operations for development on equipos" 
ON public.equipos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development on clientes" 
ON public.clientes FOR ALL USING (true) WITH CHECK (true);
