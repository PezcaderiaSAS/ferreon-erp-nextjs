-- ==============================================================================
-- MIGRACIÓN: COTIZACIONES PESIMISTAS ANTI-DEADLOCK & PAGOS MIXTOS MULTILÍNEA
-- Proyecto: FerreOn ERP SaaS
-- Fecha: 2026-09-16
-- Módulos: Módulo 1 (Cotizaciones Comerciales) & Módulo 3 (Tesorería & Cartera)
-- ==============================================================================

BEGIN;

-- 1. EXTENDER TABLA CLIENTES CON SALDO A FAVOR (CRÉDITO EN CUSTODIA)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='saldo_a_favor') THEN
        ALTER TABLE public.clientes ADD COLUMN saldo_a_favor NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (saldo_a_favor >= 0);
    END IF;
END $$;

-- 2. TABLA INMUTABLE DE HISTORIAL DE MOVIMIENTOS DE SALDO A FAVOR DE CLIENTES
CREATE TABLE IF NOT EXISTS public.cliente_movimientos_saldo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id BIGINT NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('ABONO_SALDO_FAVOR', 'USO_PAGO_ALQUILER', 'REEMBOLSO_EFECTIVO', 'AJUSTE_AUDITORIA')),
    monto NUMERIC(15, 2) NOT NULL CHECK (monto > 0),
    saldo_resultante NUMERIC(15, 2) NOT NULL CHECK (saldo_resultante >= 0),
    referencia_origen VARCHAR(100),
    motivo TEXT,
    creado_por UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cliente_mov_saldo_cliente ON public.cliente_movimientos_saldo(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_mov_saldo_empresa ON public.cliente_movimientos_saldo(empresa_id);

ALTER TABLE public.cliente_movimientos_saldo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants can manage own cliente_movimientos_saldo" ON public.cliente_movimientos_saldo;
CREATE POLICY "Tenants can manage own cliente_movimientos_saldo" ON public.cliente_movimientos_saldo 
    FOR ALL USING (true);

-- 3. TABLA DE DESGLOSE DE MÉTODOS DE PAGO MIXTO (MULTILÍNEA)
CREATE TABLE IF NOT EXISTS public.pago_metodos_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    pago_id BIGINT NOT NULL REFERENCES public.pagos(id) ON DELETE CASCADE,
    metodo VARCHAR(50) NOT NULL CHECK (metodo IN ('EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'CHEQUE', 'SALDO_A_FAVOR')),
    monto NUMERIC(15, 2) NOT NULL CHECK (monto > 0),
    referencia VARCHAR(100),
    sesion_caja_id UUID REFERENCES sesiones_caja(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pago_metodos_pago ON public.pago_metodos_detalle(pago_id);
CREATE INDEX IF NOT EXISTS idx_pago_metodos_sesion ON public.pago_metodos_detalle(sesion_caja_id);

ALTER TABLE public.pago_metodos_detalle ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants can manage own pago_metodos_detalle" ON public.pago_metodos_detalle;
CREATE POLICY "Tenants can manage own pago_metodos_detalle" ON public.pago_metodos_detalle 
    FOR ALL USING (true);

-- 4. PROCEDIMIENTO ALMACENADO ATÓMICO: CONVERTIR COTIZACIÓN A ALQUILER (CON BLOQUEO PESIMISTA ANTI-DEADLOCK)
CREATE OR REPLACE FUNCTION public.convertir_cotizacion_a_alquiler_transaccional(
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cotizacion_id UUID;
    v_idempotency_key TEXT;
    v_usuario_id UUID;
    v_detalles_logistica TEXT;
    
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
BEGIN
    v_cotizacion_id := (p_payload->>'cotizacion_id')::UUID;
    v_idempotency_key := NULLIF(TRIM(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey')), '');
    v_detalles_logistica := COALESCE(p_payload->>'detalles_logistica', p_payload->>'detallesLogistica', '');
    
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
        RAISE EXCEPTION 'Cotización no encontrada con ID: %', v_cotizacion_id;
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

    v_tenant_id := v_cotizacion.tenant_id;
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

    -- C. Recolectar IDs de equipos involucrados
    SELECT array_agg(DISTINCT cd.equipo_id) INTO v_equipos_ids
    FROM public.cotizaciones_detalles cd
    WHERE cd.cotizacion_id = v_cotizacion_id;

    IF v_equipos_ids IS NULL OR array_length(v_equipos_ids, 1) = 0 THEN
        RAISE EXCEPTION 'La cotización % no contiene ítems ni equipos registrados.', v_cotizacion.consecutivo;
    END IF;

    -- D. BLOQUEO PESIMISTA ORDENADO ANTI-DEADLOCK:
    -- SELECT FOR UPDATE ordenando estrictamente por ID ascendente
    PERFORM id, stock_disponible
    FROM public.equipos
    WHERE id = ANY(v_equipos_ids)
    ORDER BY id ASC
    FOR UPDATE;

    -- E. Validar Existencias Reales
    FOR v_det IN SELECT cd.*, e.nombre, e.stock_disponible 
                 FROM public.cotizaciones_detalles cd
                 JOIN public.equipos e ON e.id = cd.equipo_id
                 WHERE cd.cotizacion_id = v_cotizacion_id
    LOOP
        IF v_det.stock_disponible < v_det.cantidad THEN
            RAISE EXCEPTION 'STOCK_INSUFICIENTE: Stock insuficiente para el equipo "%" (ID: %). Disponible: % unidad(es), Requerido: %.',
                v_det.nombre, v_det.equipo_id, v_det.stock_disponible, v_det.cantidad;
        END IF;
    END LOOP;

    -- F. Descontar Stock de Bodega e Incrementar Stock en Obra
    FOR v_det IN SELECT cd.equipo_id, cd.cantidad
                 FROM public.cotizaciones_detalles cd
                 WHERE cd.cotizacion_id = v_cotizacion_id
    LOOP
        UPDATE public.equipos
        SET stock_disponible = stock_disponible - v_det.cantidad,
            stock_en_obra = stock_en_obra + v_det.cantidad,
            updated_at = NOW()
        WHERE id = v_det.equipo_id;
    END LOOP;

    -- G. Calcular importes de cabecera
    v_flete := COALESCE(v_cotizacion.valor_transporte, 0);
    v_deposito := COALESCE(v_cotizacion.deposito_garantia, 0);
    v_total := COALESCE(v_cotizacion.total, 0);
    v_saldo_pend := GREATEST(0, v_total - v_deposito);

    -- H. Insertar Cabecera de Alquiler
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
        aplica_iva,
        valor_iva,
        aplica_retefuente,
        valor_retefuente,
        aplica_reteica,
        valor_reteica,
        cotizacion_origen_id,
        observaciones,
        detalles_logistica,
        creado_por
    ) VALUES (
        v_tenant_id,
        v_idempotency_key,
        v_cotizacion.cliente_id,
        'ACTIVO',
        COALESCE(v_cotizacion.subtotal, 0),
        v_flete,
        0,
        COALESCE(v_cotizacion.subtotal, 0) + v_flete,
        v_total,
        v_deposito,
        v_deposito,
        'Efectivo',
        'Activa',
        0,
        v_saldo_pend,
        COALESCE(v_cotizacion.aplica_iva, false),
        COALESCE(v_cotizacion.valor_iva, 0),
        COALESCE(v_cotizacion.aplica_retefuente, false),
        COALESCE(v_cotizacion.valor_retefuente, 0),
        COALESCE(v_cotizacion.aplica_reteica, false),
        COALESCE(v_cotizacion.valor_reteica, 0),
        v_cotizacion.id,
        COALESCE(v_cotizacion.observaciones, 'Convertido formalmente desde Cotización ' || v_cotizacion.consecutivo),
        v_detalles_logistica,
        COALESCE(v_usuario_id::TEXT, 'SISTEMA')
    )
    RETURNING id, consecutivo INTO v_alquiler_id, v_consecutivo;

    -- I. Insertar Líneas de Detalle en alquiler_detalles
    FOR v_det IN SELECT cd.* FROM public.cotizaciones_detalles cd WHERE cd.cotizacion_id = v_cotizacion_id LOOP
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
            v_det.equipo_id,
            v_det.cantidad,
            v_det.tarifa_diaria,
            v_det.dias,
            v_det.subtotal,
            v_hoy,
            v_hoy + (v_det.dias * INTERVAL '1 day')::INTERVAL,
            false,
            0,
            0,
            false
        );

        -- J. Insertar en Kardex de Inventario (Salida por Alquiler)
        INSERT INTO public.kardex_inventario (
            equipo_id,
            tenant_id,
            tipo_movimiento,
            cantidad_delta,
            stock_resultante,
            motivo,
            referencia_documento,
            usuario_id
        ) 
        SELECT 
            v_det.equipo_id,
            v_tenant_id,
            'ALQUILER_SALIDA',
            -ABS(v_det.cantidad),
            e.stock_disponible,
            'Despacho de alquiler formalizado desde cotización ' || v_cotizacion.consecutivo,
            'ALQ-' || COALESCE(v_consecutivo::TEXT, v_alquiler_id::TEXT),
            COALESCE(v_usuario_id, '00000000-0000-0000-0000-000000000000'::UUID)
        FROM public.equipos e
        WHERE e.id = v_det.equipo_id;
    END LOOP;

    -- K. Actualizar estado de la cotización a CONVERTIDA
    UPDATE public.cotizaciones
    SET estado = 'CONVERTIDA',
        alquiler_id = v_alquiler_id,
        updated_at = NOW()
    WHERE id = v_cotizacion.id;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'alquiler_id', v_alquiler_id,
        'consecutivo', v_consecutivo,
        'cotizacion_consecutivo', v_cotizacion.consecutivo,
        'total', v_total,
        'items_count', array_length(v_equipos_ids, 1)
    );
END;
$$;

COMMIT;
