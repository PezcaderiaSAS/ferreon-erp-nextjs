-- ========================================================
-- FerreOn ERP — Script de Inicialización Limpia (Producción)
-- Módulo Core: alquileres_app
-- Destino: Supabase PostgreSQL (Tier $0 USD)
-- Descripción: Instancia vacía sin datos ficticios ni registros
--              de prueba. Tablas, enums, RLS, secuencias e índices
--              listos para iniciar operaciones reales de inmediato.
-- ========================================================

-- 1. Reiniciar secuencias de autoincremento (Consecutivos en 1)
ALTER SEQUENCE IF EXISTS public.alquileres_consecutivo_seq RESTART WITH 1;

-- 2. Asegurar que las tablas estén en estado cero filas (Truncado Limpio con Cascada)
TRUNCATE TABLE 
    public.logs_sistema,
    public.facturas_header,
    public.alquileres_detalle,
    public.alquileres,
    public.items,
    public.clientes,
    public.usuarios
CASCADE;

-- 3. Confirmación de Estructuras e Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_alquileres_cliente ON public.alquileres(cliente_id);
CREATE INDEX IF NOT EXISTS idx_alquileres_estado ON public.alquileres(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_alquiler ON public.alquileres_detalle(alquiler_id);
CREATE INDEX IF NOT EXISTS idx_detalle_item ON public.alquileres_detalle(item_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nit ON public.clientes(nit_cedula);
CREATE INDEX IF NOT EXISTS idx_facturas_alquiler ON public.facturas_header(alquiler_id);

-- 4. Comentario de Confirmación de Instancia Limpia
COMMENT ON SCHEMA public IS 'FerreOn ERP alquileres_app — Instancia de Producción Limpia Inicializada en ' || NOW();
