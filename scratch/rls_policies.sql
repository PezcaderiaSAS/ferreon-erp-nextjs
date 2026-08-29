-- Habilitar RLS en todas las tablas principales
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alquileres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alquiler_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen (opcional)
DROP POLICY IF EXISTS "Permitir todo en clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir todo en equipos" ON public.equipos;
DROP POLICY IF EXISTS "Permitir todo en alquileres" ON public.alquileres;
DROP POLICY IF EXISTS "Permitir todo en alquiler_detalles" ON public.alquiler_detalles;
DROP POLICY IF EXISTS "Permitir todo en facturas" ON public.facturas;

-- Crear políticas para permitir acceso a la aplicación (lectura y escritura para todos temporalmente)
CREATE POLICY "Permitir todo en clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en equipos" ON public.equipos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en alquileres" ON public.alquileres FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en alquiler_detalles" ON public.alquiler_detalles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en facturas" ON public.facturas FOR ALL USING (true) WITH CHECK (true);
