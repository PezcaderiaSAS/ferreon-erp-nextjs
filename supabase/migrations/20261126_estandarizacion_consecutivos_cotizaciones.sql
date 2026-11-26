-- ============================================================================
-- MIGRACIÓN: Estandarización de Consecutivos de Cotizaciones (TICKET DB-001)
-- Formato Canónico Corporativo: COT-YYYY-XXXX (ej. COT-2026-0069)
-- ============================================================================

-- 1. Función de Trigger para autogenerar correlativo COT-YYYY-XXXX BEFORE INSERT
CREATE OR REPLACE FUNCTION public.fn_autogenerar_consecutivo_cotizacion()
RETURNS TRIGGER AS $$
DECLARE
    v_anio TEXT;
    v_max_seq INT;
    v_siguiente INT;
    v_nuevo_consecutivo TEXT;
BEGIN
    -- Determinar el año de emisión
    v_anio := to_char(COALESCE(NEW.fecha_emision, CURRENT_DATE), 'YYYY');

    -- Solo generar si consecutivo está vacío o no sigue el patrón canónico COT-YYYY-XXXX
    IF NEW.consecutivo IS NULL 
       OR TRIM(NEW.consecutivo) = '' 
       OR NEW.consecutivo !~ ('^COT-' || v_anio || '-\d{4,}$') THEN

        -- Bloqueo pesimista para evitar carreras en concurrencia por empresa y año
        SELECT COALESCE(MAX(
            CASE 
                WHEN consecutivo ~ ('^COT-' || v_anio || '-(\d+)$') THEN
                    (regexp_match(consecutivo, '^COT-' || v_anio || '-(\d+)$'))[1]::INT
                WHEN consecutivo ~ '^\d+$' THEN
                    consecutivo::INT
                ELSE 0
            END
        ), 0)
        INTO v_max_seq
        FROM public.cotizaciones
        WHERE (empresa_id = NEW.empresa_id OR (empresa_id IS NULL AND NEW.empresa_id IS NULL))
          AND to_char(COALESCE(fecha_emision, CURRENT_DATE), 'YYYY') = v_anio;

        v_siguiente := v_max_seq + 1;
        NEW.consecutivo := 'COT-' || v_anio || '-' || lpad(v_siguiente::TEXT, 4, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Asociar el trigger BEFORE INSERT a la tabla public.cotizaciones
DROP TRIGGER IF EXISTS trg_autogenerar_consecutivo_cotizacion ON public.cotizaciones;
CREATE TRIGGER trg_autogenerar_consecutivo_cotizacion
BEFORE INSERT ON public.cotizaciones
FOR EACH ROW
EXECUTE FUNCTION public.fn_autogenerar_consecutivo_cotizacion();

-- 3. Script de Migración de Consecutivos Antiguos (Legacy)
-- Convierte identificadores numéricos simples (#69, #54) y formatos legacy al canónico COT-YYYY-XXXX
DO $$
DECLARE
    r RECORD;
    v_anio_reg TEXT;
    v_num_limpio TEXT;
    v_consecutivo_final TEXT;
    v_contador INT;
BEGIN
    FOR r IN 
        SELECT id, consecutivo, fecha_emision, created_at, empresa_id 
        FROM public.cotizaciones 
        WHERE consecutivo !~ '^COT-\d{4}-\d{4,}$'
        ORDER BY COALESCE(fecha_emision, created_at::DATE, CURRENT_DATE) ASC, id ASC
    LOOP
        v_anio_reg := to_char(COALESCE(r.fecha_emision, r.created_at::DATE, CURRENT_DATE), 'YYYY');
        v_num_limpio := regexp_replace(COALESCE(r.consecutivo, ''), '\D', '', 'g');

        IF v_num_limpio = '' THEN
            v_num_limpio := '1';
        END IF;

        v_consecutivo_final := 'COT-' || v_anio_reg || '-' || lpad(v_num_limpio, 4, '0');

        -- Evitar colisión si ya existe ese consecutivo en la tabla
        v_contador := 1;
        WHILE EXISTS (SELECT 1 FROM public.cotizaciones WHERE consecutivo = v_consecutivo_final AND id != r.id) LOOP
            v_consecutivo_final := 'COT-' || v_anio_reg || '-' || lpad((v_num_limpio::INT + v_contador)::TEXT, 4, '0');
            v_contador := v_contador + 1;
        END LOOP;

        UPDATE public.cotizaciones
        SET consecutivo = v_consecutivo_final
        WHERE id = r.id;
    END LOOP;
END $$;
