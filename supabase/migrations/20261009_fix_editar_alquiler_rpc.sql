-- ============================================================================
-- MIGRACIÓN: 20261009_fix_editar_alquiler_rpc.sql
-- Descripción: Corrección de tipo de dato en cliente_id (BIGINT), soporte diferenciado
--              para cotizaciones sin descuento de stock y actualización de impuestos/garantías.
-- Proyecto: Alquileres System (alquileres-erp-nextjs)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.editar_alquiler_transaccional_v1(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_alquiler_id BIGINT;
    v_estado_actual VARCHAR;
    v_nuevo_estado VARCHAR;
    v_det RECORD;
    v_item JSONB;
    v_equipo_id BIGINT;
    v_cantidad INT;
    v_tarifa NUMERIC(14, 2);
    v_dias INT;
    v_subtotal_linea NUMERIC(14, 2);
    v_stock_disp INT;
BEGIN
    v_tenant_id := public.get_current_tenant_id();
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;

    v_alquiler_id := (p_payload->>'alquiler_id')::BIGINT;

    -- 1. Bloquear cabecera y obtener estado actual
    SELECT estado INTO v_estado_actual 
    FROM public.alquileres 
    WHERE id = v_alquiler_id 
    FOR UPDATE;

    IF v_estado_actual IS NULL THEN
        RAISE EXCEPTION 'ALQUILER_NOT_FOUND: El registro con ID % no existe.', v_alquiler_id;
    END IF;

    v_nuevo_estado := COALESCE(p_payload->>'estado', v_estado_actual);

    -- 2. Revertir atómicamente stock solo si era un contrato con descuento de bodega
    IF v_estado_actual <> 'COTIZACION' THEN
        FOR v_det IN SELECT equipo_id, cantidad, es_subcontratado 
                     FROM public.alquiler_detalles 
                     WHERE alquiler_id = v_alquiler_id LOOP
            IF NOT COALESCE(v_det.es_subcontratado, false) THEN
                UPDATE public.equipos
                SET stock_disponible = stock_disponible + v_det.cantidad,
                    stock_en_obra = GREATEST(0, stock_en_obra - v_det.cantidad),
                    updated_at = NOW()
                WHERE id = v_det.equipo_id;
            END IF;
        END LOOP;
    END IF;

    -- Eliminar detalles anteriores
    DELETE FROM public.alquiler_detalles WHERE alquiler_id = v_alquiler_id;

    -- 3. Insertar nuevos detalles y descontar nuevo stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_equipo_id := (v_item->>'equipo_id')::BIGINT;
        v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
        v_tarifa := COALESCE((v_item->>'tarifa_aplicada')::NUMERIC, 0);
        v_dias := COALESCE((v_item->>'dias_contratados')::INT, 1);
        v_subtotal_linea := COALESCE((v_item->>'subtotal_linea')::NUMERIC, v_cantidad * v_tarifa * v_dias);

        IF v_nuevo_estado <> 'COTIZACION' AND NOT COALESCE((v_item->>'es_subcontratado')::BOOLEAN, false) THEN
            SELECT stock_disponible INTO v_stock_disp
            FROM public.equipos
            WHERE id = v_equipo_id
            FOR UPDATE;

            IF v_stock_disp < v_cantidad THEN
                RAISE EXCEPTION 'INSUFFICIENT_STOCK: Stock insuficiente para equipo ID % al editar.', v_equipo_id;
            END IF;

            UPDATE public.equipos
            SET stock_disponible = stock_disponible - v_cantidad,
                stock_en_obra = COALESCE(stock_en_obra, 0) + v_cantidad,
                updated_at = NOW()
            WHERE id = v_equipo_id;
        END IF;

        INSERT INTO public.alquiler_detalles (
            empresa_id, alquiler_id, equipo_id, cantidad, tarifa_aplicada, dias_contratados,
            subtotal_linea, fecha_inicio, fecha_fin, devuelto, cantidad_devuelta, costo_dano,
            es_subcontratado
        ) VALUES (
            v_tenant_id, v_alquiler_id, v_equipo_id, v_cantidad, v_tarifa, v_dias,
            v_subtotal_linea,
            COALESCE((v_item->>'fecha_inicio')::DATE, CURRENT_DATE),
            COALESCE((v_item->>'fecha_fin')::DATE, CURRENT_DATE + v_dias),
            false, 0, 0,
            COALESCE((v_item->>'es_subcontratado')::BOOLEAN, false)
        );
    END LOOP;

    -- 4. Actualizar cabecera con casteo BIGINT defensivo
    UPDATE public.alquileres
    SET cliente_id = COALESCE(NULLIF(p_payload->>'cliente_id', '')::BIGINT, cliente_id),
        estado = v_nuevo_estado,
        subtotal_equipos = COALESCE((p_payload->>'subtotal_equipos')::NUMERIC, 0),
        flete_entrega = COALESCE((p_payload->>'flete_entrega')::NUMERIC, 0),
        flete_recogida = COALESCE((p_payload->>'flete_recogida')::NUMERIC, 0),
        subtotal_general = COALESCE((p_payload->>'subtotal_general')::NUMERIC, 0),
        total = COALESCE((p_payload->>'total')::NUMERIC, 0),
        deposito = COALESCE((p_payload->>'deposito')::NUMERIC, 0),
        saldo_pendiente = CASE 
            WHEN v_nuevo_estado = 'COTIZACION' THEN 0 
            ELSE GREATEST(0, COALESCE((p_payload->>'total')::NUMERIC, 0) - COALESCE((p_payload->>'deposito')::NUMERIC, 0) - COALESCE(total_pagado, 0))
        END,
        garantia_monto = COALESCE((p_payload->>'garantia_monto')::NUMERIC, garantia_monto),
        garantia_tipo = COALESCE(p_payload->>'garantia_tipo', garantia_tipo),
        observaciones = COALESCE(p_payload->>'observaciones', observaciones),
        detalles_logistica = COALESCE(p_payload->>'detalles_logistica', detalles_logistica),
        aplica_iva = COALESCE((p_payload->>'aplica_iva')::BOOLEAN, aplica_iva),
        valor_iva = COALESCE((p_payload->>'valor_iva')::NUMERIC, valor_iva),
        aplica_retefuente = COALESCE((p_payload->>'aplica_retefuente')::BOOLEAN, aplica_retefuente),
        valor_retefuente = COALESCE((p_payload->>'valor_retefuente')::NUMERIC, valor_retefuente),
        aplica_reteica = COALESCE((p_payload->>'aplica_reteica')::BOOLEAN, aplica_reteica),
        valor_reteica = COALESCE((p_payload->>'valor_reteica')::NUMERIC, valor_reteica),
        updated_at = NOW()
    WHERE id = v_alquiler_id;

    RETURN jsonb_build_object(
        'alquiler_id', v_alquiler_id,
        'success', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.editar_alquiler_transaccional_v1(JSONB) TO authenticated, service_role;
