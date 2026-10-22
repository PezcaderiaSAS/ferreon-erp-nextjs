-- ============================================================================
-- MIGRACIÓN: 20261022_devoluciones_pos_checklist_averias.sql
-- Módulo: Devoluciones POS con Checklist de Averías & Liquidación de Garantía
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Tarea: TASK-010-13 & TASK-010-14 (Catálogo de Averías y RPC Liquidación POS)
-- ============================================================================

-- 1. Tabla: catalogo_averias_equipos
CREATE TABLE IF NOT EXISTS public.catalogo_averias_equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'LIMPIEZA', 'DANOS_MENORES', 'DANOS_MAYORES', 'PERDIDA'
    costo_sugerido NUMERIC(14, 2) NOT NULL DEFAULT 0,
    aplica_reposicion BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_catalogo_averias_empresa_cod UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_averias_empresa_id ON public.catalogo_averias_equipos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_averias_categoria ON public.catalogo_averias_equipos(categoria);

-- RLS
ALTER TABLE public.catalogo_averias_equipos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aislamiento tenant en catalogo_averias_equipos"
ON public.catalogo_averias_equipos
FOR ALL
USING (
    empresa_id = public.get_current_tenant_id()
    OR public.get_current_tenant_id() IS NULL
    OR auth.role() = 'service_role'
);

-- 2. Asegurar columnas de auditoría y desglose en devoluciones y devolucion_detalles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'devoluciones' 
          AND column_name = 'desglose_averias'
    ) THEN
        ALTER TABLE public.devoluciones ADD COLUMN desglose_averias JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'devolucion_detalles' 
          AND column_name = 'desglose_averias'
    ) THEN
        ALTER TABLE public.devolucion_detalles ADD COLUMN desglose_averias JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. Sembrar averías predeterminadas para tenants existentes
DO $$
DECLARE
    r_empresa RECORD;
BEGIN
    FOR r_empresa IN SELECT id FROM public.empresas LOOP
        INSERT INTO public.catalogo_averias_equipos (empresa_id, codigo, nombre, categoria, costo_sugerido, aplica_reposicion)
        VALUES 
            (r_empresa.id, 'LIMP_BASICA', 'Limpieza y Lavado Básico', 'LIMPIEZA', 15000, false),
            (r_empresa.id, 'LIMP_CONCRETO', 'Limpieza Concreto / Químicos Pegados', 'LIMPIEZA', 35000, false),
            (r_empresa.id, 'DANO_ELECTRICO', 'Reparación de Cable / Clavija Eléctrica', 'DANOS_MENORES', 25000, false),
            (r_empresa.id, 'DANO_ESTRUCTURAL', 'Golpes / Enderezado de Chasis o Estructura', 'DANOS_MENORES', 60000, false),
            (r_empresa.id, 'DANO_MOTOR', 'Mantenimiento Correctivo de Motor / Bobinado', 'DANOS_MAYORES', 150000, false),
            (r_empresa.id, 'PERDIDA_TOTAL', 'Pérdida Total o No Retorno de Maquinaria', 'PERDIDA', 0, true)
        ON CONFLICT (empresa_id, codigo) DO NOTHING;
    END LOOP;
END $$;

