-- ============================================================================
-- MIGRACIÓN: Formalización In-Situ de Alquileres en Cotización y Stock Dinámico
-- Archivo: supabase/migrations/20260924150000_formalizar_alquiler_cotizacion_transaccional.sql
-- ============================================================================

-- 1. PROCEDIMIENTO ALMACENADO PARA FORMALIZAR ALQUILER EXISTENTE (ID NUMÉRICO / BIGINT)
CREATE OR REPLACE FUNCTION public.formalizar_alquiler_cotizacion_transaccional(
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alquiler_id BIGINT;
    v_nueva_fecha_inicio DATE;
    v_fecha_min_orig DATE;
    v_shift_dias INT;
    v_idempotency_key TEXT;
    v_detalles_logistica TEXT;
    v_usuario_id UUID;
    
    v_alquiler RECORD;
    v_tenant_id UUID;
    v_consecutivo INT;
    v_total NUMERIC(15, 2);
    
    v_equipos_ids BIGINT[];
    v_linea RECORD;
    v_dia_pico DATE;
    v_max_ocupado INT;
BEGIN
    -- A. Parsear y validar parámetros
    v_alquiler_id := (p_payload->>'alquiler_id')::BIGINT;
    IF v_alquiler_id IS NULL THEN
        RAISE EXCEPTION 'ERR_PARAMETROS_INVALIDOS: El parámetro alquiler_id es obligatorio.' USING ERRCODE = 'P0001';
    END IF;

    v_idempotency_key := NULLIF(TRIM(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey')), '');
    v_detalles_logistica := COALESCE(p_payload->>'detalles_logistica', p_payload->>'detallesLogistica', '');

    IF p_payload->>'usuario_id' IS NOT NULL AND (p_payload->>'usuario_id') <> '' THEN
        v_usuario_id := (p_payload->>'usuario_id')::UUID;
    ELSE
        v_usuario_id := auth.uid();
    END IF;

    -- B. Cargar alquiler existente
    SELECT * INTO v_alquiler 
    FROM public.alquileres 
    WHERE id = v_alquiler_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_ALQUILER_NOT_FOUND: No se encontró el registro de alquiler con ID %', v_alquiler_id
            USING ERRCODE = 'P0002';
    END IF;

    -- C. Idempotencia: Si ya está formalizado / activo, responder éxito sin duplicar descuentos
    IF v_alquiler.estado IN ('ACTIVO', 'ACTIVO_EN_OBRA', 'PENDIENTE_ENTREGA') THEN
        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'alquiler_id', v_alquiler.id,
            'consecutivo', v_alquiler.consecutivo,
            'estado', v_alquiler.estado,
            'total', v_alquiler.total,
            'mensaje', 'El contrato ya se encontraba activo y formalizado previamente.'
        );
    END IF;

    v_tenant_id := v_alquiler.empresa_id;
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

    -- D. Ratificación de Fechas si la fecha de inicio cotizada quedó en el pasado
    SELECT MIN(fecha_inicio::date) INTO v_fecha_min_orig 
    FROM public.alquiler_detalles 
    WHERE alquiler_id = v_alquiler_id;

    IF p_payload->>'nueva_fecha_inicio' IS NOT NULL AND (p_payload->>'nueva_fecha_inicio') <> '' THEN
        v_nueva_fecha_inicio := (p_payload->>'nueva_fecha_inicio')::DATE;
        IF v_fecha_min_orig IS NOT NULL AND v_nueva_fecha_inicio <> v_fecha_min_orig THEN
            v_shift_dias := (v_nueva_fecha_inicio - v_fecha_min_orig);
            
            -- Desplazar fechas en líneas de detalle (timestamptz + interval)
            UPDATE public.alquiler_detalles
            SET fecha_inicio = fecha_inicio + (v_shift_dias || ' days')::INTERVAL,
                fecha_fin = fecha_fin + (v_shift_dias || ' days')::INTERVAL
            WHERE alquiler_id = v_alquiler_id;
            
            v_fecha_min_orig := v_nueva_fecha_inicio;
        END IF;
    END IF;

    -- Si aún después del ajuste la fecha sigue en el pasado, solicitar ratificación
    IF v_fecha_min_orig IS NOT NULL AND v_fecha_min_orig < CURRENT_DATE THEN
        RAISE EXCEPTION 'ERR_FECHA_INICIO_PASADA: La fecha de inicio (%) de este alquiler está en el pasado. Ratifique la nueva fecha real de despacho antes de formalizar.', v_fecha_min_orig
            USING ERRCODE = 'P0005';
    END IF;

    -- E. Identificar equipos propios que consumen inventario de bodega (excluyendo subcontratados)
    SELECT array_agg(DISTINCT ad.equipo_id) INTO v_equipos_ids
    FROM public.alquiler_detalles ad
    WHERE ad.alquiler_id = v_alquiler_id
      AND COALESCE(ad.es_subcontratado, false) = false;

    -- F. Validación Concurrente de Stock Dinámico con Bloqueo Pesimista
    IF v_equipos_ids IS NOT NULL AND array_length(v_equipos_ids, 1) > 0 THEN
        -- 1. SELECT FOR UPDATE ordenado ascendente (Anti-Deadlocks)
        PERFORM id, stock_total, stock_disponible
        FROM public.equipos
        WHERE id = ANY(v_equipos_ids)
        ORDER BY id ASC
        FOR UPDATE;

        -- 2. Validación de curva de ocupación por cada línea
        FOR v_linea IN 
            SELECT ad.*, e.nombre AS equipo_nombre, e.stock_total, e.stock_disponible
            FROM public.alquiler_detalles ad
            JOIN public.equipos e ON e.id = ad.equipo_id
            WHERE ad.alquiler_id = v_alquiler_id
              AND COALESCE(ad.es_subcontratado, false) = false
        LOOP
            WITH dias_solicitados AS (
                SELECT generate_series(v_linea.fecha_inicio, v_linea.fecha_fin, '1 day'::interval)::date AS dia
            ),
            ocupacion_externa AS (
                SELECT 
                    ds.dia,
                    COALESCE(SUM(ad_ext.cantidad - ad_ext.cantidad_devuelta), 0) AS ocupado_externo
                FROM dias_solicitados ds
                LEFT JOIN public.alquiler_detalles ad_ext 
                    ON ad_ext.equipo_id = v_linea.equipo_id
                   AND ad_ext.alquiler_id <> v_alquiler_id
                   AND ad_ext.devuelto = FALSE
                   AND ad_ext.fecha_inicio <= ds.dia
                   AND COALESCE(ad_ext.fecha_fin, ds.dia) >= ds.dia
                   AND COALESCE(ad_ext.es_subcontratado, false) = false
                LEFT JOIN public.alquileres a_ext
                    ON a_ext.id = ad_ext.alquiler_id
                   AND a_ext.estado IN ('ACTIVO', 'ACTIVO_EN_OBRA', 'PENDIENTE_ENTREGA')
                GROUP BY ds.dia
            )
            SELECT 
                oe.dia,
                (oe.ocupado_externo + v_linea.cantidad) AS total_demanda
            INTO v_dia_pico, v_max_ocupado
            FROM ocupacion_externa oe
            ORDER BY (oe.ocupado_externo + v_linea.cantidad) DESC
            LIMIT 1;

            IF v_max_ocupado > v_linea.stock_total THEN
                RAISE EXCEPTION 'ERR_OVERBOOKING_CONCURRENTE: Stock insuficiente para equipo "%" (ID: %) en la fecha pico %. Stock Total: %, Demanda Comprometida: %, Déficit: % unidades.',
                    v_linea.equipo_nombre,
                    v_linea.equipo_id, 
                    v_dia_pico, 
                    v_linea.stock_total, 
                    v_max_ocupado, 
                    (v_max_ocupado - v_linea.stock_total)
                    USING ERRCODE = 'P0004';
            END IF;
        END LOOP;

        -- 3. Descontar inventario disponible en muelle e incrementar stock en obra
        FOR v_linea IN 
            SELECT ad.equipo_id, SUM(ad.cantidad) AS total_cant
            FROM public.alquiler_detalles ad
            WHERE ad.alquiler_id = v_alquiler_id
              AND COALESCE(ad.es_subcontratado, false) = false
            GROUP BY ad.equipo_id
        LOOP
            UPDATE public.equipos
            SET stock_disponible = GREATEST(0, stock_disponible - v_linea.total_cant),
                stock_en_obra = COALESCE(stock_en_obra, 0) + v_linea.total_cant,
                updated_at = NOW()
            WHERE id = v_linea.equipo_id;
        END LOOP;
    END IF;

    -- G. Transicionar el estado del Alquiler a ACTIVO
    UPDATE public.alquileres
    SET estado = 'ACTIVO',
        saldo_pendiente = total,
        detalles_logistica = CASE 
            WHEN v_detalles_logistica <> '' THEN v_detalles_logistica 
            ELSE detalles_logistica 
        END,
        updated_at = NOW()
    WHERE id = v_alquiler_id
    RETURNING consecutivo, total INTO v_consecutivo, v_total;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'alquiler_id', v_alquiler_id,
        'consecutivo', v_consecutivo,
        'estado', 'ACTIVO',
        'total', v_total,
        'mensaje', 'Contrato de alquiler formalizado con éxito in-situ.'
    );
END;
$$;

-- Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.formalizar_alquiler_cotizacion_transaccional(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.formalizar_alquiler_cotizacion_transaccional(JSONB) TO service_role;
