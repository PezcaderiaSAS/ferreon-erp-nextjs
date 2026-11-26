-- ============================================================================
-- AUDITORÍA DE SEGURIDAD RLS Y DIAGNÓSTICO DE INVENTARIO (TICKET BE-001)
-- Garantiza aislamiento multi-tenant estricto y detección de datos semilla
-- ============================================================================

-- 1. Verificación y Blindaje de RLS en public.equipos
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento estricto por empresa_id para usuarios autenticados
DROP POLICY IF EXISTS "Equipos aislamiento multi-tenant estricto" ON public.equipos;
CREATE POLICY "Equipos aislamiento multi-tenant estricto" ON public.equipos
FOR ALL TO authenticated
USING (
    empresa_id = public.fn_obtener_empresa_activa()
    OR empresa_id IN (
        SELECT empresa_id FROM public.usuarios WHERE auth_id = auth.uid() OR id = auth.uid()
    )
)
WITH CHECK (
    empresa_id = public.fn_obtener_empresa_activa()
    OR empresa_id IN (
        SELECT empresa_id FROM public.usuarios WHERE auth_id = auth.uid() OR id = auth.uid()
    )
);

-- 2. Diagnóstico de Inventario por Tenant y Detección de Registros Anómalos
-- Ejecute este bloque para auditar el volumen real vs datos semilla sin borrado destructivo:
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== AUDITORÍA DE VOLUMEN DE INVENTARIO POR EMPRESA ===';
    FOR r IN
        SELECT 
            COALESCE(empresa_id::TEXT, 'HUÉRFANO (SIN TENANT)') as tenant,
            count(*) as items_distintos,
            COALESCE(sum(stock_total), 0) as total_unidades_stock,
            COALESCE(sum(stock_disponible), 0) as total_unidades_libres,
            COALESCE(max(stock_total), 0) as mayor_stock_item
        FROM public.equipos
        GROUP BY empresa_id
        ORDER BY total_unidades_stock DESC
    LOOP
        RAISE NOTICE 'Tenant: %, Equipos: %, Stock Total: %, Stock Libres: %, Max Ítem: %',
            r.tenant, r.items_distintos, r.total_unidades_stock, r.total_unidades_libres, r.mayor_stock_item;
    END LOOP;
END $$;

-- 3. Consulta de Auditoría Específica de Equipos Semilla / Mock (Solo Lectura)
-- Lista equipos con stock desproporcionado (> 1,000 unidades) o códigos de prueba
SELECT 
    id, 
    empresa_id, 
    codigo, 
    nombre, 
    stock_total, 
    stock_disponible, 
    estado,
    created_at
FROM public.equipos
WHERE stock_total >= 1000 
   OR codigo ILIKE '%MOCK%' 
   OR codigo ILIKE '%SEED%' 
   OR codigo ILIKE '%TEST%'
   OR empresa_id IS NULL
ORDER BY stock_total DESC;

-- 4. Guía de Purga Controlada (Comentada para evitar borrados accidentales en producción):
-- Si el cliente 'pezcaderia.2022' requiere purgar registros semilla creados por scripts de prueba:
--
-- BEGIN;
-- -- Paso A: Respaldar temporalmente antes de eliminar
-- CREATE TABLE IF NOT EXISTS public._backup_equipos_seed_20261126 AS 
-- SELECT * FROM public.equipos WHERE (stock_total >= 1000 OR codigo ILIKE 'TEST-%') AND empresa_id = 'UUID_EMPRESA';
--
-- -- Paso B: Eliminar únicamente si no tienen contratos o kardex activo asociado
-- DELETE FROM public.equipos 
-- WHERE (stock_total >= 1000 OR codigo ILIKE 'TEST-%')
--   AND empresa_id = 'UUID_EMPRESA'
--   AND id NOT IN (SELECT DISTINCT equipo_id FROM public.alquiler_detalles WHERE equipo_id IS NOT NULL);
--
-- COMMIT;
