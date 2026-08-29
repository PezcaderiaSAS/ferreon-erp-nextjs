-- =================================================================================
-- Script de Limpieza y Depuración de Equipos Repetidos (Idempotencia Data Layer)
-- =================================================================================
-- Propósito: Identificar equipos con el mismo nombre, consolidar su stock en el
-- registro más antiguo (maestro), reasignar alquiler_detalles a este maestro,
-- y eliminar los registros duplicados redundantes de forma segura transaccional.
-- =================================================================================

BEGIN;

DO $$
DECLARE
    r RECORD;
    v_duplicados_count INT := 0;
BEGIN
    FOR r IN (
        SELECT 
            UPPER(TRIM(nombre)) as nombre_norm,
            MIN(id) as maestro_id,
            array_remove(array_agg(id), MIN(id)) as ids_duplicados,
            SUM(stock_disponible) as suma_stock_disponible,
            SUM(stock_total) as suma_stock_total
        FROM public.equipos
        WHERE deleted_at IS NULL
        GROUP BY UPPER(TRIM(nombre))
        HAVING COUNT(id) > 1
    )
    LOOP
        -- 1. Actualizar las referencias en alquiler_detalles para evitar violar FK
        UPDATE public.alquiler_detalles
        SET equipo_id = r.maestro_id
        WHERE equipo_id = ANY(r.ids_duplicados);

        -- 2. Consolidar el stock en el maestro
        UPDATE public.equipos
        SET 
            stock_disponible = r.suma_stock_disponible,
            stock_total = r.suma_stock_total,
            nombre = UPPER(TRIM(nombre)) -- Aprovechamos para estandarizar en mayúsculas
        WHERE id = r.maestro_id;

        -- 3. Eliminar físicamente los registros duplicados redundantes
        DELETE FROM public.equipos
        WHERE id = ANY(r.ids_duplicados);

        v_duplicados_count := v_duplicados_count + array_length(r.ids_duplicados, 1);
    END LOOP;

    RAISE NOTICE 'Limpieza completada: Se eliminaron y unificaron % registros duplicados.', v_duplicados_count;
END $$;

COMMIT;
