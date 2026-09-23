-- ============================================================================
-- ALQUILERES SYSTEM (FERREON ERP & WMS) - MIGRACIÓN DE DATOS
-- ID: SPEC-2026-WMS-CONCURRENT-RENTALS-001 / TAREA-01
-- Propósito:
--   1. Añadir columnas linea_numero, tarifa_personalizada y subtotal_personalizado.
--   2. Ejecutar backfill histórico de linea_numero ordenado por ID.
--   3. Crear índices compuestos para acelerar búsquedas de concurrencia temporal.
-- ============================================================================

-- 1. Incorporación defensiva de columnas a la tabla alquiler_detalles
DO $$
BEGIN
    -- Columna linea_numero
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'alquiler_detalles' 
          AND column_name = 'linea_numero'
    ) THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN linea_numero INT DEFAULT 1 NOT NULL;
    END IF;

    -- Columna tarifa_personalizada
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'alquiler_detalles' 
          AND column_name = 'tarifa_personalizada'
    ) THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN tarifa_personalizada BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;

    -- Columna subtotal_personalizado
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'alquiler_detalles' 
          AND column_name = 'subtotal_personalizado'
    ) THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN subtotal_personalizado BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
END $$;

-- 2. Backfill histórico de linea_numero para contratos existentes
WITH numeradas AS (
    SELECT 
        id, 
        ROW_NUMBER() OVER (PARTITION BY alquiler_id ORDER BY id ASC) as rn
    FROM public.alquiler_detalles
)
UPDATE public.alquiler_detalles ad
SET linea_numero = numeradas.rn
FROM numeradas
WHERE ad.id = numeradas.id;

-- 3. Índices compuestos para acelerar cálculo de concurrencia temporal y ordenamiento
CREATE INDEX IF NOT EXISTS idx_alquiler_detalles_concurrencia 
ON public.alquiler_detalles (equipo_id, fecha_inicio, fecha_fin) 
WHERE devuelto = FALSE;

CREATE INDEX IF NOT EXISTS idx_alquiler_detalles_alquiler_linea
ON public.alquiler_detalles (alquiler_id, linea_numero);

-- 4. Comentarios de auditoría y documentación en el diccionario de datos
COMMENT ON COLUMN public.alquiler_detalles.linea_numero IS 'Número secuencial de la línea dentro del contrato de alquiler para ordenamiento determinista.';
COMMENT ON COLUMN public.alquiler_detalles.tarifa_personalizada IS 'Indica si la tarifa diaria fue ingresada o editada manualmente por el operador.';
COMMENT ON COLUMN public.alquiler_detalles.subtotal_personalizado IS 'Indica si el subtotal de la línea fue acordado o editado manualmente como valor cerrado.';

-- ============================================================================
-- 5. RPC: alquiler_despachar_segmentado_concurrente_v1
-- Despacho transaccional de contratos con líneas segmentadas y concurrencia WMS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.alquiler_despachar_segmentado_concurrente_v1(p_payload JSONB)
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
    v_estado VARCHAR(50);
    
    -- Variables de procesamiento de ítems
    v_item JSONB;
    v_equipo_id BIGINT;
    v_linea_numero INT := 0;
    v_cantidad INT;
    v_tarifa NUMERIC(14, 2);
    v_dias INT;
    v_subtotal_linea NUMERIC(14, 2);
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_tarifa_personalizada BOOLEAN;
    v_subtotal_personalizado BOOLEAN;
    v_es_subcontratado BOOLEAN;
    v_proveedor_sub_id UUID;
    v_costo_proveedor NUMERIC(14, 2);

    -- Variables de control de concurrencia e inventario
    v_stock_total INT;
    v_stock_disp INT;
    v_dia_pico DATE;
    v_max_ocupado INT;
    v_advertencia_overbooking JSONB := '[]'::JSONB;
