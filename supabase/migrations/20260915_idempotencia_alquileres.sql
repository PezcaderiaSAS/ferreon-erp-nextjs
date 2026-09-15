-- Migración: Soporte de Idempotencia de Extremo a Extremo en Alquileres
-- Fecha: 2026-09-15
-- Propósito: Prevenir registros duplicados o triples generados por clics múltiples, reintentos de red o retrasos en la UI.

-- 1. Añadir columna idempotency_key a la tabla alquileres si no existe
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

-- 2. Crear índice único por empresa e idempotency_key para garantizar atomicidad e idempotencia
CREATE UNIQUE INDEX IF NOT EXISTS idx_alquileres_empresa_idempotency_key 
ON public.alquileres (empresa_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 3. Actualizar procedimiento almacenado crear_alquiler_transaccional con deduplicación e idempotencia
CREATE OR REPLACE FUNCTION public.crear_alquiler_transaccional(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_sub_status VARCHAR(50);
    v_trial_ends TIMESTAMPTZ;
    v_idempotency_key VARCHAR(100);
    v_alquiler_id BIGINT;
    v_consecutivo INT;
    v_item JSONB;
    v_equipo_id BIGINT;
    v_cantidad INT;
    v_tarifa NUMERIC(12, 2);
    v_dias INT;
    v_subtotal_linea NUMERIC(12, 2);
    v_stock_disp INT;
    v_stock_obra INT;
    v_es_subcontratado BOOLEAN;
    v_proveedor_sub_id UUID;
    v_costo_proveedor NUMERIC(12, 2);
    v_result JSONB;
BEGIN
    -- 1. Resolver Tenant ID activo
    v_tenant_id := public.get_current_tenant_id();
    
    -- Si se ejecuta vía service_role o payload específico, permitir fallback
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;

    IF v_tenant_id IS NULL THEN
        -- Fallback al tenant principal
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

    -- 2. Comprobar Idempotencia: Si ya existe un contrato procesado con esta clave, retornar de inmediato
    v_idempotency_key := NULLIF(TRIM(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey')), '');
    
    IF v_idempotency_key IS NOT NULL THEN
        SELECT a.id, a.consecutivo, a.estado, a.total, a.deposito, a.created_at
        INTO v_alquiler_id, v_consecutivo
        FROM public.alquileres a
        WHERE a.empresa_id = v_tenant_id 
          AND a.idempotency_key = v_idempotency_key
        LIMIT 1;

        IF v_alquiler_id IS NOT NULL THEN
            SELECT jsonb_build_object(
                'id', a.id,
                'consecutivo', a.consecutivo,
                'estado', a.estado,
                'total', a.total,
                'deposito', a.deposito,
                'created_at', a.created_at,
                'idempotent', true
            )
            INTO v_result
            FROM public.alquileres a
            WHERE a.id = v_alquiler_id;

            RETURN v_result;
        END IF;
    END IF;

    -- 3. Validar Estado de Suscripción (Grace Period Enforcement)
    SELECT subscription_status, trial_ends_at 
    INTO v_sub_status, v_trial_ends
    FROM public.empresas 
    WHERE id = v_tenant_id;

    IF v_sub_status = 'trialing' AND v_trial_ends < NOW() THEN
        RAISE EXCEPTION 'El periodo de prueba de 14 días ha finalizado. Por favor regularice su suscripción para registrar nuevos alquileres.';
    END IF;

    IF v_sub_status IN ('canceled', 'unpaid', 'past_due') THEN
        RAISE EXCEPTION 'La suscripción de la empresa se encuentra inactiva (%) o en mora. Por favor actualice su método de pago.', v_sub_status;
    END IF;

    -- 4. Insertar Cabecera de Alquiler vinculada al Tenant con Idempotency Key
    BEGIN
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
            COALESCE((p_payload->>'subtotal_general')::NUMERIC, (p_payload->>'subtotalGeneral')::NUMERIC, (p_payload->>'total')::NUMERIC, 0),
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
    EXCEPTION WHEN unique_violation THEN
        -- Si ocurrió una carrera concurrente y ya se insertó con esta misma clave
        IF v_idempotency_key IS NOT NULL THEN
            SELECT a.id, a.consecutivo, a.estado, a.total, a.deposito, a.created_at
            INTO v_alquiler_id, v_consecutivo
            FROM public.alquileres a
            WHERE a.empresa_id = v_tenant_id 
              AND a.idempotency_key = v_idempotency_key
            LIMIT 1;

            IF v_alquiler_id IS NOT NULL THEN
                SELECT jsonb_build_object(
                    'id', a.id,
                    'consecutivo', a.consecutivo,
                    'estado', a.estado,
                    'total', a.total,
                    'deposito', a.deposito,
                    'created_at', a.created_at,
                    'idempotent', true
                )
                INTO v_result
                FROM public.alquileres a
                WHERE a.id = v_alquiler_id;

                RETURN v_result;
            END IF;
        END IF;
        RAISE;
    END;

    -- 5. Procesar Ítems
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_equipo_id := COALESCE((v_item->>'equipo_id')::BIGINT, (v_item->>'itemId')::BIGINT);
        v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
        v_tarifa := COALESCE((v_item->>'tarifa_aplicada')::NUMERIC, (v_item->>'tarifaAplicada')::NUMERIC, 0);
        v_dias := COALESCE((v_item->>'dias_contratados')::INT, (v_item->>'diasCobro')::INT, 1);
        v_subtotal_linea := COALESCE((v_item->>'subtotal_linea')::NUMERIC, (v_item->>'subtotalLinea')::NUMERIC, v_cantidad * v_tarifa * v_dias);
        
        -- Detección de Subcontratación
        v_es_subcontratado := COALESCE(
            (v_item->>'es_subcontratado')::BOOLEAN, 
            (v_item->>'esSubcontratado')::BOOLEAN, 
            false
        );
        
        IF (v_item->>'proveedor_subcontratado_id') IS NOT NULL AND (v_item->>'proveedor_subcontratado_id') != '' THEN
            v_proveedor_sub_id := (v_item->>'proveedor_subcontratado_id')::UUID;
        ELSIF (v_item->>'proveedorSubcontratadoId') IS NOT NULL AND (v_item->>'proveedorSubcontratadoId') != '' THEN
            v_proveedor_sub_id := (v_item->>'proveedorSubcontratadoId')::UUID;
        ELSE
            v_proveedor_sub_id := NULL;
        END IF;

        v_costo_proveedor := COALESCE(
            (v_item->>'costo_diario_proveedor')::NUMERIC, 
            (v_item->>'costoDiarioProveedor')::NUMERIC, 
            0
        );

        IF v_es_subcontratado THEN
            -- Ítem de Tercero / Subcontratado:
            -- NO descuenta stock físico propio de bodega
            -- Registra con los metadatos de subcontratación
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
                es_subcontratado,
                proveedor_subcontratado_id,
                costo_diario_proveedor
            ) VALUES (
                v_tenant_id,
                v_alquiler_id,
                v_equipo_id,
                v_cantidad,
                v_tarifa,
                v_dias,
                v_subtotal_linea,
                COALESCE((v_item->>'fecha_inicio')::DATE, CURRENT_DATE),
                COALESCE((v_item->>'fecha_fin')::DATE, (v_item->>'fechaFinEstimada')::DATE, CURRENT_DATE + v_dias),
                false,
                0,
                0,
                true,
                v_proveedor_sub_id,
                v_costo_proveedor
            );
        ELSE
            -- Ítem Propio:
            -- 1. Bloqueo Pesimista FOR UPDATE y Validación de Stock Propio
            SELECT stock_disponible, stock_en_obra 
            INTO v_stock_disp, v_stock_obra
            FROM public.equipos
            WHERE id = v_equipo_id 
              AND empresa_id = v_tenant_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Equipo con ID % no encontrado en el inventario propio de la empresa', v_equipo_id;
            END IF;

            IF v_stock_disp < v_cantidad THEN
                RAISE EXCEPTION 'Stock insuficiente para el equipo ID %. Disponibles: %, Solicitados: %', 
                    v_equipo_id, v_stock_disp, v_cantidad;
            END IF;

            -- 2. Descontar Stock Propio
            UPDATE public.equipos
            SET stock_disponible = stock_disponible - v_cantidad,
                stock_en_obra = stock_en_obra + v_cantidad,
                updated_at = NOW()
            WHERE id = v_equipo_id 
              AND empresa_id = v_tenant_id;

            -- 3. Insertar Detalle de Alquiler Propio
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
                COALESCE((v_item->>'fecha_inicio')::DATE, CURRENT_DATE),
                COALESCE((v_item->>'fecha_fin')::DATE, (v_item->>'fechaFinEstimada')::DATE, CURRENT_DATE + v_dias),
                false,
                0,
                0,
                false
            );
        END IF;
    END LOOP;

    -- 6. Construir Retorno con Datos Creados
    SELECT jsonb_build_object(
        'id', a.id,
        'consecutivo', a.consecutivo,
        'estado', a.estado,
        'total', a.total,
        'deposito', a.deposito,
        'created_at', a.created_at,
        'idempotent', false
    )
    INTO v_result
    FROM public.alquileres a
    WHERE a.id = v_alquiler_id;

    RETURN v_result;
END;
$$;
