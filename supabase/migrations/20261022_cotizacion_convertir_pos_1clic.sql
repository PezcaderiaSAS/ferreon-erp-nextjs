-- ============================================================================
-- MIGRACIÓN: 20261022_cotizacion_convertir_pos_1clic.sql
-- Módulo: Core Operativo de Alquileres de Inicio a Fin en Modo Mostrador POS (<30s)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Tarea: TASK-010-05 (Backend / RPC Transaccional Conversión 1-Clic)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cotizacion_convertir_pos_1clic(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cotizacion_id UUID;
    v_idempotency_key VARCHAR(100);
    v_tenant_id UUID;
    v_usuario_id UUID;
    v_detalles_logistica TEXT;
    v_nueva_fecha_inicio DATE;
    v_metodo_pago VARCHAR(50);
    v_monto_deposito_override NUMERIC(14, 2);

    v_cotizacion RECORD;
    v_cliente_nombre VARCHAR(255);
    v_alquiler_id BIGINT;
    v_consecutivo INT;

    v_equipos_ids BIGINT[];
    v_det RECORD;
    v_stock_disp INT;
    v_stock_tot INT;

    v_flete NUMERIC(14, 2) := 0;
    v_subtotal NUMERIC(14, 2) := 0;
    v_total NUMERIC(14, 2) := 0;
    v_deposito NUMERIC(14, 2) := 0;
    v_saldo_pendiente NUMERIC(14, 2) := 0;
    v_fecha_inicio DATE;
    v_fecha_fin DATE;

    v_sesion_caja_id UUID;
    v_mov_caja_id UUID;
BEGIN
    -- 1. Extraer identificador de cotización y parámetros
    v_cotizacion_id := (p_payload->>'cotizacion_id')::UUID;
    IF v_cotizacion_id IS NULL AND (p_payload->>'cotizacionId') IS NOT NULL THEN
        v_cotizacion_id := (p_payload->>'cotizacionId')::UUID;
    END IF;

    IF v_cotizacion_id IS NULL THEN
        RAISE EXCEPTION 'ERR_COTIZACION_ID_REQUIRED: El parámetro cotizacion_id es obligatorio.'
            USING ERRCODE = 'P0001';
    END IF;

    v_idempotency_key := NULLIF(TRIM(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey')), '');
    v_detalles_logistica := COALESCE(p_payload->>'detalles_logistica', p_payload->>'detallesLogistica', '');
    v_metodo_pago := UPPER(COALESCE(p_payload->>'metodo_pago', p_payload->>'metodoPago', 'EFECTIVO'));

    IF (p_payload->>'monto_deposito') IS NOT NULL AND (p_payload->>'monto_deposito') <> '' THEN
        v_monto_deposito_override := (p_payload->>'monto_deposito')::NUMERIC;
    ELSIF (p_payload->>'montoDeposito') IS NOT NULL AND (p_payload->>'montoDeposito') <> '' THEN
        v_monto_deposito_override := (p_payload->>'montoDeposito')::NUMERIC;
    ELSE
        v_monto_deposito_override := NULL;
    END IF;

    IF p_payload->>'nueva_fecha_inicio' IS NOT NULL AND (p_payload->>'nueva_fecha_inicio') <> '' THEN
        v_nueva_fecha_inicio := (p_payload->>'nueva_fecha_inicio')::DATE;
    ELSIF p_payload->>'nuevaFechaInicio' IS NOT NULL AND (p_payload->>'nuevaFechaInicio') <> '' THEN
        v_nueva_fecha_inicio := (p_payload->>'nuevaFechaInicio')::DATE;
    ELSE
        v_nueva_fecha_inicio := NULL;
    END IF;

    -- 2. Resolver Usuario y Tenant ID
    IF (p_payload->>'usuario_id') IS NOT NULL AND (p_payload->>'usuario_id') <> '' THEN
        v_usuario_id := (p_payload->>'usuario_id')::UUID;
    ELSE
        v_usuario_id := auth.uid();
    END IF;

    -- 3. Validar existencia de la cotización
    SELECT * INTO v_cotizacion
    FROM public.cotizaciones
    WHERE id = v_cotizacion_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_COTIZACION_NOT_FOUND: Cotización no encontrada con ID: %', v_cotizacion_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Resolver tenant de forma estricta
    v_tenant_id := COALESCE(v_cotizacion.empresa_id, v_cotizacion.tenant_id);
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

    -- 4. Idempotencia: ¿Ya fue convertida?
    IF v_cotizacion.estado = 'CONVERTIDA' AND v_cotizacion.alquiler_id IS NOT NULL THEN
        SELECT a.id, a.consecutivo, a.total, a.deposito, a.saldo_pendiente
        INTO v_alquiler_id, v_consecutivo, v_total, v_deposito, v_saldo_pendiente
        FROM public.alquileres a
        WHERE a.id = v_cotizacion.alquiler_id;

        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'alquiler_id', v_alquiler_id,
            'consecutivo', v_consecutivo,
            'cotizacion_consecutivo', v_cotizacion.consecutivo,
            'total', v_total,
            'deposito', v_deposito,
            'saldo_pendiente', v_saldo_pendiente,
            'mensaje', 'La cotización ya había sido convertida previamente a este contrato.'
        );
    END IF;

    -- Idempotencia por clave única
    IF v_idempotency_key IS NOT NULL THEN
        SELECT a.id, a.consecutivo, a.total, a.deposito, a.saldo_pendiente
        INTO v_alquiler_id, v_consecutivo, v_total, v_deposito, v_saldo_pendiente
        FROM public.alquileres a
        WHERE a.empresa_id = v_tenant_id AND a.idempotency_key = v_idempotency_key
        LIMIT 1;

        IF v_alquiler_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'alquiler_id', v_alquiler_id,
                'consecutivo', v_consecutivo,
                'cotizacion_consecutivo', v_cotizacion.consecutivo,
                'total', v_total,
                'deposito', v_deposito,
                'saldo_pendiente', v_saldo_pendiente,
                'mensaje', 'Operación idempotente: Contrato ya formalizado.'
            );
        END IF;
    END IF;

    -- 5. Obtener nombre del cliente para comprobantes
    SELECT nombre INTO v_cliente_nombre
    FROM public.clientes
    WHERE id = v_cotizacion.cliente_id;
    IF v_cliente_nombre IS NULL THEN
        v_cliente_nombre := COALESCE(v_cotizacion.cliente_nombre, 'Cliente Mostrador');
    END IF;

    -- 6. Recolectar equipos y aplicar bloqueo pesimista ordenado anti-deadlock
    SELECT array_agg(DISTINCT cd.equipo_id ORDER BY cd.equipo_id ASC)
    INTO v_equipos_ids
    FROM public.cotizaciones_detalles cd
    WHERE cd.cotizacion_id = v_cotizacion_id;

    IF v_equipos_ids IS NOT NULL AND array_length(v_equipos_ids, 1) > 0 THEN
        PERFORM id, stock_disponible, stock_en_obra
        FROM public.equipos
        WHERE id = ANY(v_equipos_ids)
        ORDER BY id ASC
        FOR UPDATE;

        -- Validar stock físico disponible para cada ítem cotizado
        FOR v_det IN
            SELECT cd.equipo_id, SUM(cd.cantidad) AS cantidad_requerida, e.nombre, e.stock_disponible, e.stock_total
            FROM public.cotizaciones_detalles cd
            JOIN public.equipos e ON e.id = cd.equipo_id
            WHERE cd.cotizacion_id = v_cotizacion_id
            GROUP BY cd.equipo_id, e.nombre, e.stock_disponible, e.stock_total
        LOOP
            IF v_det.stock_disponible < v_det.cantidad_requerida THEN
                RAISE EXCEPTION 'ERR_OVERBOOKING_CONCURRENTE: Stock insuficiente para equipo "%" (ID: %). Disponibles: %, Solicitados: %',
                    v_det.nombre, v_det.equipo_id, v_det.stock_disponible, v_det.cantidad_requerida
                    USING ERRCODE = 'P0004';
            END IF;
        END LOOP;

        -- Descontar stock disponible e incrementar stock en obra
        FOR v_det IN
            SELECT cd.equipo_id, SUM(cd.cantidad) AS cantidad_requerida
            FROM public.cotizaciones_detalles cd
            WHERE cd.cotizacion_id = v_cotizacion_id
            GROUP BY cd.equipo_id
        LOOP
            UPDATE public.equipos
            SET stock_disponible = GREATEST(0, stock_disponible - v_det.cantidad_requerida),
                stock_en_obra = COALESCE(stock_en_obra, 0) + v_det.cantidad_requerida,
                updated_at = NOW()
            WHERE id = v_det.equipo_id;
        END LOOP;
    END IF;

    -- 7. Cálculos Financieros
    v_subtotal := COALESCE(v_cotizacion.subtotal, 0);
    v_flete := COALESCE(v_cotizacion.valor_transporte, 0);
    v_total := COALESCE(v_cotizacion.total, (v_subtotal + v_flete));

    IF v_monto_deposito_override IS NOT NULL THEN
        v_deposito := GREATEST(0, v_monto_deposito_override);
    ELSE
        v_deposito := COALESCE(v_cotizacion.deposito_garantia, 0);
    END IF;

    v_saldo_pendiente := GREATEST(0, v_total - v_deposito);
    v_fecha_inicio := COALESCE(v_nueva_fecha_inicio, v_cotizacion.fecha_emision, CURRENT_DATE);

    -- 8. Insertar Contrato en public.alquileres
    INSERT INTO public.alquileres (
        empresa_id,
        idempotency_key,
        cliente_id,
        estado,
        subtotal_equipos,
        flete_entrega,
        flete_recogida,
        subtotal_general,
        total,
        deposito,
        garantia_monto,
        garantia_tipo,
        garantia_estado,
        total_pagado,
        saldo_pendiente,
        observaciones,
        detalles_logistica,
        creado_por,
        created_at,
        updated_at
    ) VALUES (
        v_tenant_id,
        v_idempotency_key,
        v_cotizacion.cliente_id,
        'ACTIVO',
        v_subtotal,
        v_flete / 2.0,
        v_flete / 2.0,
        v_subtotal + v_flete,
        v_total,
        v_deposito,
        v_deposito,
        v_metodo_pago,
        CASE WHEN v_deposito > 0 THEN 'Activa' ELSE 'Sin Garantía' END,
        0,
        v_saldo_pendiente,
        COALESCE(v_cotizacion.observaciones, '') || ' | Convertido 1-Clic desde Cotización #' || v_cotizacion.consecutivo,
        CASE WHEN v_detalles_logistica <> '' THEN v_detalles_logistica ELSE COALESCE(v_cotizacion.obra_direccion, 'Entrega Mostrador POS') END,
        COALESCE(p_payload->>'creado_por', p_payload->>'creadoPor', 'OPERADOR_POS'),
        NOW(),
        NOW()
    )
    RETURNING id, consecutivo INTO v_alquiler_id, v_consecutivo;

    -- 9. Copiar Ítems de Cotización a public.alquiler_detalles
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

    -- 10. Actualizar Cotización a 'CONVERTIDA'
    UPDATE public.cotizaciones
    SET estado = 'CONVERTIDA',
        alquiler_id = v_alquiler_id,
        updated_at = NOW()
    WHERE id = v_cotizacion_id;

    -- 11. Registro Atómico en Caja si hay Depósito/Anticipo
    IF v_deposito > 0 THEN
        -- Buscar sesión de caja abierta
        SELECT id INTO v_sesion_caja_id
        FROM public.sesiones_caja
        WHERE empresa_id = v_tenant_id
          AND (usuario_id = v_usuario_id OR usuario_id IS NULL)
          AND estado = 'ABIERTA'
        ORDER BY fecha_apertura DESC
        LIMIT 1;

        IF v_sesion_caja_id IS NULL THEN
            SELECT id INTO v_sesion_caja_id
            FROM public.sesiones_caja
            WHERE empresa_id = v_tenant_id
              AND estado = 'ABIERTA'
            ORDER BY fecha_apertura DESC
            LIMIT 1;
        END IF;

        IF v_sesion_caja_id IS NOT NULL THEN
            INSERT INTO public.movimientos_caja (
                tenant_id,
                empresa_id,
                sesion_caja_id,
                usuario_id,
                tipo,
                monto,
                concepto,
                beneficiario,
                comprobante
            ) VALUES (
                v_tenant_id,
                v_tenant_id,
                v_sesion_caja_id,
                COALESCE(v_usuario_id, '00000000-0000-0000-0000-000000000000'::UUID),
                'INGRESO',
                v_deposito,
                'Depósito Formalización Cotización #' || v_cotizacion.consecutivo || ' -> Contrato #' || v_consecutivo || ' (' || v_metodo_pago || ')',
                v_cliente_nombre,
                'ALQ-' || v_consecutivo
            ) RETURNING id INTO v_mov_caja_id;
        END IF;
    END IF;

    -- 12. Retorno Estructurado
    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'alquiler_id', v_alquiler_id,
        'consecutivo', v_consecutivo,
        'cotizacion_consecutivo', v_cotizacion.consecutivo,
        'cliente_nombre', v_cliente_nombre,
        'total', v_total,
        'deposito', v_deposito,
        'saldo_pendiente', v_saldo_pendiente,
        'movimiento_caja_id', v_mov_caja_id,
        'sesion_caja_id', v_sesion_caja_id,
        'mensaje', 'Cotización convertida exitosamente a contrato POS con cobro de depósito en caja.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cotizacion_convertir_pos_1clic(JSONB) TO authenticated, service_role;
