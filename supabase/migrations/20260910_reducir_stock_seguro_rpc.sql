-- ============================================================================
-- Migración: Implementación de reducir_stock_seguro y aprobar_cotizacion_transaccional
-- ============================================================================

-- 1. RPC Atómico para reducción segura de stock (Locking Pesimista)
CREATE OR REPLACE FUNCTION public.reducir_stock_seguro(
    p_equipo_id BIGINT,
    p_cantidad_requerida INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stock_actual INT;
BEGIN
    -- Bloquear la fila del equipo para evitar condiciones de carrera (Race Conditions)
    SELECT stock_disponible INTO v_stock_actual 
    FROM public.equipos 
    WHERE id = p_equipo_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Equipo no encontrado (ID: %)', p_equipo_id;
    END IF;

    -- Validación Poka-Yoke: no permitir overbooking de stock propio
    IF COALESCE(v_stock_actual, 0) < p_cantidad_requerida THEN
        RAISE EXCEPTION 'STOCK_INSUFICIENTE: Intento de overbooking detectado para equipo ID % (Requerido: %, Disponible: %)', 
            p_equipo_id, p_cantidad_requerida, COALESCE(v_stock_actual, 0);
    END IF;

    -- Descontar stock disponible e incrementar stock en obra
    UPDATE public.equipos 
    SET 
        stock_disponible = stock_disponible - p_cantidad_requerida,
        stock_en_obra = COALESCE(stock_en_obra, 0) + p_cantidad_requerida,
        updated_at = NOW()
    WHERE id = p_equipo_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reducir_stock_seguro(BIGINT, INT) TO authenticated, service_role, anon;

-- 2. RPC Transaccional Completo para Aprobar Cotización / Activar Contrato
CREATE OR REPLACE FUNCTION public.aprobar_cotizacion_transaccional(
    p_alquiler_id BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alquiler RECORD;
    v_det RECORD;
    v_stock_actual INT;
BEGIN
    -- Validar y bloquear cabecera del alquiler
    SELECT * INTO v_alquiler
    FROM public.alquileres
    WHERE id = p_alquiler_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alquiler no encontrado con ID %', p_alquiler_id;
    END IF;

    IF v_alquiler.estado = 'ACTIVO' THEN
        RETURN jsonb_build_object('success', true, 'mensaje', 'El contrato ya se encuentra activo.');
    END IF;

    -- Recorrer detalles y bloquear cada equipo propio
    FOR v_det IN 
        SELECT ad.equipo_id, ad.cantidad, ad.es_subcontratado, eq.nombre AS equipo_nombre
        FROM public.alquiler_detalles ad
        LEFT JOIN public.equipos eq ON eq.id = ad.equipo_id
        WHERE ad.alquiler_id = p_alquiler_id
    LOOP
        -- Regla de Negocio: Los equipos subcontratados no alteran ni bloquean stock físico propio
        IF COALESCE(v_det.es_subcontratado, FALSE) THEN
            CONTINUE;
        END IF;

        -- Bloquear fila del equipo
        SELECT stock_disponible INTO v_stock_actual
        FROM public.equipos
        WHERE id = v_det.equipo_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Equipo no encontrado (ID: %)', v_det.equipo_id;
        END IF;

        IF COALESCE(v_stock_actual, 0) < v_det.cantidad THEN
            RAISE EXCEPTION 'STOCK_INSUFICIENTE: Intento de overbooking detectado para "%" (ID: %). Solicitado: %, Disponible en bodega: %',
                COALESCE(v_det.equipo_nombre, 'Equipo #' || v_det.equipo_id), v_det.equipo_id, v_det.cantidad, COALESCE(v_stock_actual, 0);
        END IF;

        -- Descontar inventario disponible
        UPDATE public.equipos
        SET 
            stock_disponible = stock_disponible - v_det.cantidad,
            stock_en_obra = COALESCE(stock_en_obra, 0) + v_det.cantidad,
            updated_at = NOW()
        WHERE id = v_det.equipo_id;
    END LOOP;

    -- Marcar contrato como ACTIVO
    UPDATE public.alquileres
    SET 
        estado = 'ACTIVO',
        updated_at = NOW()
    WHERE id = p_alquiler_id;

    RETURN jsonb_build_object('success', true, 'alquiler_id', p_alquiler_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprobar_cotizacion_transaccional(BIGINT) TO authenticated, service_role, anon;

-- Recargar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
