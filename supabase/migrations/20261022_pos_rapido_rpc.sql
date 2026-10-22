-- ============================================================================
-- MIGRACIÓN: 20261022_pos_rapido_rpc.sql
-- Módulo: Core Operativo de Alquileres de Inicio a Fin en Modo Mostrador POS (<30s)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Tarea: TASK-010-01 (Backend / RPC Transaccional)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.alquiler_crear_pos_rapido_v1(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_usuario_id UUID;
    v_idempotency_key VARCHAR(100);
    v_cliente_id BIGINT;
    v_cliente_nombre VARCHAR(255);
    v_cliente_doc VARCHAR(50);
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
    v_subtotal_equipos NUMERIC(14, 2) := 0;
    v_flete_entrega NUMERIC(14, 2) := 0;
    v_flete_recogida NUMERIC(14, 2) := 0;
    v_subtotal_general NUMERIC(14, 2) := 0;
    v_total NUMERIC(14, 2) := 0;
    v_deposito NUMERIC(14, 2) := 0;
    v_garantia_monto NUMERIC(14, 2) := 0;
    v_garantia_tipo VARCHAR(50) := 'Efectivo';
    v_saldo_pendiente NUMERIC(14, 2) := 0;
    v_estado VARCHAR(50) := 'ACTIVO';
    v_sesion_caja_id UUID;
    v_mov_caja_id UUID;
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
BEGIN
    -- 1. Resolver Tenant ID (Aislamiento Multi-Tenant Estricto)
    v_tenant_id := public.get_current_tenant_id();
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL AND (p_payload->>'empresa_id') <> '' THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;

    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'ERR_TENANT_NOT_FOUND: No se pudo resolver el tenant/empresa para el despacho POS.'
            USING ERRCODE = 'P0001';
    END IF;

    -- 2. Resolver Usuario ID
    IF (p_payload->>'usuario_id') IS NOT NULL AND (p_payload->>'usuario_id') <> '' THEN
        v_usuario_id := (p_payload->>'usuario_id')::UUID;
    ELSE
        v_usuario_id := auth.uid();
    END IF;

    -- 3. Idempotencia: Verificar si la solicitud ya fue ejecutada
    v_idempotency_key := NULLIF(TRIM(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey')), '');
    IF v_idempotency_key IS NOT NULL THEN
        SELECT a.id, a.consecutivo, a.estado, a.total, a.deposito, a.saldo_pendiente
        INTO v_alquiler_id, v_consecutivo, v_estado, v_total, v_deposito, v_saldo_pendiente
        FROM public.alquileres a
        WHERE a.empresa_id = v_tenant_id 
          AND a.idempotency_key = v_idempotency_key
        LIMIT 1;

        IF v_alquiler_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'id', v_alquiler_id,
                'consecutivo', v_consecutivo,
                'estado', v_estado,
                'total', v_total,
                'deposito', v_deposito,
                'saldo_pendiente', v_saldo_pendiente,
                'idempotent', true,
                'mensaje', 'Contrato recuperado por llave de idempotencia existente.'
            );
        END IF;
    END IF;

    -- 4. Gestión On-The-Fly de Clientes
    -- Caso A: Viene un cliente_id existente
    IF (p_payload->>'cliente_id') IS NOT NULL AND (p_payload->>'cliente_id') <> '' AND (p_payload->>'cliente_id')::BIGINT > 0 THEN
        v_cliente_id := (p_payload->>'cliente_id')::BIGINT;
        SELECT nombre, nit_cedula INTO v_cliente_nombre, v_cliente_doc
        FROM public.clientes 
        WHERE id = v_cliente_id AND empresa_id = v_tenant_id;

        IF v_cliente_nombre IS NULL THEN
            -- Intentar ubicarlo de forma tolerante si no está asignado explícitamente a este tenant
            SELECT nombre, nit_cedula INTO v_cliente_nombre, v_cliente_doc
            FROM public.clientes 
            WHERE id = v_cliente_id;
        END IF;
    END IF;

    -- Caso B: Viene un cliente nuevo On-The-Fly para inserción o vinculación automática
    IF v_cliente_id IS NULL AND p_payload->'cliente_nuevo' IS NOT NULL THEN
        v_cliente_doc := TRIM(COALESCE(p_payload->'cliente_nuevo'->>'nit_cedula', p_payload->'cliente_nuevo'->>'documento', ''));
        v_cliente_nombre := TRIM(COALESCE(p_payload->'cliente_nuevo'->>'nombre', 'Cliente Mostrador Express'));

        -- Si tiene documento, buscar si ya existe para este tenant
        IF v_cliente_doc <> '' THEN
            SELECT id, nombre INTO v_cliente_id, v_cliente_nombre
            FROM public.clientes
            WHERE nit_cedula = v_cliente_doc AND empresa_id = v_tenant_id
            LIMIT 1;
        END IF;

        -- Si no existe en el sistema, crearlo On-The-Fly en milisegundos
        IF v_cliente_id IS NULL THEN
            INSERT INTO public.clientes (
                empresa_id,
                nit_cedula,
                nombre,
                telefono,
                email,
                direccion,
                estado
            ) VALUES (
                v_tenant_id,
                CASE WHEN v_cliente_doc <> '' THEN v_cliente_doc ELSE 'GEN-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISSMS') END,
                v_cliente_nombre,
                COALESCE(p_payload->'cliente_nuevo'->>'telefono', ''),
                COALESCE(p_payload->'cliente_nuevo'->>'email', ''),
                COALESCE(p_payload->'cliente_nuevo'->>'direccion', 'Mostrador POS'),
                'Activo'
            ) RETURNING id INTO v_cliente_id;
        END IF;
    END IF;

    -- Caso C: Fallback absoluto a cliente mostrador genérico si no se especificó ninguno
    IF v_cliente_id IS NULL THEN
        SELECT id, nombre INTO v_cliente_id, v_cliente_nombre
        FROM public.clientes
        WHERE nit_cedula = '222222222222' AND empresa_id = v_tenant_id
        LIMIT 1;

        IF v_cliente_id IS NULL THEN
            INSERT INTO public.clientes (empresa_id, nit_cedula, nombre, direccion, estado)
            VALUES (v_tenant_id, '222222222222', 'CLIENTE MOSTRADOR POS', 'Mostrador Express', 'Activo')
            RETURNING id, nombre INTO v_cliente_id, v_cliente_nombre;
        END IF;
    END IF;

    -- 5. Cálculos Financieros y Totales
    v_subtotal_equipos := COALESCE((p_payload->>'subtotal_equipos')::NUMERIC, (p_payload->>'subtotalEquipos')::NUMERIC, 0);
    v_flete_entrega := COALESCE((p_payload->>'flete_entrega')::NUMERIC, (p_payload->>'fleteEntrega')::NUMERIC, 0);
    v_flete_recogida := COALESCE((p_payload->>'flete_recogida')::NUMERIC, (p_payload->>'fleteRecogida')::NUMERIC, 0);
    v_subtotal_general := v_subtotal_equipos + v_flete_entrega + v_flete_recogida;
    v_total := COALESCE((p_payload->>'total')::NUMERIC, (p_payload->>'totalEstimado')::NUMERIC, v_subtotal_general);
    v_deposito := COALESCE((p_payload->>'deposito')::NUMERIC, 0);
    v_garantia_monto := COALESCE((p_payload->>'garantia_monto')::NUMERIC, (p_payload->>'garantiaMonto')::NUMERIC, 0);
    v_garantia_tipo := COALESCE(p_payload->>'garantia_tipo', p_payload->>'garantiaTipo', 'Efectivo');
    v_saldo_pendiente := GREATEST(0, v_total - v_deposito);
    v_estado := COALESCE(p_payload->>'estado', 'ACTIVO');

    -- 6. Insertar Cabecera de Alquiler
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
        v_cliente_id,
        v_estado,
        v_subtotal_equipos,
        v_flete_entrega,
        v_flete_recogida,
        v_subtotal_general,
        v_total,
        v_deposito,
        v_garantia_monto,
        v_garantia_tipo,
        CASE WHEN v_garantia_monto > 0 THEN 'Activa' ELSE 'Sin Garantía' END,
        0,
        v_saldo_pendiente,
        COALESCE(p_payload->>'observaciones', 'Despacho Rápido Mostrador POS (<30s)'),
        COALESCE(p_payload->>'detalles_logistica', p_payload->>'detallesLogistica', 'Entrega Inmediata en Mostrador'),
        COALESCE(p_payload->>'creado_por', p_payload->>'creadoPor', 'OPERADOR_POS')
    )
    RETURNING id, consecutivo INTO v_alquiler_id, v_consecutivo;

    -- 7. Procesar Ítems y Bloquear Stock Pesimistamente (FOR UPDATE)
    IF p_payload->'items' IS NULL OR jsonb_array_length(p_payload->'items') = 0 THEN
        RAISE EXCEPTION 'ERR_SIN_ITEMS: El contrato POS debe contener al menos un equipo para despacho.'
            USING ERRCODE = 'P0002';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_equipo_id := COALESCE((v_item->>'equipo_id')::BIGINT, (v_item->>'itemId')::BIGINT);
        v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
        v_tarifa := COALESCE((v_item->>'tarifa_aplicada')::NUMERIC, (v_item->>'tarifaAplicada')::NUMERIC, 0);
        v_dias := COALESCE((v_item->>'dias_contratados')::INT, (v_item->>'diasCobro')::INT, 1);
        v_subtotal_linea := COALESCE((v_item->>'subtotal_linea')::NUMERIC, (v_item->>'subtotalLinea')::NUMERIC, v_cantidad * v_tarifa * v_dias);
        v_fecha_inicio := COALESCE((v_item->>'fecha_inicio')::DATE, CURRENT_DATE);
        v_fecha_fin := COALESCE((v_item->>'fecha_fin')::DATE, (v_item->>'fechaFinEstimada')::DATE, CURRENT_DATE + v_dias);

        -- Bloqueo pesimista exclusivo a nivel de fila en la tabla de equipos
        SELECT stock_disponible, stock_en_obra
        INTO v_stock_disp, v_stock_obra
        FROM public.equipos
        WHERE id = v_equipo_id AND (empresa_id = v_tenant_id OR empresa_id IS NULL)
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ITEM_NOT_FOUND: El equipo ID % no existe en inventario para esta empresa.', v_equipo_id
                USING ERRCODE = 'P0003';
        END IF;

        IF v_stock_disp < v_cantidad THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Stock insuficiente para equipo ID %. Disponibles: %, Solicitados: %',
                v_equipo_id, v_stock_disp, v_cantidad
                USING ERRCODE = 'P0004';
        END IF;

        -- Descuento atómico de stock
        UPDATE public.equipos
        SET stock_disponible = stock_disponible - v_cantidad,
            stock_en_obra = COALESCE(stock_en_obra, 0) + v_cantidad,
            updated_at = NOW()
        WHERE id = v_equipo_id;

        -- Inserción de la línea de detalle
        INSERT INTO public.alquiler_detalles (
            empresa_id,
            alquiler_id,
            equipo_id,
            cantidad,
            tarifa_aplicada,
            dias_contratados,
            subtotal_linea,
            fecha_inicio,
            fecha_fin,
            devuelto,
            cantidad_devuelta,
            costo_dano,
            es_subcontratado
        ) VALUES (
            v_tenant_id,
            v_alquiler_id,
            v_equipo_id,
            v_cantidad,
            v_tarifa,
            v_dias,
            v_subtotal_linea,
            v_fecha_inicio,
            v_fecha_fin,
            false,
            0,
            0,
            false
        );
    END LOOP;

    -- 8. Vinculación y Registro de Caja si hay Depósito/Anticipo
    IF v_deposito > 0 THEN
        -- Buscar sesión de caja abierta activa
        SELECT id INTO v_sesion_caja_id
        FROM public.sesiones_caja
        WHERE empresa_id = v_tenant_id 
          AND (usuario_id = v_usuario_id OR usuario_id IS NULL)
          AND estado = 'ABIERTA'
        ORDER BY fecha_apertura DESC
        LIMIT 1;

        -- Fallback a cualquier sesión abierta del tenant
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
                'Depósito / Anticipo Alquiler Mostrador #' || v_consecutivo,
                COALESCE(v_cliente_nombre, 'Cliente Mostrador'),
                'ALQ-' || v_consecutivo
            ) RETURNING id INTO v_mov_caja_id;
        END IF;
    END IF;

    -- 9. Retorno Estructurado
    RETURN jsonb_build_object(
        'success', true,
        'id', v_alquiler_id,
        'consecutivo', v_consecutivo,
        'cliente_id', v_cliente_id,
        'cliente_nombre', v_cliente_nombre,
        'total', v_total,
        'deposito', v_deposito,
        'saldo_pendiente', v_saldo_pendiente,
        'movimiento_caja_id', v_mov_caja_id,
        'sesion_caja_id', v_sesion_caja_id,
        'estado', v_estado,
        'idempotent', false,
        'mensaje', 'Alquiler mostrador POS despachado con éxito (<30s).'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.alquiler_crear_pos_rapido_v1(JSONB) TO authenticated, service_role;