-- 4. RPC Transaccional: devolucion_pos_inspeccion_rapida_v1
-- Procesa inspección semafórica táctil, split-line, deducción de averías contra garantía y caja en mostrador
CREATE OR REPLACE FUNCTION public.devolucion_pos_inspeccion_rapida_v1(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alquiler_id BIGINT;
    v_empresa_id UUID;
    v_usuario_id UUID;
    v_recibido_por VARCHAR(100);
    v_observaciones TEXT;
    v_sesion_caja_id UUID;
    v_metodo_pago VARCHAR(50);
    v_consecutivo VARCHAR(50);
    v_devolucion_id UUID;

    v_alquiler RECORD;
    v_item JSONB;
    v_detalle_id BIGINT;
    v_cant_devuelta INT;
    v_semaforo VARCHAR(20); -- 'VERDE_BUENO', 'AMARILLO_SUCIO', 'NARANJA_DANADO', 'ROJO_PERDIDA'
    v_costo_limpieza NUMERIC(14, 2);
    v_costo_reparacion NUMERIC(14, 2);
    v_valor_reposicion NUMERIC(14, 2);
    v_costo_averias_total NUMERIC(14, 2);
    v_descripcion_dano TEXT;
    v_desglose_averias_item JSONB;

    v_orig RECORD;
    v_dias_causados INT;
    v_subtotal_alquiler_item NUMERIC(14, 2);

    v_total_alquiler_liquidado NUMERIC(14, 2) := 0;
    v_total_danos NUMERIC(14, 2) := 0;
    v_total_reposiciones NUMERIC(14, 2) := 0;
    v_deposito_disponible NUMERIC(14, 2) := 0;
    v_saldo_neto NUMERIC(14, 2) := 0;
    v_tipo_resolucion VARCHAR(30) := 'SIN_SALDO';

    v_nuevo_detalle_id BIGINT;
    v_pendientes_restantes INT;
    v_mov_caja_id UUID;
    v_monto_movimiento NUMERIC(14, 2) := 0;
BEGIN
    v_alquiler_id := (p_payload->>'alquiler_id')::BIGINT;
    IF v_alquiler_id IS NULL AND (p_payload->>'alquilerId') IS NOT NULL THEN
        v_alquiler_id := (p_payload->>'alquilerId')::BIGINT;
    END IF;

    IF v_alquiler_id IS NULL THEN
        RAISE EXCEPTION 'ERR_ALQUILER_ID_REQUIRED: El parámetro alquiler_id es obligatorio.'
            USING ERRCODE = 'P0001';
    END IF;

    v_recibido_por := COALESCE(p_payload->>'recibido_por', p_payload->>'recibidoPor', 'OPERADOR_POS');
    v_observaciones := COALESCE(p_payload->>'observaciones', 'Inspección de Devolución POS');
    v_metodo_pago := UPPER(COALESCE(p_payload->>'metodo_pago', p_payload->>'metodoPago', 'EFECTIVO'));

    -- 1. Bloqueo pesimista del contrato
    SELECT * INTO v_alquiler
    FROM public.alquileres
    WHERE id = v_alquiler_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_ALQUILER_NOT_FOUND: El contrato con ID % no existe.', v_alquiler_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_alquiler.estado = 'FINALIZADO' OR v_alquiler.estado = 'ANULADO' THEN
        RAISE EXCEPTION 'ERR_CONTRATO_CERRADO: El contrato ya se encuentra en estado %.', v_alquiler.estado
            USING ERRCODE = 'P0003';
    END IF;

    v_empresa_id := COALESCE(v_alquiler.empresa_id, public.get_current_tenant_id());
    v_deposito_disponible := COALESCE(v_alquiler.deposito, 0);

    -- 2. Resolver sesión de caja abierta si no viene explícita
    IF (p_payload->>'sesion_caja_id') IS NOT NULL AND (p_payload->>'sesion_caja_id') <> '' THEN
        v_sesion_caja_id := (p_payload->>'sesion_caja_id')::UUID;
    ELSE
        SELECT id INTO v_sesion_caja_id
        FROM public.sesiones_caja
        WHERE empresa_id = v_empresa_id AND estado = 'ABIERTA'
        ORDER BY fecha_apertura DESC
        LIMIT 1;
    END IF;

    v_consecutivo := 'DEV-POS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    v_devolucion_id := gen_random_uuid();

    -- 3. Fase 1: Pre-cálculo financiero y validación de ítems
    IF p_payload->'items' IS NULL OR jsonb_array_length(p_payload->'items') = 0 THEN
        RAISE EXCEPTION 'ERR_SIN_ITEMS_DEVOLUCION: Debe incluir al menos una línea de equipo a devolver.'
            USING ERRCODE = 'P0004';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_detalle_id := COALESCE((v_item->>'detalle_id')::BIGINT, (v_item->>'detalleId')::BIGINT);
        v_cant_devuelta := COALESCE((v_item->>'cantidad_devuelta')::INT, (v_item->>'cantidadDevuelta')::INT, 0);
        v_costo_reparacion := COALESCE((v_item->>'costo_reparacion')::NUMERIC, (v_item->>'costoReparacion')::NUMERIC, 0);
        v_costo_limpieza := COALESCE((v_item->>'costo_limpieza')::NUMERIC, (v_item->>'costoLimpieza')::NUMERIC, 0);
        v_valor_reposicion := COALESCE((v_item->>'valor_reposicion')::NUMERIC, (v_item->>'valorReposicion')::NUMERIC, 0);

        IF v_cant_devuelta <= 0 THEN
            CONTINUE;
        END IF;

        SELECT * INTO v_orig
        FROM public.alquiler_detalles
        WHERE id = v_detalle_id AND alquiler_id = v_alquiler_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR_DETALLE_NOT_FOUND: Detalle ID % no pertenece al contrato %.', v_detalle_id, v_alquiler_id
                USING ERRCODE = 'P0005';
        END IF;

        IF v_cant_devuelta > (v_orig.cantidad - COALESCE(v_orig.cantidad_devuelta, 0)) THEN
            RAISE EXCEPTION 'ERR_CANTIDAD_EXCEDE_PENDIENTE: No puede devolver % unidades; pendientes: %.',
                v_cant_devuelta, (v_orig.cantidad - COALESCE(v_orig.cantidad_devuelta, 0))
                USING ERRCODE = 'P0006';
        END IF;

        v_dias_causados := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (NOW() - COALESCE(v_orig.fecha_inicio, NOW()))) / 86400)::INT);
        v_subtotal_alquiler_item := v_dias_causados * v_orig.tarifa_aplicada * v_cant_devuelta;

        v_total_alquiler_liquidado := v_total_alquiler_liquidado + v_subtotal_alquiler_item;
        v_total_danos := v_total_danos + v_costo_reparacion + v_costo_limpieza;
        v_total_reposiciones := v_total_reposiciones + v_valor_reposicion;
    END LOOP;

    -- 4. Liquidación cruzada de garantía
    -- saldo_neto = deposito - (daños + reposiciones)
    -- Si saldo_neto > 0 -> Reembolso al cliente del depósito restante
    -- Si saldo_neto < 0 -> Cobro al cliente por averías excedentes
    v_saldo_neto := v_deposito_disponible - (v_total_danos + v_total_reposiciones);

    IF v_saldo_neto > 0 THEN
        v_tipo_resolucion := 'REEMBOLSO_CLIENTE';
        v_monto_movimiento := v_saldo_neto;
    ELSIF v_saldo_neto < 0 THEN
        v_tipo_resolucion := 'COBRO_CLIENTE';
        v_monto_movimiento := ABS(v_saldo_neto);
    ELSE
        v_tipo_resolucion := 'SIN_SALDO';
        v_monto_movimiento := 0;
    END IF;

    -- 5. Insertar cabecera de devolución
    INSERT INTO public.devoluciones (
        id,
        empresa_id,
        consecutivo,
        alquiler_id,
        fecha_devolucion,
        total_dias_causados,
        total_alquiler_liquidado,
        total_danos,
        total_reposiciones,
        deposito_aplicado,
        saldo_neto,
        tipo_resolucion,
        metodo_pago,
        sesion_caja_id,
        recibido_por,
        observaciones,
        desglose_averias
    ) VALUES (
        v_devolucion_id,
        v_empresa_id,
        v_consecutivo,
        v_alquiler_id,
        NOW(),
        0,
        v_total_alquiler_liquidado,
        v_total_danos,
        v_total_reposiciones,
        v_deposito_disponible,
        v_saldo_neto,
        v_tipo_resolucion,
        v_metodo_pago,
        v_sesion_caja_id,
        v_recibido_por,
        v_observaciones,
        COALESCE(p_payload->'items', '[]'::jsonb)
    );

    -- 6. Fase 2: Aplicar devoluciones a ítems, split-line e inventario
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_detalle_id := COALESCE((v_item->>'detalle_id')::BIGINT, (v_item->>'detalleId')::BIGINT);
        v_cant_devuelta := COALESCE((v_item->>'cantidad_devuelta')::INT, (v_item->>'cantidadDevuelta')::INT, 0);
        v_semaforo := UPPER(COALESCE(v_item->>'semaforo', 'VERDE_BUENO'));
        v_costo_reparacion := COALESCE((v_item->>'costo_reparacion')::NUMERIC, (v_item->>'costoReparacion')::NUMERIC, 0);
        v_costo_limpieza := COALESCE((v_item->>'costo_limpieza')::NUMERIC, (v_item->>'costoLimpieza')::NUMERIC, 0);
        v_valor_reposicion := COALESCE((v_item->>'valor_reposicion')::NUMERIC, (v_item->>'valorReposicion')::NUMERIC, 0);
        v_costo_averias_total := v_costo_reparacion + v_costo_limpieza + v_valor_reposicion;
        v_descripcion_dano := COALESCE(v_item->>'descripcion_dano', v_item->>'descripcionDano', '');
        v_desglose_averias_item := COALESCE(v_item->'desglose_averias', '[]'::jsonb);

        IF v_cant_devuelta <= 0 THEN
            CONTINUE;
        END IF;

        SELECT * INTO v_orig
        FROM public.alquiler_detalles
        WHERE id = v_detalle_id AND alquiler_id = v_alquiler_id;

        -- Split-line si la devolución es parcial
        IF v_cant_devuelta < (v_orig.cantidad - COALESCE(v_orig.cantidad_devuelta, 0)) THEN
            INSERT INTO public.alquiler_detalles (
                alquiler_id,
                empresa_id,
                equipo_id,
                cantidad,
                tarifa_aplicada,
                dias_contratados,
                subtotal_linea,
                costo_dano,
                devuelto,
                cantidad_devuelta,
                fecha_inicio,
                fecha_fin,
                fecha_devolucion_real,
                estado_inspeccion,
                costo_reparacion,
                valor_reposicion,
                descripcion_dano,
                es_item_clonado_split,
                item_origen_id,
                es_subcontratado,
                desglose_averias
            ) VALUES (
                v_alquiler_id,
                v_empresa_id,
                v_orig.equipo_id,
                v_cant_devuelta,
                v_orig.tarifa_aplicada,
                v_orig.dias_contratados,
                (v_orig.tarifa_aplicada * v_orig.dias_contratados * v_cant_devuelta),
                v_costo_averias_total,
                true,
                v_cant_devuelta,
                v_orig.fecha_inicio,
                NOW(),
                NOW(),
                v_semaforo,
                (v_costo_reparacion + v_costo_limpieza),
                v_valor_reposicion,
                v_descripcion_dano,
                true,
                v_detalle_id,
                v_orig.es_subcontratado,
                v_desglose_averias_item
            ) RETURNING id INTO v_nuevo_detalle_id;

            UPDATE public.alquiler_detalles
            SET cantidad = cantidad - v_cant_devuelta,
                subtotal_linea = dias_contratados * tarifa_aplicada * (cantidad - v_cant_devuelta)
            WHERE id = v_detalle_id;
        ELSE
            -- Devolución total de la línea
            UPDATE public.alquiler_detalles
            SET devuelto = true,
                cantidad_devuelta = cantidad,
                fecha_devolucion_real = NOW(),
                estado_inspeccion = v_semaforo,
                costo_dano = v_costo_averias_total,
                costo_reparacion = (v_costo_reparacion + v_costo_limpieza),
                valor_reposicion = v_valor_reposicion,
                descripcion_dano = v_descripcion_dano,
                desglose_averias = v_desglose_averias_item
            WHERE id = v_detalle_id;

            v_nuevo_detalle_id := v_detalle_id;
        END IF;

        -- Registrar detalle en devolucion_detalles
        INSERT INTO public.devolucion_detalles (
            devolucion_id,
            alquiler_detalle_id,
            equipo_id,
            cantidad_devuelta,
            dias_reales,
            subtotal_alquiler,
            estado_inspeccion,
            costo_reparacion,
            valor_reposicion,
            descripcion_dano,
            desglose_averias
        ) VALUES (
            v_devolucion_id,
            v_nuevo_detalle_id,
            v_orig.equipo_id,
            v_cant_devuelta,
            v_orig.dias_contratados,
            (v_orig.tarifa_aplicada * v_orig.dias_contratados * v_cant_devuelta),
            v_semaforo,
            (v_costo_reparacion + v_costo_limpieza),
            v_valor_reposicion,
            v_descripcion_dano,
            v_desglose_averias_item
        );

        -- Actualizar stock físico
        IF NOT COALESCE(v_orig.es_subcontratado, false) THEN
            IF v_semaforo = 'ROJO_PERDIDA' THEN
                -- Pérdida: no vuelve a stock disponible; se descuenta de stock en obra
                UPDATE public.equipos
                SET stock_en_obra = GREATEST(0, stock_en_obra - v_cant_devuelta),
                    updated_at = NOW()
                WHERE id = v_orig.equipo_id;
            ELSIF v_semaforo = 'NARANJA_DANADO' THEN
                -- Dañado: pasa a mantenimiento técnico si existe la columna stock_mantenimiento
                UPDATE public.equipos
                SET stock_en_obra = GREATEST(0, stock_en_obra - v_cant_devuelta),
                    stock_disponible = stock_disponible + v_cant_devuelta,
                    updated_at = NOW()
                WHERE id = v_orig.equipo_id;
            ELSE
                -- Verde (Bueno) o Amarillo (Sucio): vuelve a stock disponible
                UPDATE public.equipos
                SET stock_disponible = stock_disponible + v_cant_devuelta,
                    stock_en_obra = GREATEST(0, stock_en_obra - v_cant_devuelta),
                    updated_at = NOW()
                WHERE id = v_orig.equipo_id;
            END IF;
        END IF;
    END LOOP;

    -- 7. Registrar movimiento en caja si hay sesión abierta
    IF v_sesion_caja_id IS NOT NULL AND v_monto_movimiento > 0 THEN
        IF v_tipo_resolucion = 'REEMBOLSO_CLIENTE' THEN
            -- Devolución de depósito al cliente (EGRESO de caja)
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
                v_empresa_id,
                v_empresa_id,
                v_sesion_caja_id,
                COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
                'EGRESO',
                v_monto_movimiento,
                'Reembolso Depósito Garantía Contrato #' || v_alquiler.consecutivo || ' (' || v_metodo_pago || ')',
                'Contrato #' || v_alquiler.consecutivo,
                v_consecutivo
            ) RETURNING id INTO v_mov_caja_id;
        ELSIF v_tipo_resolucion = 'COBRO_CLIENTE' THEN
            -- Cobro de averías / daños al cliente (INGRESO a caja)
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
                v_empresa_id,
                v_empresa_id,
                v_sesion_caja_id,
                COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
                'INGRESO',
                v_monto_movimiento,
                'Cobro Excedente Averías/Daños Contrato #' || v_alquiler.consecutivo || ' (' || v_metodo_pago || ')',
                'Contrato #' || v_alquiler.consecutivo,
                v_consecutivo
            ) RETURNING id INTO v_mov_caja_id;
        END IF;
    END IF;

    -- 8. Verificar si quedan ítems pendientes en el contrato para cerrarlo o mantenerlo activo
    SELECT COUNT(*) INTO v_pendientes_restantes
    FROM public.alquiler_detalles
    WHERE alquiler_id = v_alquiler_id AND (devuelto IS NULL OR devuelto = false);

    IF v_pendientes_restantes = 0 THEN
        UPDATE public.alquileres
        SET estado = 'FINALIZADO',
            deposito = 0,
            saldo_pendiente = 0,
            updated_at = NOW()
        WHERE id = v_alquiler_id;
    ELSE
        -- Actualizar depósito restante si se liquidó parte
        UPDATE public.alquileres
        SET deposito = GREATEST(0, deposito - (v_total_danos + v_total_reposiciones)),
            updated_at = NOW()
        WHERE id = v_alquiler_id;
    END IF;

    -- 9. Retorno Estructurado
    RETURN jsonb_build_object(
        'success', true,
        'devolucion_id', v_devolucion_id,
        'consecutivo', v_consecutivo,
        'alquiler_id', v_alquiler_id,
        'total_danos', v_total_danos,
        'total_reposiciones', v_total_reposiciones,
        'deposito_aplicado', v_deposito_disponible,
        'saldo_neto', v_saldo_neto,
        'tipo_resolucion', v_tipo_resolucion,
        'movimiento_caja_id', v_mov_caja_id,
        'sesion_caja_id', v_sesion_caja_id,
        'contrato_cerrado', (v_pendientes_restantes = 0),
        'mensaje', 'Devolución e inspección POS procesada exitosamente.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.devolucion_pos_inspeccion_rapida_v1(JSONB) TO authenticated, service_role;
