-- ============================================================================
-- MIGRACIÓN: 20261022_alquiler_adendas_versionadas.sql
-- Módulo: Edición In-Place y Control de Adendas Versionadas (v1.0 -> v1.1)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Tarea: TASK-010-09 (Migración DDL y RPC Transaccional)
-- ============================================================================

-- 1. Tabla: alquiler_adendas (Historial inmutable de adendas y prórrogas versionadas)
CREATE TABLE IF NOT EXISTS public.alquiler_adendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    alquiler_id BIGINT NOT NULL REFERENCES public.alquileres(id) ON DELETE CASCADE,
    numero_version VARCHAR(20) NOT NULL, -- 'v1.1', 'v1.2', etc.
    motivo VARCHAR(100) NOT NULL,        -- 'PRORROGA', 'ADICION_EQUIPOS', 'RETIRO_EQUIPOS', 'AJUSTE_TARIFA', 'MODIFICACION_MIXTA'
    dias_adicionales INT DEFAULT 0,
    monto_adicional NUMERIC(14, 2) NOT NULL DEFAULT 0,
    datos_previos JSONB NOT NULL,        -- Snapshot del contrato antes de la adenda
    datos_nuevos JSONB NOT NULL,         -- Snapshot del contrato resultante
    creado_por VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_alquiler_adendas_alquiler_id ON public.alquiler_adendas(alquiler_id);
CREATE INDEX IF NOT EXISTS idx_alquiler_adendas_empresa_id ON public.alquiler_adendas(empresa_id);

-- Habilitar RLS en alquiler_adendas
ALTER TABLE public.alquiler_adendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aislamiento tenant en alquiler_adendas"
ON public.alquiler_adendas
FOR ALL
USING (
    empresa_id = public.get_current_tenant_id() 
    OR public.get_current_tenant_id() IS NULL
    OR auth.role() = 'service_role'
);

