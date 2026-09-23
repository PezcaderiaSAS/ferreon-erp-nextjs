-- ============================================================================
-- ALQUILERES SYSTEM (FERREON ERP & WMS) - MIGRACIÓN DE RESILIENCIA WMS
-- ID: SPEC-2026-ARCH-RESTRUCT-001 / FASE 2: CAPA DE DATOS Y CONCURRENCIA
-- Propósito:
--   1. Restricción única estricta de idempotencia por empresa.
--   2. RPC alquiler_despachar_items_v1 con bloqueo pesimista (SELECT ... FOR UPDATE).
--   3. RPC alquiler_devolver_items_v1 con clasificación (bueno, dañado, extraviado).
--   4. RPC editar_alquiler_transaccional_v1 para reconciliación atómica de inventario.
-- ============================================================================

-- 1. Restricción de Idempotencia Atómica en Base de Datos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'alquileres' 
          AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE public.alquileres ADD COLUMN idempotency_key VARCHAR(100) NULL;
    END IF;
END $$;

DROP INDEX IF EXISTS idx_alquileres_empresa_idempotency_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_alquileres_empresa_idempotency_v2
ON public.alquileres (empresa_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

-- ----------------------------------------------------------------------------
-- 2. RPC: alquiler_despachar_items_v1
-- Despacho atómico de ítems de alquiler con bloqueo pesimista de stock propio
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.alquiler_despachar_items_v1(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_idempotency_key VARCHAR(100);
    v_alquiler_id BIGINT;
    v_consecutivo INT;
    v_item JSONB;
    v_equipo_id BIGINT;
    v_cantidad INT;
    v_tarifa NUMERIC(14, 2);
    v_dias INT;
    v_subtotal_linea NUMERIC(14, 2);
    v_stock_disp INT;
    v_stock_obra INT;
    v_es_subcontratado BOOLEAN;
    v_proveedor_sub_id UUID;
    v_costo_proveedor NUMERIC(14, 2);
    v_result JSONB;
BEGIN
    -- 1. Resolver Tenant ID
    v_tenant_id := public.get_current_tenant_id();
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;

    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

    -- 2. Idempotencia: Verificar si ya fue procesado
    v_idempotency_key := NULLIF(TRIM(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey')), '');
    IF v_idempotency_key IS NOT NULL THEN
        SELECT a.id, a.consecutivo, a.estado, a.total, a.deposito, a.created_at
        INTO v_alquiler_id, v_consecutivo
        FROM public.alquileres a
        WHERE a.empresa_id = v_tenant_id 
          AND a.idempotency_key = v_idempotency_key
        LIMIT 1;

        IF v_alquiler_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'id', v_alquiler_id,
                'consecutivo', v_consecutivo,
                'idempotent', true,
                'message', 'Contrato recuperado por llave de idempotencia existente.'
            );
        END IF;
    END IF;

    -- 3. Crear cabecera de alquiler
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
        creado_por
    ) VALUES (
        v_tenant_id,
        v_idempotency_key,
        COALESCE((p_payload->>'cliente_id')::BIGINT, (p_payload->>'clienteId')::BIGINT),
        COALESCE(p_payload->>'estado', 'ACTIVO'),
        COALESCE((p_payload->>'subtotal_equipos')::NUMERIC, (p_payload->>'subtotalEquipos')::NUMERIC, 0),
        COALESCE((p_payload->>'flete_entrega')::NUMERIC, (p_payload->>'fleteEntrega')::NUMERIC, 0),
        COALESCE((p_payload->>'flete_recogida')::NUMERIC, (p_payload->>'fleteRecogida')::NUMERIC, 0),
        COALESCE((p_payload->>'subtotal_general')::NUMERIC, (p_payload->>'subtotalGeneral')::NUMERIC, 0),
        COALESCE((p_payload->>'total')::NUMERIC, (p_payload->>'totalEstimado')::NUMERIC, 0),
        COALESCE((p_payload->>'deposito')::NUMERIC, 0),
        COALESCE((p_payload->>'garantia_monto')::NUMERIC, (p_payload->>'garantiaMonto')::NUMERIC, 0),
        COALESCE(p_payload->>'garantia_tipo', p_payload->>'garantiaTipo', 'Efectivo'),
        'Activa',
        0,
        GREATEST(0, COALESCE((p_payload->>'total')::NUMERIC, 0) - COALESCE((p_payload->>'deposito')::NUMERIC, 0)),
        p_payload->>'observaciones',
        COALESCE(p_payload->>'detalles_logistica', p_payload->>'detallesLogistica'),
        COALESCE(p_payload->>'creado_por', p_payload->>'creadoPor', 'SISTEMA')
    )
    RETURNING id, consecutivo INTO v_alquiler_id, v_consecutivo;

    -- 4. Procesar y Bloquear Ítems con SELECT ... FOR UPDATE
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_equipo_id := COALESCE((v_item->>'equipo_id')::BIGINT, (v_item->>'itemId')::BIGINT);
        v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
        v_tarifa := COALESCE((v_item->>'tarifa_aplicada')::NUMERIC, (v_item->>'tarifaAplicada')::NUMERIC, 0);
        v_dias := COALESCE((v_item->>'dias_contratados')::INT, (v_item->>'diasCobro')::INT, 1);
        v_subtotal_linea := COALESCE((v_item->>'subtotal_linea')::NUMERIC, (v_item->>'subtotalLinea')::NUMERIC, v_cantidad * v_tarifa * v_dias);
        v_es_subcontratado := COALESCE((v_item->>'es_subcontratado')::BOOLEAN, (v_item->>'esSubcontratado')::BOOLEAN, false);

        IF v_es_subcontratado THEN
            IF (v_item->>'proveedor_subcontratado_id') IS NOT NULL AND (v_item->>'proveedor_subcontratado_id') <> '' THEN
                v_proveedor_sub_id := (v_item->>'proveedor_subcontratado_id')::UUID;
            ELSE
                v_proveedor_sub_id := NULL;
            END IF;
            v_costo_proveedor := COALESCE((v_item->>'costo_diario_proveedor')::NUMERIC, 0);

            INSERT INTO public.alquiler_detalles (
                empresa_id, alquiler_id, equipo_id, cantidad, tarifa_aplicada, dias_contratados,
                subtotal_linea, fecha_inicio, fecha_fin, devuelto, cantidad_devuelta, costo_dano,
                es_subcontratado, proveedor_subcontratado_id, costo_diario_proveedor
            ) VALUES (
                v_tenant_id, v_alquiler_id, v_equipo_id, v_cantidad, v_tarifa, v_dias,
                v_subtotal_linea,
                COALESCE((v_item->>'fecha_inicio')::DATE, CURRENT_DATE),
                COALESCE((v_item->>'fecha_fin')::DATE, (v_item->>'fechaFinEstimada')::DATE, CURRENT_DATE + v_dias),
                false, 0, 0, true, v_proveedor_sub_id, v_costo_proveedor
            );
        ELSE
            -- PESSIMISTIC LOCK: Bloqueo exclusivo a nivel de fila
            SELECT stock_disponible, stock_en_obra 
            INTO v_stock_disp, v_stock_obra
            FROM public.equipos
            WHERE id = v_equipo_id AND empresa_id = v_tenant_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'ITEM_NOT_FOUND: El equipo ID % no existe en inventario.', v_equipo_id;
            END IF;

            IF v_stock_disp < v_cantidad THEN
                RAISE EXCEPTION 'INSUFFICIENT_STOCK: Stock insuficiente para equipo ID %. Disponibles: %, Solicitados: %',
                    v_equipo_id, v_stock_disp, v_cantidad;
            END IF;

            -- Descuento atómico de stock
            UPDATE public.equipos
            SET stock_disponible = stock_disponible - v_cantidad,
                stock_en_obra = COALESCE(stock_en_obra, 0) + v_cantidad,
                updated_at = NOW()
            WHERE id = v_equipo_id AND empresa_id = v_tenant_id;

            INSERT INTO public.alquiler_detalles (
                empresa_id, alquiler_id, equipo_id, cantidad, tarifa_aplicada, dias_contratados,
                subtotal_linea, fecha_inicio, fecha_fin, devuelto, cantidad_devuelta, costo_dano,
                es_subcontratado
            ) VALUES (
                v_tenant_id, v_alquiler_id, v_equipo_id, v_cantidad, v_tarifa, v_dias,
                v_subtotal_linea,
                COALESCE((v_item->>'fecha_inicio')::DATE, CURRENT_DATE),
                COALESCE((v_item->>'fecha_fin')::DATE, (v_item->>'fechaFinEstimada')::DATE, CURRENT_DATE + v_dias),
                false, 0, 0, false
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'id', v_alquiler_id,
        'consecutivo', v_consecutivo,
        'empresa_id', v_tenant_id,
        'estado', 'ACTIVO',
        'success', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.alquiler_despachar_items_v1(JSONB) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. RPC: alquiler_devolver_items_v1
-- Devolución atómica y reingreso a bodega (bueno, dañado, extraviado)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.alquiler_devolver_items_v1(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_alquiler_id BIGINT;
    v_item JSONB;
    v_detalle_id BIGINT;
    v_cant_devuelta INT;
    v_costo_dano NUMERIC(14, 2);
    v_detalle RECORD;
    v_pendientes_count INT;
BEGIN
    v_tenant_id := public.get_current_tenant_id();
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;

    v_alquiler_id := (p_payload->>'alquiler_id')::BIGINT;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'devoluciones') LOOP
        v_detalle_id := (v_item->>'detalle_id')::BIGINT;
        v_cant_devuelta := COALESCE((v_item->>'cantidad_devuelta')::INT, 0);
        v_costo_dano := COALESCE((v_item->>'costo_dano')::NUMERIC, 0);

        -- Bloquear fila del detalle
        SELECT * INTO v_detalle
        FROM public.alquiler_detalles
        WHERE id = v_detalle_id AND alquiler_id = v_alquiler_id
        FOR UPDATE;

        IF FOUND THEN
            -- Reincorporar stock propio a bodega con bloqueo pesimista
            IF NOT COALESCE(v_detalle.es_subcontratado, false) THEN
                UPDATE public.equipos
                SET stock_disponible = stock_disponible + v_cant_devuelta,
                    stock_en_obra = GREATEST(0, stock_en_obra - v_cant_devuelta),
                    updated_at = NOW()
                WHERE id = v_detalle.equipo_id;
            END IF;

            -- Actualizar detalle
            UPDATE public.alquiler_detalles
            SET cantidad_devuelta = COALESCE(cantidad_devuelta, 0) + v_cant_devuelta,
                costo_dano = COALESCE(costo_dano, 0) + v_costo_dano,
                devuelto = (COALESCE(cantidad_devuelta, 0) + v_cant_devuelta >= cantidad),
                updated_at = NOW()
            WHERE id = v_detalle_id;
        END IF;
    END LOOP;

    -- Verificar si todos los detalles han sido devueltos para liquidar el contrato
    SELECT COUNT(*) INTO v_pendientes_count
    FROM public.alquiler_detalles
    WHERE alquiler_id = v_alquiler_id AND devuelto = false;

    IF v_pendientes_count = 0 THEN
        UPDATE public.alquileres
        SET estado = 'FINALIZADO',
            updated_at = NOW()
        WHERE id = v_alquiler_id;
    END IF;

    RETURN jsonb_build_object(
        'alquiler_id', v_alquiler_id,
        'estado', CASE WHEN v_pendientes_count = 0 THEN 'FINALIZADO' ELSE 'ACTIVO' END,
        'success', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.alquiler_devolver_items_v1(JSONB) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. RPC: editar_alquiler_transaccional_v1
-- Reconciliación atómica total de inventario en una sola transacción PostgreSQL
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.editar_alquiler_transaccional_v1(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_alquiler_id BIGINT;
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

    -- 1. Bloquear cabecera
    PERFORM 1 FROM public.alquileres WHERE id = v_alquiler_id FOR UPDATE;

    -- 2. Revertir atómicamente el stock de los detalles previos propios
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

    -- Eliminar detalles anteriores
    DELETE FROM public.alquiler_detalles WHERE alquiler_id = v_alquiler_id;

    -- 3. Insertar nuevos detalles y descontar nuevo stock con FOR UPDATE
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_equipo_id := (v_item->>'equipo_id')::BIGINT;
        v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
        v_tarifa := COALESCE((v_item->>'tarifa_aplicada')::NUMERIC, 0);
        v_dias := COALESCE((v_item->>'dias_contratados')::INT, 1);
        v_subtotal_linea := COALESCE((v_item->>'subtotal_linea')::NUMERIC, v_cantidad * v_tarifa * v_dias);

        IF NOT COALESCE((v_item->>'es_subcontratado')::BOOLEAN, false) THEN
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

    -- 4. Actualizar cabecera
    UPDATE public.alquileres
    SET subtotal_equipos = COALESCE((p_payload->>'subtotal_equipos')::NUMERIC, 0),
        flete_entrega = COALESCE((p_payload->>'flete_entrega')::NUMERIC, 0),
        flete_recogida = COALESCE((p_payload->>'flete_recogida')::NUMERIC, 0),
        subtotal_general = COALESCE((p_payload->>'subtotal_general')::NUMERIC, 0),
        total = COALESCE((p_payload->>'total')::NUMERIC, 0),
        deposito = COALESCE((p_payload->>'deposito')::NUMERIC, 0),
        saldo_pendiente = GREATEST(0, COALESCE((p_payload->>'total')::NUMERIC, 0) - COALESCE((p_payload->>'deposito')::NUMERIC, 0)),
        observaciones = p_payload->>'observaciones',
        detalles_logistica = p_payload->>'detalles_logistica',
        updated_at = NOW()
    WHERE id = v_alquiler_id;

    RETURN jsonb_build_object(
        'alquiler_id', v_alquiler_id,
        'success', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.editar_alquiler_transaccional_v1(JSONB) TO authenticated, service_role;