BEGIN
    -- 1. Resolver Tenant ID de la empresa activa
    v_tenant_id := public.get_current_tenant_id();
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;

    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'ERR_TENANT_NOT_FOUND: No se pudo resolver la empresa activa en el contexto de ejecución.'
            USING ERRCODE = 'P0001';
    END IF;

    -- 2. Idempotencia: Retornar resultado existente si la llave ya fue procesada
    v_idempotency_key := NULLIF(TRIM(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey')), '');
    IF v_idempotency_key IS NOT NULL THEN
        SELECT a.id, a.consecutivo, a.estado
        INTO v_alquiler_id, v_consecutivo, v_estado
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
                'idempotent', true,
                'message', 'Contrato recuperado por llave de idempotencia existente.'
            );
        END IF;
    END IF;

    v_estado := COALESCE(p_payload->>'estado', 'ACTIVO');

    -- 3. BLOQUEO PESIMISTA ORDENADO Y VALIDACIÓN DE CAPACIDAD TEMPORAL
    -- ORDER BY 1 para evitar Deadlocks ante llamadas simultáneas cruzadas
    FOR v_equipo_id IN 
        SELECT DISTINCT COALESCE((elem->>'equipo_id')::BIGINT, (elem->>'itemId')::BIGINT)
        FROM jsonb_array_elements(p_payload->'items') elem
        WHERE COALESCE((elem->>'es_subcontratado')::BOOLEAN, (elem->>'esSubcontratado')::BOOLEAN, false) = false
        ORDER BY 1
    LOOP
        SELECT stock_total, stock_disponible 
        INTO v_stock_total, v_stock_disp
        FROM public.equipos
        WHERE id = v_equipo_id AND empresa_id = v_tenant_id
        FOR UPDATE; -- PESSIMISTIC LOCK

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR_ITEM_NOT_FOUND: El equipo con ID % no existe en inventario.', v_equipo_id
                USING ERRCODE = 'P0002';
        END IF;

        -- Evaluar cada línea solicitada para este equipo
        FOR v_item IN 
            SELECT * FROM jsonb_array_elements(p_payload->'items')
            WHERE COALESCE((value->>'equipo_id')::BIGINT, (value->>'itemId')::BIGINT) = v_equipo_id
              AND COALESCE((value->>'es_subcontratado')::BOOLEAN, (value->>'esSubcontratado')::BOOLEAN, false) = false
        LOOP
            v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
            v_fecha_inicio := COALESCE((v_item->>'fecha_inicio')::DATE, (v_item->>'fechaInicio')::DATE, CURRENT_DATE);
            v_fecha_fin := COALESCE((v_item->>'fecha_fin')::DATE, (v_item->>'fechaFinEstimada')::DATE, v_fecha_inicio + 1);

            IF v_fecha_fin < v_fecha_inicio THEN
                RAISE EXCEPTION 'ERR_FECHAS_INVALIDAS: La fecha fin (%) no puede ser menor a la fecha inicio (%) para equipo ID %.',
                    v_fecha_fin, v_fecha_inicio, v_equipo_id
                    USING ERRCODE = 'P0003';
            END IF;

            -- Curva de ocupación concurrente día a día
            WITH dias_solicitados AS (
                SELECT generate_series(v_fecha_inicio, v_fecha_fin, '1 day'::interval)::date AS dia
            ),
            ocupacion_externa AS (
                SELECT 
                    ds.dia,
                    COALESCE(SUM(ad.cantidad - ad.cantidad_devuelta), 0) AS ocupado_externo
                FROM dias_solicitados ds
                LEFT JOIN public.alquiler_detalles ad 
                    ON ad.empresa_id = v_tenant_id 
                   AND ad.equipo_id = v_equipo_id
                   AND ad.devuelto = FALSE
                   AND ad.fecha_inicio <= ds.dia
                   AND COALESCE(ad.fecha_fin, ds.dia) >= ds.dia
                LEFT JOIN public.alquileres a
                    ON a.id = ad.alquiler_id
                   AND a.estado IN ('ACTIVO', 'ACTIVO_EN_OBRA', 'PENDIENTE_ENTREGA')
                GROUP BY ds.dia
            ),
            ocupacion_payload_intra AS (
                SELECT 
                    ds.dia,
                    COALESCE(SUM(
                        CASE 
                            WHEN COALESCE((other->>'fecha_inicio')::DATE, (other->>'fechaInicio')::DATE) <= ds.dia
                             AND COALESCE((other->>'fecha_fin')::DATE, (other->>'fechaFinEstimada')::DATE) >= ds.dia
                            THEN COALESCE((other->>'cantidad')::INT, 1)
                            ELSE 0 
                        END
                    ), 0) AS ocupado_intra_payload
                FROM dias_solicitados ds
                CROSS JOIN jsonb_array_elements(p_payload->'items') other
                WHERE COALESCE((other->>'equipo_id')::BIGINT, (other->>'itemId')::BIGINT) = v_equipo_id
                  AND COALESCE((other->>'es_subcontratado')::BOOLEAN, (other->>'esSubcontratado')::BOOLEAN, false) = false
                GROUP BY ds.dia
            )
            SELECT 
                oe.dia,
                (oe.ocupado_externo + opi.ocupado_intra_payload) AS total_demanda
            INTO v_dia_pico, v_max_ocupado
            FROM ocupacion_externa oe
            JOIN ocupacion_payload_intra opi ON opi.dia = oe.dia
            ORDER BY (oe.ocupado_externo + opi.ocupado_intra_payload) DESC
            LIMIT 1;

            -- Si es Contrato formalizado (ACTIVO / PENDIENTE_ENTREGA): BLOQUEO ESTRICTO
            IF v_estado IN ('ACTIVO', 'ACTIVO_EN_OBRA', 'PENDIENTE_ENTREGA') THEN
                IF v_max_ocupado > v_stock_total THEN
                    RAISE EXCEPTION 'ERR_OVERBOOKING_CONCURRENTE: Stock insuficiente para equipo ID % en la fecha pico %. Stock Total: %, Demanda Comprometida: %, Déficit: % unidades.',
                        v_equipo_id, 
                        v_dia_pico, 
                        v_stock_total, 
                        v_max_ocupado, 
                        (v_max_ocupado - v_stock_total)
                        USING ERRCODE = 'P0004';
                END IF;
            ELSE
                -- Si es Cotización o Borrador: Registrar advertencia sin abortar
                IF v_max_ocupado > v_stock_total THEN
                    v_advertencia_overbooking := v_advertencia_overbooking || jsonb_build_object(
                        'equipo_id', v_equipo_id,
                        'dia_pico', v_dia_pico,
                        'stock_total', v_stock_total,
                        'demanda', v_max_ocupado,
                        'deficit', (v_max_ocupado - v_stock_total)
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    -- 4. Inserción de la Cabecera del Contrato / Cotización
    INSERT INTO public.alquileres (
        empresa_id, idempotency_key, cliente_id, estado,
        subtotal_equipos, flete_entrega, flete_recogida, subtotal_general, total,
        deposito, garantia_monto, garantia_tipo, garantia_estado, total_pagado, saldo_pendiente,
        observaciones, detalles_logistica, creado_por
    ) VALUES (
        v_tenant_id, v_idempotency_key,
        COALESCE((p_payload->>'cliente_id')::INT, (p_payload->>'clienteId')::INT),
        v_estado,
        COALESCE((p_payload->>'subtotal_equipos')::NUMERIC, (p_payload->>'subtotalEquipos')::NUMERIC, 0),
        COALESCE((p_payload->>'flete_entrega')::NUMERIC, (p_payload->>'fleteEntrega')::NUMERIC, 0),
        COALESCE((p_payload->>'flete_recogida')::NUMERIC, (p_payload->>'fleteRecogida')::NUMERIC, 0),
        COALESCE((p_payload->>'subtotal_general')::NUMERIC, (p_payload->>'subtotalGeneral')::NUMERIC, 0),
        COALESCE((p_payload->>'total')::NUMERIC, (p_payload->>'totalEstimado')::NUMERIC, 0),
        COALESCE((p_payload->>'deposito')::NUMERIC, 0),
        COALESCE((p_payload->>'garantia_monto')::NUMERIC, (p_payload->>'garantiaMonto')::NUMERIC, 0),
        COALESCE(p_payload->>'garantia_tipo', p_payload->>'garantiaTipo', 'Efectivo'),
        'Activa', 0,
        GREATEST(0, COALESCE((p_payload->>'total')::NUMERIC, 0) - COALESCE((p_payload->>'deposito')::NUMERIC, 0)),
        p_payload->>'observaciones',
        COALESCE(p_payload->>'detalles_logistica', p_payload->>'detallesLogistica'),
        COALESCE(p_payload->>'creado_por', p_payload->>'creadoPor', 'SISTEMA')
    )
    RETURNING id, consecutivo INTO v_alquiler_id, v_consecutivo;

    -- 5. Inserción de Líneas de Detalle Segmentadas
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_linea_numero := v_linea_numero + 1;
        v_equipo_id := COALESCE((v_item->>'equipo_id')::BIGINT, (v_item->>'itemId')::BIGINT);
        v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
        v_tarifa := COALESCE((v_item->>'tarifa_aplicada')::NUMERIC, (v_item->>'tarifaAplicada')::NUMERIC, 0);
        v_dias := COALESCE((v_item->>'dias_contratados')::INT, (v_item->>'diasCobro')::INT, 1);
        v_subtotal_linea := COALESCE((v_item->>'subtotal_linea')::NUMERIC, (v_item->>'subtotalLinea')::NUMERIC, v_cantidad * v_tarifa * v_dias);
        v_fecha_inicio := COALESCE((v_item->>'fecha_inicio')::DATE, (v_item->>'fechaInicio')::DATE, CURRENT_DATE);
        v_fecha_fin := COALESCE((v_item->>'fecha_fin')::DATE, (v_item->>'fechaFinEstimada')::DATE, v_fecha_inicio + v_dias);
        v_tarifa_personalizada := COALESCE((v_item->>'tarifa_personalizada')::BOOLEAN, (v_item->>'tarifaPersonalizada')::BOOLEAN, false);
        v_subtotal_personalizado := COALESCE((v_item->>'subtotal_personalizado')::BOOLEAN, (v_item->>'subtotalPersonalizado')::BOOLEAN, false);
        v_es_subcontratado := COALESCE((v_item->>'es_subcontratado')::BOOLEAN, (v_item->>'esSubcontratado')::BOOLEAN, false);

        IF v_es_subcontratado THEN
            IF (v_item->>'proveedor_subcontratado_id') IS NOT NULL AND (v_item->>'proveedor_subcontratado_id') <> '' THEN
                v_proveedor_sub_id := (v_item->>'proveedor_subcontratado_id')::UUID;
            ELSE
                v_proveedor_sub_id := NULL;
            END IF;
            v_costo_proveedor := COALESCE((v_item->>'costo_diario_proveedor')::NUMERIC, 0);

            INSERT INTO public.alquiler_detalles (
                empresa_id, alquiler_id, equipo_id, linea_numero, cantidad, tarifa_aplicada,
                tarifa_personalizada, dias_contratados, subtotal_linea, subtotal_personalizado,
                fecha_inicio, fecha_fin, devuelto, cantidad_devuelta, costo_dano,
                es_subcontratado, proveedor_subcontratado_id, costo_diario_proveedor
            ) VALUES (
                v_tenant_id, v_alquiler_id, v_equipo_id, v_linea_numero, v_cantidad, v_tarifa,
                v_tarifa_personalizada, v_dias, v_subtotal_linea, v_subtotal_personalizado,
                v_fecha_inicio, v_fecha_fin, false, 0, 0,
                true, v_proveedor_sub_id, v_costo_proveedor
            );
        ELSE
            INSERT INTO public.alquiler_detalles (
                empresa_id, alquiler_id, equipo_id, linea_numero, cantidad, tarifa_aplicada,
                tarifa_personalizada, dias_contratados, subtotal_linea, subtotal_personalizado,
                fecha_inicio, fecha_fin, devuelto, cantidad_devuelta, costo_dano,
                es_subcontratado
            ) VALUES (
                v_tenant_id, v_alquiler_id, v_equipo_id, v_linea_numero, v_cantidad, v_tarifa,
                v_tarifa_personalizada, v_dias, v_subtotal_linea, v_subtotal_personalizado,
                v_fecha_inicio, v_fecha_fin, false, 0, 0,
                false
            );

            -- Si es contrato formalizado, descontar inventario en muelle
            IF v_estado IN ('ACTIVO', 'ACTIVO_EN_OBRA') THEN
                UPDATE public.equipos
                SET stock_disponible = GREATEST(0, stock_disponible - v_cantidad),
                    stock_en_obra = COALESCE(stock_en_obra, 0) + v_cantidad,
                    updated_at = NOW()
                WHERE id = v_equipo_id AND empresa_id = v_tenant_id;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_alquiler_id,
        'consecutivo', v_consecutivo,
        'estado', v_estado,
        'lineas_procesadas', v_linea_numero,
        'empresa_id', v_tenant_id,
        'advertencias_overbooking', v_advertencia_overbooking
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM USING ERRCODE = SQLSTATE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.alquiler_despachar_segmentado_concurrente_v1(JSONB) TO authenticated, service_role;