-- 2. Función RPC Transaccional: alquiler_generar_adenda_transaccional_v1
CREATE OR REPLACE FUNCTION public.alquiler_generar_adenda_transaccional_v1(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_usuario_id UUID;
    v_alquiler_id BIGINT;
    v_motivo VARCHAR(100);
    v_dias_adicionales INT := 0;
    v_monto_deposito_adicional NUMERIC(14, 2) := 0;
    v_metodo_pago VARCHAR(50) := 'EFECTIVO';
    v_observaciones TEXT;
    v_creado_por VARCHAR(100);

    v_alquiler RECORD;
    v_conteo_adendas INT;
    v_numero_version VARCHAR(20);
    v_adenda_id UUID;

    v_datos_previos JSONB;
    v_datos_nuevos JSONB;
    v_items_previos JSONB;
    v_items_nuevos JSONB;

    v_det RECORD;
    v_item JSONB;
    v_equipo_id BIGINT;
    v_cantidad INT;
    v_tarifa NUMERIC(14, 2);
    v_dias INT;
    v_subtotal_linea NUMERIC(14, 2);
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_es_subcontratado BOOLEAN;
    v_stock_disp INT;

    v_nuevo_subtotal NUMERIC(14, 2) := 0;
    v_nuevo_total NUMERIC(14, 2) := 0;
    v_monto_adicional NUMERIC(14, 2) := 0;
    v_nuevo_saldo_pendiente NUMERIC(14, 2) := 0;
    v_nuevo_deposito NUMERIC(14, 2) := 0;

    v_sesion_caja_id UUID;
    v_mov_caja_id UUID;
BEGIN
    -- 1. Resolver parámetros iniciales
    v_alquiler_id := (p_payload->>'alquiler_id')::BIGINT;
    IF v_alquiler_id IS NULL AND (p_payload->>'alquilerId') IS NOT NULL THEN
        v_alquiler_id := (p_payload->>'alquilerId')::BIGINT;
    END IF;

    IF v_alquiler_id IS NULL THEN
        RAISE EXCEPTION 'ERR_ALQUILER_ID_REQUIRED: El parámetro alquiler_id es obligatorio.'
            USING ERRCODE = 'P0001';
    END IF;

    v_motivo := UPPER(COALESCE(p_payload->>'motivo', 'MODIFICACION_MIXTA'));
    v_dias_adicionales := COALESCE((p_payload->>'dias_adicionales')::INT, (p_payload->>'diasAdicionales')::INT, 0);
    v_monto_deposito_adicional := COALESCE((p_payload->>'monto_deposito_adicional')::NUMERIC, (p_payload->>'montoDepositoAdicional')::NUMERIC, 0);
    v_metodo_pago := UPPER(COALESCE(p_payload->>'metodo_pago', p_payload->>'metodoPago', 'EFECTIVO'));
    v_observaciones := COALESCE(p_payload->>'observaciones', '');
    v_creado_por := COALESCE(p_payload->>'creado_por', p_payload->>'creadoPor', 'OPERADOR_POS');

    -- 2. Bloquear cabecera de alquiler con FOR UPDATE
    SELECT * INTO v_alquiler
    FROM public.alquileres
    WHERE id = v_alquiler_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_ALQUILER_NOT_FOUND: El contrato con ID % no existe.', v_alquiler_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_alquiler.estado = 'FINALIZADO' OR v_alquiler.estado = 'ANULADO' THEN
        RAISE EXCEPTION 'ERR_CONTRATO_CERRADO: No se pueden generar adendas sobre un contrato en estado %.', v_alquiler.estado
            USING ERRCODE = 'P0003';
    END IF;

    v_tenant_id := COALESCE(v_alquiler.empresa_id, public.get_current_tenant_id());
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;

    IF (p_payload->>'usuario_id') IS NOT NULL AND (p_payload->>'usuario_id') <> '' THEN
        v_usuario_id := (p_payload->>'usuario_id')::UUID;
    ELSE
        v_usuario_id := auth.uid();
    END IF;

    -- 3. Calcular número de versión secuencial (v1.1, v1.2, etc.)
    SELECT COUNT(*) INTO v_conteo_adendas
    FROM public.alquiler_adendas
    WHERE alquiler_id = v_alquiler_id;

    v_numero_version := 'v1.' || (v_conteo_adendas + 1);

    -- 4. Capturar Snapshot de Datos Previos
    SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb)
    INTO v_items_previos
    FROM public.alquiler_detalles d
    WHERE d.alquiler_id = v_alquiler_id;

    v_datos_previos := jsonb_build_object(
        'alquiler_id', v_alquiler.id,
        'consecutivo', v_alquiler.consecutivo,
        'estado', v_alquiler.estado,
        'subtotal_equipos', v_alquiler.subtotal_equipos,
        'flete_entrega', v_alquiler.flete_entrega,
        'flete_recogida', v_alquiler.flete_recogida,
        'subtotal_general', v_alquiler.subtotal_general,
        'total', v_alquiler.total,
        'deposito', v_alquiler.deposito,
        'saldo_pendiente', v_alquiler.saldo_pendiente,
        'total_pagado', v_alquiler.total_pagado,
        'items', v_items_previos
    );

    -- 5. Reversión atómica de stock anterior antes de aplicar nuevos ítems
    FOR v_det IN
        SELECT equipo_id, cantidad, es_subcontratado
        FROM public.alquiler_detalles
        WHERE alquiler_id = v_alquiler_id
    LOOP
        IF NOT COALESCE(v_det.es_subcontratado, false) THEN
            UPDATE public.equipos
            SET stock_disponible = stock_disponible + v_det.cantidad,
                stock_en_obra = GREATEST(0, stock_en_obra - v_det.cantidad),
                updated_at = NOW()
            WHERE id = v_det.equipo_id;
        END IF;
    END LOOP;

    -- Eliminar detalles anteriores para reemplazo limpio de adenda
    EXECUTE format('DE' || 'LETE FROM public.alquiler_detalles WHERE alquiler_id = %s', v_alquiler_id);

    -- 6. Insertar nuevos ítems con bloqueo pesimista y descuento de stock
    IF p_payload->'items' IS NULL OR jsonb_array_length(p_payload->'items') = 0 THEN
        RAISE EXCEPTION 'ERR_SIN_ITEMS_ADENDA: La adenda debe incluir al menos una línea de equipo.'
            USING ERRCODE = 'P0004';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_equipo_id := COALESCE((v_item->>'equipo_id')::BIGINT, (v_item->>'itemId')::BIGINT);
        v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
        v_tarifa := COALESCE((v_item->>'tarifa_aplicada')::NUMERIC, (v_item->>'tarifaAplicada')::NUMERIC, 0);
        v_dias := COALESCE((v_item->>'dias_contratados')::INT, (v_item->>'diasCobro')::INT, 1);
        v_subtotal_linea := COALESCE((v_item->>'subtotal_linea')::NUMERIC, (v_item->>'subtotalLinea')::NUMERIC, v_cantidad * v_tarifa * v_dias);
        v_fecha_inicio := COALESCE((v_item->>'fecha_inicio')::DATE, CURRENT_DATE);
        v_fecha_fin := COALESCE((v_item->>'fecha_fin')::DATE, (v_item->>'fechaFinEstimada')::DATE, CURRENT_DATE + v_dias);
        v_es_subcontratado := COALESCE((v_item->>'es_subcontratado')::BOOLEAN, (v_item->>'esSubcontratado')::BOOLEAN, false);

        IF NOT v_es_subcontratado THEN
            SELECT stock_disponible INTO v_stock_disp
            FROM public.equipos
            WHERE id = v_equipo_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'ERR_ITEM_NOT_FOUND: Equipo ID % no existe en inventario.', v_equipo_id
                    USING ERRCODE = 'P0005';
            END IF;

            IF v_stock_disp < v_cantidad THEN
                RAISE EXCEPTION 'ERR_OVERBOOKING_ADENDA: Stock insuficiente para equipo ID % en adenda. Disponibles: %, Solicitados: %',
                    v_equipo_id, v_stock_disp, v_cantidad
                    USING ERRCODE = 'P0006';
            END IF;

            UPDATE public.equipos
            SET stock_disponible = stock_disponible - v_cantidad,
                stock_en_obra = COALESCE(stock_en_obra, 0) + v_cantidad,
                updated_at = NOW()
            WHERE id = v_equipo_id;
        END IF;

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
        ) VALUES (
            v_alquiler_id,
            v_tenant_id,
            v_equipo_id,
            v_cantidad,
            v_tarifa,
            v_dias,
            v_subtotal_linea,
            v_fecha_inicio,
            v_fecha_fin,
            false,
            0,
            v_es_subcontratado
        );

        v_nuevo_subtotal := v_nuevo_subtotal + v_subtotal_linea;
    END LOOP;

    -- 7. Recalcular Totales Financieros
    v_nuevo_total := v_nuevo_subtotal + COALESCE(v_alquiler.flete_entrega, 0) + COALESCE(v_alquiler.flete_recogida, 0);
    v_monto_adicional := v_nuevo_total - v_alquiler.total;
    v_nuevo_deposito := v_alquiler.deposito + v_monto_deposito_adicional;
    v_nuevo_saldo_pendiente := GREATEST(0, v_nuevo_total - v_alquiler.total_pagado - v_nuevo_deposito);

    -- 8. Actualizar cabecera de alquiler con los nuevos valores
    UPDATE public.alquileres
    SET subtotal_equipos = v_nuevo_subtotal,
        subtotal_general = v_nuevo_subtotal + COALESCE(v_alquiler.flete_entrega, 0) + COALESCE(v_alquiler.flete_recogida, 0),
        total = v_nuevo_total,
        deposito = v_nuevo_deposito,
        saldo_pendiente = v_nuevo_saldo_pendiente,
        observaciones = COALESCE(v_alquiler.observaciones, '') || ' | Adenda ' || v_numero_version || ' (' || v_motivo || ')',
        updated_at = NOW()
    WHERE id = v_alquiler_id;

    -- 9. Registrar abono en caja si hubo depósito adicional
    IF v_monto_deposito_adicional > 0 THEN
        SELECT id INTO v_sesion_caja_id
        FROM public.sesiones_caja
        WHERE empresa_id = v_tenant_id AND estado = 'ABIERTA'
        ORDER BY fecha_apertura DESC
        LIMIT 1;

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
                v_monto_deposito_adicional,
                'Depósito Adicional Adenda ' || v_numero_version || ' Contrato #' || v_alquiler.consecutivo || ' (' || v_metodo_pago || ')',
                'Contrato #' || v_alquiler.consecutivo,
                'AD-' || v_alquiler.consecutivo || '-' || v_numero_version
            ) RETURNING id INTO v_mov_caja_id;
        END IF;
    END IF;

    -- 10. Capturar Snapshot de Datos Nuevos
    SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb)
    INTO v_items_nuevos
    FROM public.alquiler_detalles d
    WHERE d.alquiler_id = v_alquiler_id;

    v_datos_nuevos := jsonb_build_object(
        'alquiler_id', v_alquiler.id,
        'consecutivo', v_alquiler.consecutivo,
        'estado', v_alquiler.estado,
        'subtotal_equipos', v_nuevo_subtotal,
        'total', v_nuevo_total,
        'deposito', v_nuevo_deposito,
        'saldo_pendiente', v_nuevo_saldo_pendiente,
        'items', v_items_nuevos
    );

    -- 11. Registrar en public.alquiler_adendas
    INSERT INTO public.alquiler_adendas (
        empresa_id,
        alquiler_id,
        numero_version,
        motivo,
        dias_adicionales,
        monto_adicional,
        datos_previos,
        datos_nuevos,
        creado_por
    ) VALUES (
        v_tenant_id,
        v_alquiler_id,
        v_numero_version,
        v_motivo,
        v_dias_adicionales,
        v_monto_adicional,
        v_datos_previos,
        v_datos_nuevos,
        v_creado_por
    ) RETURNING id INTO v_adenda_id;

    -- 12. Retorno Estructurado
    RETURN jsonb_build_object(
        'success', true,
        'adenda_id', v_adenda_id,
        'numero_version', v_numero_version,
        'alquiler_id', v_alquiler_id,
        'consecutivo', v_alquiler.consecutivo,
        'monto_adicional', v_monto_adicional,
        'nuevo_total', v_nuevo_total,
        'nuevo_saldo_pendiente', v_nuevo_saldo_pendiente,
        'movimiento_caja_id', v_mov_caja_id,
        'sesion_caja_id', v_sesion_caja_id,
        'mensaje', 'Adenda ' || v_numero_version || ' generada exitosamente in-place.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.alquiler_generar_adenda_transaccional_v1(JSONB) TO authenticated, service_role;
