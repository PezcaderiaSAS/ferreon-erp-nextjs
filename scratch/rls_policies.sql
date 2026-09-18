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

-- Crear políticas seguras para usuarios autenticados
CREATE POLICY "Permitir lectura en clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura en clientes" ON public.clientes FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir lectura en equipos" ON public.equipos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura en equipos" ON public.equipos FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir lectura en alquileres" ON public.alquileres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura en alquileres" ON public.alquileres FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir lectura en alquiler_detalles" ON public.alquiler_detalles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura en alquiler_detalles" ON public.alquiler_detalles FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir lectura en facturas" ON public.facturas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura en facturas" ON public.facturas FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
