-- ==============================================================================
-- MIGRACIÓN: Corrección de Orden de Inserción e Integridad FK en Devoluciones
-- Archivo: supabase/migrations/20261005130000_fix_devolucion_avanzada_fk_and_kardex.sql
-- Descripción: 
--   1. Reestructura public.procesar_devolucion_avanzada(p_payload JSONB) para
--      insertar la cabecera en public.devoluciones ANTES de public.devolucion_detalles.
--   2. Pre-calcula en memoria los subtotales de alquiler, daños y reposiciones.
--   3. Registra automáticamente el movimiento 'DEVOLUCION_ENTRADA' en kardex_inventario.
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.procesar_devolucion_avanzada(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_alquiler_id BIGINT;
    v_empresa_id UUID;
    v_idempotency_key TEXT;
    v_recibido_por VARCHAR(100);
    v_observaciones TEXT;
    v_sesion_caja_id UUID;
    v_metodo_pago VARCHAR(50);
    v_existente_dev RECORD;
    v_consecutivo VARCHAR(50);
    v_devolucion_id UUID;
    
    v_item JSONB;
    v_detalle_id BIGINT;
    v_equipo_id BIGINT;
    v_cant_devuelta INT;
    v_estado_inspeccion VARCHAR(30);
    v_costo_reparacion NUMERIC(15,2);
    v_valor_reposicion NUMERIC(15,2);
    v_descripcion_dano TEXT;
    
    v_orig_cantidad INT;
    v_orig_devuelta INT;
    v_orig_tarifa NUMERIC(15,2);
    v_orig_fecha_inicio TIMESTAMPTZ;
    v_orig_fecha_fin TIMESTAMPTZ;
    v_orig_dias INT;
    v_orig_es_subcontratado BOOLEAN;
    v_orig_subcontratacion_id UUID;
    
    v_dias_causados INT;
    v_subtotal_alquiler_item NUMERIC(15,2);
    v_total_alquiler_liquidado NUMERIC(15,2) := 0;
    v_total_danos NUMERIC(15,2) := 0;
    v_total_reposiciones NUMERIC(15,2) := 0;
    v_deposito_aplicado NUMERIC(15,2) := 0;
    v_saldo_neto NUMERIC(15,2) := 0;
    v_tipo_resolucion VARCHAR(30) := 'SIN_SALDO';
    
    v_nuevo_detalle_id BIGINT;
    v_pendientes INT;
    v_stock_disp_actual INT;
    v_result JSONB;
BEGIN
    v_alquiler_id := (p_payload->>'alquiler_id')::BIGINT;
    v_idempotency_key := NULLIF(TRIM(p_payload->>'idempotency_key'), '');
    v_recibido_por := COALESCE(p_payload->>'recibido_por', 'OPERADOR');
    v_observaciones := p_payload->>'observaciones';
    v_sesion_caja_id := NULLIF(p_payload->>'sesion_caja_id', '')::UUID;
    v_metodo_pago := COALESCE(p_payload->>'metodo_pago', 'EFECTIVO');

    -- Bloqueo pesimista del contrato de alquiler
    SELECT empresa_id, COALESCE(deposito, 0)
    INTO v_empresa_id, v_deposito_aplicado
    FROM public.alquileres
    WHERE id = v_alquiler_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contrato de alquiler ID % no encontrado.', v_alquiler_id;
    END IF;

    -- 1. CONTROL DE IDEMPOTENCIA
    IF v_idempotency_key IS NOT NULL THEN
        SELECT id, consecutivo, saldo_neto, tipo_resolucion 
        INTO v_existente_dev
        FROM public.devoluciones
        WHERE empresa_id = v_empresa_id AND idempotency_key = v_idempotency_key
        LIMIT 1;

        IF FOUND THEN
            RETURN json_build_object(
                'success', TRUE,
                'idempotent', TRUE,
                'devolucion_id', v_existente_dev.id,
                'consecutivo', v_existente_dev.consecutivo,
                'saldo_neto', v_existente_dev.saldo_neto,
                'tipo_resolucion', v_existente_dev.tipo_resolucion,
                'message', 'Devolución previamente procesada (Idempotencia).'
            )::JSONB;
        END IF;
    END IF;

    -- 2. GENERAR IDENTIFICADORES Y CONSECUTIVO OFICIAL (DEV-XXXX)
    v_consecutivo := 'DEV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    v_devolucion_id := gen_random_uuid();

    -- 3. FASE 1: PRE-CÁLCULO CONSOLIDADO EN MEMORIA
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
    LOOP
        v_detalle_id := (v_item->>'detalle_id')::BIGINT;
        v_cant_devuelta := (v_item->>'cantidad_devuelta')::INT;
        v_costo_reparacion := COALESCE((v_item->>'costo_reparacion')::NUMERIC, 0);
        v_valor_reposicion := COALESCE((v_item->>'valor_reposicion')::NUMERIC, 0);

        IF v_cant_devuelta <= 0 THEN
            CONTINUE;
        END IF;

        SELECT tarifa_aplicada, fecha_inicio
        INTO v_orig_tarifa, v_orig_fecha_inicio
        FROM public.alquiler_detalles
        WHERE id = v_detalle_id AND alquiler_id = v_alquiler_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Línea de alquiler detalle ID % no encontrada para el contrato %.', v_detalle_id, v_alquiler_id;
        END IF;

        v_dias_causados := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (NOW() - v_orig_fecha_inicio)) / 86400)::INT);
        v_subtotal_alquiler_item := v_dias_causados * v_orig_tarifa * v_cant_devuelta;
        
        v_total_alquiler_liquidado := v_total_alquiler_liquidado + v_subtotal_alquiler_item;
        v_total_danos := v_total_danos + v_costo_reparacion;
        v_total_reposiciones := v_total_reposiciones + v_valor_reposicion;
    END LOOP;

    -- LIQUIDACIÓN DE GARANTÍA Y RESOLUCIÓN FINANCIERA
    v_saldo_neto := v_deposito_aplicado - (v_total_alquiler_liquidado + v_total_danos + v_total_reposiciones);

    IF v_saldo_neto > 0 THEN
        v_tipo_resolucion := 'REEMBOLSO_CLIENTE';
    ELSIF v_saldo_neto < 0 THEN
        v_tipo_resolucion := 'COBRO_CLIENTE';
    ELSE
        v_tipo_resolucion := 'SIN_SALDO';
    END IF;

    -- 4. INSERTAR CABECERA PADRE PRIMERO (Garantiza que la FK de los detalles sea válida)
    INSERT INTO public.devoluciones (
        id, empresa_id, consecutivo, alquiler_id, fecha_devolucion,
        total_dias_causados, total_alquiler_liquidado, total_danos, total_reposiciones,
        deposito_aplicado, saldo_neto, tipo_resolucion, metodo_pago,
        sesion_caja_id, idempotency_key, recibido_por, observaciones
    ) VALUES (
        v_devolucion_id, v_empresa_id, v_consecutivo, v_alquiler_id, NOW(),
        0, v_total_alquiler_liquidado, v_total_danos, v_total_reposiciones,
        v_deposito_aplicado, v_saldo_neto, v_tipo_resolucion, v_metodo_pago,
        v_sesion_caja_id, v_idempotency_key, v_recibido_por, v_observaciones
    );

    -- 5. FASE 2: PROCESAMIENTO DE ÍTEMS, SPLIT-LINE, DETALLES E INVENTARIO
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
    LOOP
        v_detalle_id := (v_item->>'detalle_id')::BIGINT;
        v_cant_devuelta := (v_item->>'cantidad_devuelta')::INT;
        v_estado_inspeccion := COALESCE(v_item->>'estado_inspeccion', 'BUENO');
        v_costo_reparacion := COALESCE((v_item->>'costo_reparacion')::NUMERIC, 0);
        v_valor_reposicion := COALESCE((v_item->>'valor_reposicion')::NUMERIC, 0);
        v_descripcion_dano := v_item->>'descripcion_dano';

        IF v_cant_devuelta <= 0 THEN
            CONTINUE;
        END IF;

        SELECT equipo_id, cantidad, cantidad_devuelta, tarifa_aplicada, fecha_inicio, fecha_fin, dias_contratados,
               es_subcontratado, subcontratacion_id
        INTO v_equipo_id, v_orig_cantidad, v_orig_devuelta, v_orig_tarifa, v_orig_fecha_inicio, v_orig_fecha_fin, v_orig_dias,
             v_orig_es_subcontratado, v_orig_subcontratacion_id
        FROM public.alquiler_detalles
        WHERE id = v_detalle_id AND alquiler_id = v_alquiler_id;

        v_dias_causados := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (NOW() - v_orig_fecha_inicio)) / 86400)::INT);
        v_subtotal_alquiler_item := v_dias_causados * v_orig_tarifa * v_cant_devuelta;

        -- SPLIT-LINE
        IF v_cant_devuelta < (v_orig_cantidad - v_orig_devuelta) THEN
            INSERT INTO public.alquiler_detalles (
                alquiler_id, empresa_id, equipo_id, cantidad, tarifa_aplicada, dias_contratados,
                subtotal_linea, costo_dano, devuelto, cantidad_devuelta, fecha_inicio, fecha_fin,
                fecha_devolucion_real, estado_inspeccion, costo_reparacion, valor_reposicion, descripcion_dano,
                es_item_clonado_split, item_origen_id, es_subcontratado, subcontratacion_id
            ) VALUES (
                v_alquiler_id, v_empresa_id, v_equipo_id, v_cant_devuelta, v_orig_tarifa, v_dias_causados,
                v_subtotal_alquiler_item, (v_costo_reparacion + v_valor_reposicion), TRUE, v_cant_devuelta,
                v_orig_fecha_inicio, NOW(), NOW(), v_estado_inspeccion, v_costo_reparacion, v_valor_reposicion,
                v_descripcion_dano, TRUE, v_detalle_id, v_orig_es_subcontratado, v_orig_subcontratacion_id
            ) RETURNING id INTO v_nuevo_detalle_id;

            UPDATE public.alquiler_detalles
            SET cantidad = cantidad - v_cant_devuelta,
                subtotal_linea = dias_contratados * tarifa_aplicada * (cantidad - v_cant_devuelta)
            WHERE id = v_detalle_id;

        ELSE
            v_nuevo_detalle_id := v_detalle_id;
            UPDATE public.alquiler_detalles
            SET cantidad_devuelta = cantidad,
                devuelto = TRUE,
                costo_dano = costo_dano + v_costo_reparacion + v_valor_reposicion,
                costo_reparacion = v_costo_reparacion,
                valor_reposicion = v_valor_reposicion,
                descripcion_dano = v_descripcion_dano,
                estado_inspeccion = v_estado_inspeccion,
                fecha_devolucion_real = NOW()
            WHERE id = v_detalle_id;
        END IF;

        -- INSERTAR DETALLE DE DEVOLUCIÓN (Hijo con referencia válida a la cabecera)
        INSERT INTO public.devolucion_detalles (
            devolucion_id, alquiler_detalle_id, equipo_id, cantidad_devuelta,
            estado_inspeccion, costo_reparacion, valor_reposicion, descripcion_dano,
            dias_efectivos_cobrados, tarifa_diaria_aplicada, subtotal_alquiler
        ) VALUES (
            v_devolucion_id, v_nuevo_detalle_id, v_equipo_id, v_cant_devuelta,
            v_estado_inspeccion, v_costo_reparacion, v_valor_reposicion, v_descripcion_dano,
            v_dias_causados, v_orig_tarifa, v_subtotal_alquiler_item
        );

        -- ACTUALIZACIÓN Y CLASIFICACIÓN DE STOCK EN EQUIPOS
        UPDATE public.equipos
        SET stock_en_obra = GREATEST(0, stock_en_obra - v_cant_devuelta),
            stock_disponible = CASE 
                WHEN v_estado_inspeccion = 'BUENO' THEN stock_disponible + v_cant_devuelta 
                ELSE stock_disponible 
            END,
            stock_mantenimiento = CASE 
                WHEN v_estado_inspeccion = 'MANTENIMIENTO' THEN stock_mantenimiento + v_cant_devuelta 
                ELSE stock_mantenimiento 
            END,
            stock_perdido = CASE 
                WHEN v_estado_inspeccion = 'PERDIDA_TOTAL' THEN stock_perdido + v_cant_devuelta 
                ELSE stock_perdido 
            END,
            stock_total = CASE 
                WHEN v_estado_inspeccion = 'PERDIDA_TOTAL' THEN GREATEST(0, stock_total - v_cant_devuelta) 
                ELSE stock_total 
            END,
            updated_at = NOW()
        WHERE id = v_equipo_id
        RETURNING stock_disponible INTO v_stock_disp_actual;

        -- REGISTRO INMUTABLE EN KARDEX_INVENTARIO
        INSERT INTO public.kardex_inventario (
            equipo_id,
            empresa_id,
            tipo_movimiento,
            cantidad_delta,
            stock_resultante,
            motivo,
            referencia_documento,
            usuario_id,
            creado_en
        ) VALUES (
            v_equipo_id,
            v_empresa_id,
            'DEVOLUCION_ENTRADA',
            CASE WHEN v_estado_inspeccion = 'BUENO' THEN v_cant_devuelta ELSE 0 END,
            COALESCE(v_stock_disp_actual, 0),
            'Retorno de alquiler [' || v_consecutivo || '] - Estado: ' || v_estado_inspeccion || COALESCE(' - ' || v_descripcion_dano, ''),
            v_consecutivo,
            COALESCE(v_recibido_por, 'OPERADOR'),
            NOW()
        );

        -- ACTUALIZACIÓN DE SUBCONTRATACIÓN SI APLICA
        IF v_orig_es_subcontratado AND v_orig_subcontratacion_id IS NOT NULL THEN
            UPDATE public.subcontrataciones
            SET estado = 'RECIBIDA_EN_BODEGA',
                fecha_recepcion_real = COALESCE(fecha_recepcion_real, NOW()),
                observaciones = COALESCE(observaciones, '') || E'\n[Retorno]: En bodega de FerreOn. Pendiente devolver al proveedor.',
                updated_at = NOW()
            WHERE id = v_orig_subcontratacion_id;
        END IF;
    END LOOP;

    -- 6. VERIFICAR FIN DE CONTRATO (CIERRE SI NO QUEDAN LÍNEAS PENDIENTES)
    SELECT COUNT(*) INTO v_pendientes
    FROM public.alquiler_detalles
    WHERE alquiler_id = v_alquiler_id AND devuelto = FALSE;

    IF v_pendientes = 0 THEN
        UPDATE public.alquileres
        SET estado = 'FINALIZADO',
            saldo_pendiente = CASE WHEN v_saldo_neto < 0 THEN ABS(v_saldo_neto) ELSE 0 END,
            updated_at = NOW()
        WHERE id = v_alquiler_id;
    END IF;

    SELECT json_build_object(
        'success', TRUE,
        'idempotent', FALSE,
        'devolucion_id', v_devolucion_id,
        'consecutivo', v_consecutivo,
        'alquiler_id', v_alquiler_id,
        'total_alquiler_liquidado', v_total_alquiler_liquidado,
        'total_danos', v_total_danos,
        'total_reposiciones', v_total_reposiciones,
        'deposito_aplicado', v_deposito_aplicado,
        'saldo_neto', v_saldo_neto,
        'tipo_resolucion', v_tipo_resolucion,
        'finalizado', (v_pendientes = 0)
    )::JSONB INTO v_result;

    RETURN v_result;
END;
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
