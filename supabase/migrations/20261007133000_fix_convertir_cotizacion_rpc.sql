-- Migración: Corrección del procedimiento transaccional de conversión de cotizaciones a contratos
-- Corrige el error por columnas inexistentes 'fecha_inicio' y 'fecha_fin_estimada' en public.alquileres
-- y mapea correctamente tarifa_diaria y dias desde public.cotizaciones_detalles

CREATE OR REPLACE FUNCTION public.convertir_cotizacion_a_alquiler_transaccional(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_cotizacion_id UUID;
    v_idempotency_key TEXT;
    v_usuario_id UUID;
    v_detalles_logistica TEXT;
    v_nueva_fecha_inicio DATE;
    
    v_cotizacion RECORD;
    v_tenant_id UUID;
    v_alquiler_id BIGINT;
    v_consecutivo INT;
    
    v_det RECORD;
    v_equipos_ids BIGINT[];
    v_hoy DATE := CURRENT_DATE;
    v_flete NUMERIC(15, 2);
    v_deposito NUMERIC(15, 2);
    v_total NUMERIC(15, 2);
    v_saldo_pend NUMERIC(15, 2);
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_dia_pico DATE;
    v_max_ocupado INT;
BEGIN
    v_cotizacion_id := (p_payload->>'cotizacion_id')::UUID;
    v_idempotency_key := NULLIF(TRIM(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey')), '');
    v_detalles_logistica := COALESCE(p_payload->>'detalles_logistica', p_payload->>'detallesLogistica', '');
    
    IF p_payload->>'nueva_fecha_inicio' IS NOT NULL AND (p_payload->>'nueva_fecha_inicio') <> '' THEN
        v_nueva_fecha_inicio := (p_payload->>'nueva_fecha_inicio')::DATE;
    ELSE
        v_nueva_fecha_inicio := NULL;
    END IF;

    IF p_payload->>'usuario_id' IS NOT NULL AND p_payload->>'usuario_id' != '' THEN
        v_usuario_id := (p_payload->>'usuario_id')::UUID;
    ELSE
        v_usuario_id := auth.uid();
    END IF;

    -- A. Verificar existencia y estado de la cotización
    SELECT * INTO v_cotizacion 
    FROM public.cotizaciones 
    WHERE id = v_cotizacion_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_COTIZACION_NOT_FOUND: Cotización no encontrada con ID: %', v_cotizacion_id USING ERRCODE = 'P0002';
    END IF;

    IF v_cotizacion.estado = 'CONVERTIDA' THEN
        SELECT a.id, a.consecutivo INTO v_alquiler_id, v_consecutivo
        FROM public.alquileres a
        WHERE a.id = v_cotizacion.alquiler_id;

        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'alquiler_id', v_alquiler_id,
            'consecutivo', v_consecutivo,
            'cotizacion_consecutivo', v_cotizacion.consecutivo,
            'mensaje', 'La cotización ya había sido convertida previamente'
        );
    END IF;

    -- B. Verificar Idempotencia por idempotency_key
    IF v_idempotency_key IS NOT NULL THEN
        SELECT a.id, a.consecutivo INTO v_alquiler_id, v_consecutivo
        FROM public.alquileres a
        WHERE a.idempotency_key = v_idempotency_key
        LIMIT 1;

        IF v_alquiler_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'alquiler_id', v_alquiler_id,
                'consecutivo', v_consecutivo,
                'cotizacion_consecutivo', v_cotizacion.consecutivo,
                'mensaje', 'Operación idempotente: Contrato ya formalizado'
            );
        END IF;
    END IF;

    v_tenant_id := COALESCE(v_cotizacion.empresa_id, v_cotizacion.tenant_id);
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

    -- C. Recolectar IDs de equipos involucrados propios
    SELECT array_agg(DISTINCT cd.equipo_id) INTO v_equipos_ids
    FROM public.cotizaciones_detalles cd
    WHERE cd.cotizacion_id = v_cotizacion_id;

    IF v_equipos_ids IS NOT NULL AND array_length(v_equipos_ids, 1) > 0 THEN
        -- D. BLOQUEO PESIMISTA ORDENADO ANTI-DEADLOCK:
        PERFORM id, stock_total, stock_disponible
        FROM public.equipos
        WHERE id = ANY(v_equipos_ids)
        ORDER BY id ASC
        FOR UPDATE;

        -- E. Validar Existencias Dinámicas por Fechas
        FOR v_det IN 
            SELECT cd.*, e.nombre, e.stock_total, e.stock_disponible 
            FROM public.cotizaciones_detalles cd
            JOIN public.equipos e ON e.id = cd.equipo_id
            WHERE cd.cotizacion_id = v_cotizacion_id
        LOOP
            v_fecha_inicio := COALESCE(v_nueva_fecha_inicio, v_cotizacion.fecha_emision, CURRENT_DATE);
            v_fecha_fin := v_fecha_inicio + GREATEST(1, COALESCE(v_det.dias, 1));

            WITH dias_solicitados AS (
                SELECT generate_series(v_fecha_inicio, v_fecha_fin, '1 day'::interval)::date AS dia
            ),
            ocupacion_externa AS (
                SELECT 
                    ds.dia,
                    COALESCE(SUM(ad.cantidad - ad.cantidad_devuelta), 0) AS ocupado_externo
                FROM dias_solicitados ds
                LEFT JOIN public.alquiler_detalles ad 
                    ON ad.equipo_id = v_det.equipo_id
                   AND ad.devuelto = FALSE
                   AND ad.fecha_inicio <= ds.dia
                   AND COALESCE(ad.fecha_fin, ds.dia) >= ds.dia
                   AND COALESCE(ad.es_subcontratado, false) = false
                LEFT JOIN public.alquileres a
                    ON a.id = ad.alquiler_id
                   AND a.estado IN ('ACTIVO', 'ACTIVO_EN_OBRA', 'PENDIENTE_ENTREGA')
                GROUP BY ds.dia
            )
            SELECT 
                oe.dia,
                (oe.ocupado_externo + v_det.cantidad) AS total_demanda
            INTO v_dia_pico, v_max_ocupado
            FROM ocupacion_externa oe
            ORDER BY (oe.ocupado_externo + v_det.cantidad) DESC
            LIMIT 1;

            IF v_max_ocupado > v_det.stock_total THEN
                RAISE EXCEPTION 'ERR_OVERBOOKING_CONCURRENTE: Stock insuficiente para equipo "%" (ID: %) en la fecha pico %. Stock Total: %, Demanda Comprometida: %, Déficit: % unidades.',
                    v_det.nombre, v_det.equipo_id, v_dia_pico, v_det.stock_total, v_max_ocupado, (v_max_ocupado - v_det.stock_total)
                    USING ERRCODE = 'P0004';
            END IF;
        END LOOP;

        -- F. Descontar Stock de Bodega e Incrementar Stock en Obra
        FOR v_det IN 
            SELECT cd.equipo_id, SUM(cd.cantidad) AS cant_total
            FROM public.cotizaciones_detalles cd
            WHERE cd.cotizacion_id = v_cotizacion_id
            GROUP BY cd.equipo_id
        LOOP
            UPDATE public.equipos
            SET stock_disponible = GREATEST(0, stock_disponible - v_det.cant_total),
                stock_en_obra = COALESCE(stock_en_obra, 0) + v_det.cant_total,
                updated_at = NOW()
            WHERE id = v_det.equipo_id;
        END LOOP;
    END IF;

    -- G. Calcular Valores Financieros
    v_flete := COALESCE(v_cotizacion.valor_transporte, 0);
    v_deposito := COALESCE(v_cotizacion.deposito_garantia, 0);
    v_total := COALESCE(v_cotizacion.total, 0);
    v_saldo_pend := GREATEST(0, v_total - v_deposito);
    v_fecha_inicio := COALESCE(v_nueva_fecha_inicio, v_cotizacion.fecha_emision, CURRENT_DATE);

    -- H. Insertar en public.alquileres (Sin columnas fecha_inicio / fecha_fin_estimada inexistentes)
    INSERT INTO public.alquileres (
        cliente_id,
        empresa_id,
        estado,
        subtotal_equipos,
        flete_entrega,
        flete_recogida,
        subtotal_general,
        total,
        deposito,
        saldo_pendiente,
        total_pagado,
        idempotency_key,
        observaciones,
        detalles_logistica,
        created_at,
        updated_at
    ) VALUES (
        v_cotizacion.cliente_id,
        v_tenant_id,
        'ACTIVO',
        COALESCE(v_cotizacion.subtotal, 0),
        v_flete / 2.0,
        v_flete / 2.0,
        COALESCE(v_cotizacion.subtotal, 0) + v_flete,
        v_total,
        v_deposito,
        v_saldo_pend,
        0,
        v_idempotency_key,
        COALESCE(v_cotizacion.observaciones, '') || ' | Convertido desde Cotización #' || v_cotizacion.consecutivo,
        CASE WHEN v_detalles_logistica <> '' THEN v_detalles_logistica ELSE COALESCE(v_cotizacion.obra_direccion, '') END,
        NOW(),
        NOW()
    )
    RETURNING id, consecutivo INTO v_alquiler_id, v_consecutivo;

    -- I. Copiar Detalles a public.alquiler_detalles usando tarifa_diaria y dias de cotizaciones_detalles
    INSERT INTO public.alquiler_detalles (
        alquiler_id,
        empresa_id,
        equipo_id,
        cantidad,
        tarifa_aplicada,
        dias_contratados,
        subtotal_linea,
        fecha_inicio,
        fecha_fin,
        devuelto,
        cantidad_devuelta,
        es_subcontratado
    )
    SELECT 
        v_alquiler_id,
        v_tenant_id,
        cd.equipo_id,
        cd.cantidad,
        COALESCE(cd.tarifa_diaria, 0),
        GREATEST(1, COALESCE(cd.dias, 1)),
        COALESCE(cd.subtotal, 0),
        v_fecha_inicio,
        v_fecha_inicio + GREATEST(1, COALESCE(cd.dias, 1)),
        FALSE,
        0,
        FALSE
    FROM public.cotizaciones_detalles cd
    WHERE cd.cotizacion_id = v_cotizacion_id;

    -- J. Actualizar estado de la cotización
    UPDATE public.cotizaciones
    SET estado = 'CONVERTIDA',
        alquiler_id = v_alquiler_id,
        updated_at = NOW()
    WHERE id = v_cotizacion_id;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'alquiler_id', v_alquiler_id,
        'consecutivo', v_consecutivo,
        'cotizacion_consecutivo', v_cotizacion.consecutivo,
        'total', v_total,
        'saldo_pendiente', v_saldo_pend,
        'mensaje', 'Cotización convertida a contrato exitosamente'
    );
END;
$function$;
