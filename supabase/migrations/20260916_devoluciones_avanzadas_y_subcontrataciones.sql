-- ==============================================================================
-- FERREON ERP - MÓDULO DE DEVOLUCIONES AVANZADAS, SPLIT-LINE E INSPECCIÓN TÉCNICA
-- Base de Datos: Supabase (PostgreSQL)
-- Fecha: 2026-09-16
-- ==============================================================================

BEGIN;

-- 1. EXTENSIÓN DE TABLA ALQUILER_DETALLES (Soporte Split-Line e Inspección)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='estado_inspeccion') THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN estado_inspeccion VARCHAR(30) DEFAULT 'BUENO' 
        CHECK (estado_inspeccion IN ('BUENO', 'MANTENIMIENTO', 'PERDIDA_TOTAL'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='costo_reparacion') THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN costo_reparacion NUMERIC(15, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='valor_reposicion') THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN valor_reposicion NUMERIC(15, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='descripcion_dano') THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN descripcion_dano TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='fecha_devolucion_real') THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN fecha_devolucion_real TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='es_item_clonado_split') THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN es_item_clonado_split BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alquiler_detalles' AND column_name='item_origen_id') THEN
        ALTER TABLE public.alquiler_detalles 
        ADD COLUMN item_origen_id BIGINT REFERENCES public.alquiler_detalles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. EXTENSIÓN DE TABLA EQUIPOS (Soporte Stock Perdido / Baja)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipos' AND column_name='stock_perdido') THEN
        ALTER TABLE public.equipos 
        ADD COLUMN stock_perdido INT DEFAULT 0 CHECK (stock_perdido >= 0);
    END IF;
END $$;

-- 3. EXTENSIÓN DE TABLA SUBCONTRATACIONES (Soporte Estados y Liquidación Contable)
DO $$
BEGIN
    ALTER TABLE public.subcontrataciones DROP CONSTRAINT IF EXISTS subcontrataciones_estado_check;
    ALTER TABLE public.subcontrataciones ADD CONSTRAINT subcontrataciones_estado_check 
        CHECK (estado IN ('ORDENADA', 'RECIBIDA_EN_BODEGA', 'EN_CLIENTE', 'DEVUELTA_A_PROVEEDOR', 'LIQUIDADA', 'CANCELADA'));

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subcontrataciones' AND column_name='costo_final_liquidado') THEN
        ALTER TABLE public.subcontrataciones 
        ADD COLUMN costo_final_liquidado NUMERIC(15, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subcontrataciones' AND column_name='aplica_retenciones') THEN
        ALTER TABLE public.subcontrataciones 
        ADD COLUMN aplica_retenciones BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subcontrataciones' AND column_name='retefuente_valor') THEN
        ALTER TABLE public.subcontrataciones 
        ADD COLUMN retefuente_valor NUMERIC(15, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subcontrataciones' AND column_name='reteica_valor') THEN
        ALTER TABLE public.subcontrataciones 
        ADD COLUMN reteica_valor NUMERIC(15, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subcontrataciones' AND column_name='asiento_contable_id') THEN
        ALTER TABLE public.subcontrataciones 
        ADD COLUMN asiento_contable_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. TABLA CABECERA DE DEVOLUCIONES (Eventos Inmutables de Devolución)
CREATE TABLE IF NOT EXISTS public.devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    consecutivo VARCHAR(50) NOT NULL,
    alquiler_id BIGINT NOT NULL REFERENCES public.alquileres(id) ON DELETE RESTRICT,
    fecha_devolucion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_dias_causados NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_alquiler_liquidado NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_danos NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_reposiciones NUMERIC(15, 2) NOT NULL DEFAULT 0,
    deposito_aplicado NUMERIC(15, 2) NOT NULL DEFAULT 0,
    saldo_neto NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tipo_resolucion VARCHAR(30) NOT NULL DEFAULT 'SIN_SALDO' 
        CHECK (tipo_resolucion IN ('REEMBOLSO_CLIENTE', 'COBRO_CLIENTE', 'SIN_SALDO')),
    metodo_pago VARCHAR(50) DEFAULT 'EFECTIVO',
    sesion_caja_id UUID REFERENCES public.sesiones_caja(id) ON DELETE SET NULL,
    movimiento_caja_id UUID REFERENCES public.movimientos_caja(id) ON DELETE SET NULL,
    asiento_contable_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    idempotency_key TEXT,
    recibido_por VARCHAR(100) DEFAULT 'OPERADOR',
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA LÍNEAS DE DEVOLUCIÓN (Detalles de Inspección por Ítem)
CREATE TABLE IF NOT EXISTS public.devolucion_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucion_id UUID NOT NULL REFERENCES public.devoluciones(id) ON DELETE CASCADE,
    alquiler_detalle_id BIGINT NOT NULL REFERENCES public.alquiler_detalles(id) ON DELETE RESTRICT,
    equipo_id BIGINT NOT NULL REFERENCES public.equipos(id) ON DELETE RESTRICT,
    cantidad_devuelta INT NOT NULL CHECK (cantidad_devuelta > 0),
    estado_inspeccion VARCHAR(30) NOT NULL DEFAULT 'BUENO' 
        CHECK (estado_inspeccion IN ('BUENO', 'MANTENIMIENTO', 'PERDIDA_TOTAL')),
    costo_reparacion NUMERIC(15, 2) NOT NULL DEFAULT 0,
    valor_reposicion NUMERIC(15, 2) NOT NULL DEFAULT 0,
    descripcion_dano TEXT,
    dias_efectivos_cobrados INT NOT NULL DEFAULT 0,
    tarifa_diaria_aplicada NUMERIC(15, 2) NOT NULL DEFAULT 0,
    subtotal_alquiler NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ÍNDICES DE RENDIMIENTO E IDEMPOTENCIA
CREATE INDEX IF NOT EXISTS idx_devoluciones_alquiler ON public.devoluciones(alquiler_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_empresa ON public.devoluciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_fecha ON public.devoluciones(fecha_devolucion DESC);
CREATE INDEX IF NOT EXISTS idx_devolucion_detalles_dev ON public.devolucion_detalles(devolucion_id);
CREATE INDEX IF NOT EXISTS idx_devolucion_detalles_alq_det ON public.devolucion_detalles(alquiler_detalle_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_devoluciones_empresa_idempotency_key 
ON public.devoluciones (empresa_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 7. POLÍTICAS DE SEGURIDAD RLS
ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucion_detalles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select devoluciones" ON public.devoluciones;
CREATE POLICY "Permitir select devoluciones" ON public.devoluciones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insert devoluciones" ON public.devoluciones;
CREATE POLICY "Permitir insert devoluciones" ON public.devoluciones FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update devoluciones" ON public.devoluciones;
CREATE POLICY "Permitir update devoluciones" ON public.devoluciones FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir select devolucion_detalles" ON public.devolucion_detalles;
CREATE POLICY "Permitir select devolucion_detalles" ON public.devolucion_detalles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insert devolucion_detalles" ON public.devolucion_detalles;
CREATE POLICY "Permitir insert devolucion_detalles" ON public.devolucion_detalles FOR INSERT WITH CHECK (true);

-- 8. PROCEDIMIENTO ALMACENADO ATÓMICO: procesar_devolucion_avanzada
CREATE OR REPLACE FUNCTION public.procesar_devolucion_avanzada(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
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
    v_result JSONB;
BEGIN
    v_alquiler_id := (p_payload->>'alquiler_id')::BIGINT;
    v_idempotency_key := NULLIF(TRIM(p_payload->>'idempotency_key'), '');
    v_recibido_por := COALESCE(p_payload->>'recibido_por', 'OPERADOR');
    v_observaciones := p_payload->>'observaciones';
    v_sesion_caja_id := NULLIF(p_payload->>'sesion_caja_id', '')::UUID;
    v_metodo_pago := COALESCE(p_payload->>'metodo_pago', 'EFECTIVO');

    SELECT empresa_id INTO v_empresa_id
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

    -- 2. GENERAR CONSECUTIVO DEVOLUCIÓN (DEV-XXXX)
    v_consecutivo := 'DEV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    v_devolucion_id := gen_random_uuid();

    -- 3. PROCESAR CADA ÍTEM DEVUELTO
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

        INSERT INTO public.devolucion_detalles (
            devolucion_id, alquiler_detalle_id, equipo_id, cantidad_devuelta,
            estado_inspeccion, costo_reparacion, valor_reposicion, descripcion_dano,
            dias_efectivos_cobrados, tarifa_diaria_aplicada, subtotal_alquiler
        ) VALUES (
            v_devolucion_id, v_nuevo_detalle_id, v_equipo_id, v_cant_devuelta,
            v_estado_inspeccion, v_costo_reparacion, v_valor_reposicion, v_descripcion_dano,
            v_dias_causados, v_orig_tarifa, v_subtotal_alquiler_item
        );

        -- CLASIFICACIÓN DE INVENTARIO
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
        WHERE id = v_equipo_id;

        -- ALERTA RETORNO SUBCONTRATACIÓN
        IF v_orig_es_subcontratado AND v_orig_subcontratacion_id IS NOT NULL THEN
            UPDATE public.subcontrataciones
            SET estado = 'RECIBIDA_EN_BODEGA',
                fecha_recepcion_real = COALESCE(fecha_recepcion_real, NOW()),
                observaciones = COALESCE(observaciones, '') || E'\n[Retorno]: En bodega de FerreOn. Pendiente devolver al proveedor.',
                updated_at = NOW()
            WHERE id = v_orig_subcontratacion_id;
        END IF;
    END LOOP;

    -- 4. LIQUIDACIÓN DE GARANTÍA
    SELECT COALESCE(deposito, 0) INTO v_deposito_aplicado
    FROM public.alquileres
    WHERE id = v_alquiler_id;

    v_saldo_neto := v_deposito_aplicado - (v_total_alquiler_liquidado + v_total_danos + v_total_reposiciones);

    IF v_saldo_neto > 0 THEN
        v_tipo_resolucion := 'REEMBOLSO_CLIENTE';
    ELSIF v_saldo_neto < 0 THEN
        v_tipo_resolucion := 'COBRO_CLIENTE';
    ELSE
        v_tipo_resolucion := 'SIN_SALDO';
    END IF;

    -- 5. INSERTAR CABECERA
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

    -- 6. VERIFICAR FIN DE CONTRATO
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
