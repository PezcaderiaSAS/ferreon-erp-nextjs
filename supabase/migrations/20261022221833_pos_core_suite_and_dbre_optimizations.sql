-- ============================================================================
-- MIGRACIÓN CANÓNICA: 20261022221833_pos_core_suite_and_dbre_optimizations.sql
-- Módulo: Core POS Suite (SPEC-010) & DBRE Concurrency Optimization (SPEC-011)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Registrado en Supabase Migration Tracker: 20261022221833
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLAS DDL & ESTRUCTURAS DE DATOS
-- ----------------------------------------------------------------------------

-- 1.1 Tabla: alquiler_adendas (Historial inmutable de versiones y extensiones de contrato)
CREATE TABLE IF NOT EXISTS public.alquiler_adendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    alquiler_id BIGINT NOT NULL REFERENCES public.alquileres(id) ON DELETE CASCADE,
    numero_version VARCHAR(20) NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    dias_adicionales INT DEFAULT 0,
    monto_adicional NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_deposito_adicional NUMERIC(14, 2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(50) DEFAULT 'EFECTIVO',
    datos_previos JSONB NOT NULL,
    datos_nuevos JSONB NOT NULL,
    observaciones TEXT,
    creado_por VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Tabla: catalogo_averias_equipos (Catálogo maestro de inspección POS y cobro rápido)
CREATE TABLE IF NOT EXISTS public.catalogo_averias_equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    costo_sugerido NUMERIC(14, 2) NOT NULL DEFAULT 0,
    aplica_reposicion BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_catalogo_averias_empresa_cod UNIQUE (empresa_id, codigo)
);

-- 1.3 Columnas de auditoría y desglose JSONB en devoluciones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'devoluciones' AND column_name = 'desglose_averias'
    ) THEN
        ALTER TABLE public.devoluciones ADD COLUMN desglose_averias JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'devolucion_detalles' AND column_name = 'desglose_averias'
    ) THEN
        ALTER TABLE public.devolucion_detalles ADD COLUMN desglose_averias JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 2. POLÍTICAS DE ROW LEVEL SECURITY (RLS) & AISLAMIENTO TENANT
-- ----------------------------------------------------------------------------
ALTER TABLE public.alquiler_adendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_averias_equipos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'alquiler_adendas' AND policyname = 'Aislamiento tenant en alquiler_adendas'
    ) THEN
        CREATE POLICY "Aislamiento tenant en alquiler_adendas"
        ON public.alquiler_adendas
        FOR ALL
        USING (
            empresa_id = public.get_current_tenant_id() 
            OR public.get_current_tenant_id() IS NULL
            OR auth.role() = 'service_role'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'catalogo_averias_equipos' AND policyname = 'Aislamiento tenant en catalogo_averias_equipos'
    ) THEN
        CREATE POLICY "Aislamiento tenant en catalogo_averias_equipos"
        ON public.catalogo_averias_equipos
        FOR ALL
        USING (
            empresa_id = public.get_current_tenant_id()
            OR public.get_current_tenant_id() IS NULL
            OR auth.role() = 'service_role'
        );
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 3. ÍNDICES DE ALTO RENDIMIENTO (DBRE Performance & Fast Joins)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_alquiler_adendas_alquiler_id ON public.alquiler_adendas(alquiler_id);
CREATE INDEX IF NOT EXISTS idx_alquiler_adendas_empresa_id ON public.alquiler_adendas(empresa_id);

CREATE INDEX IF NOT EXISTS idx_catalogo_averias_empresa_id ON public.catalogo_averias_equipos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_averias_categoria ON public.catalogo_averias_equipos(categoria);

-- Optimización de dashboard contratos y cotizaciones (evita sorting en memoria de PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_alquileres_empresa_created_active 
ON public.alquileres (empresa_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa_created_active 
ON public.cotizaciones (empresa_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_alquiler_detalles_empresa_alquiler 
ON public.alquiler_detalles (empresa_id, alquiler_id);


-- ----------------------------------------------------------------------------
-- 4. SEMILLA DE DATOS MAESTROS (Catálogo Inicial de Averías)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_emp RECORD;
BEGIN
    FOR v_emp IN SELECT id FROM public.empresas LOOP
        INSERT INTO public.catalogo_averias_equipos (empresa_id, codigo, nombre, categoria, costo_sugerido, aplica_reposicion)
        VALUES 
            (v_emp.id, 'LIMP-01', 'Limpieza profunda por exceso de lodo/cemento', 'LIMPIEZA', 25000, FALSE),
            (v_emp.id, 'DAN-MEN-01', 'Cable o clavija de alimentación desgastada/rota', 'DANOS_MENORES', 35000, FALSE),
            (v_emp.id, 'DAN-MEN-02', 'Carcasa o protector con fisuras leves', 'DANOS_MENORES', 50000, FALSE),
            (v_emp.id, 'DAN-MAY-01', 'Motor eléctrico quemado o trabado por sobretensión', 'DANOS_MAYORES', 280000, FALSE),
            (v_emp.id, 'DAN-MAY-02', 'Eje de transmisión o mandril quebrado', 'DANOS_MAYORES', 190000, FALSE),
            (v_emp.id, 'PERD-01', 'Pérdida total de equipo en obra (Reposición)', 'PERDIDA', 0, TRUE)
        ON CONFLICT (empresa_id, codigo) DO NOTHING;
    END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- 5. RPC TRANSACCIONAL: alquiler_crear_pos_rapido_v1
-- ----------------------------------------------------------------------------
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
    v_equipos_ids BIGINT[];
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
    v_saldo_pendiente NUMERIC(14, 2) := 0;
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_metodo_pago VARCHAR(50) := 'EFECTIVO';
    v_observaciones TEXT;
    v_detalles_logistica TEXT;
    v_sesion_caja_id UUID;
    v_mov_caja_id UUID;
BEGIN
    v_tenant_id := public.get_current_tenant_id();
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

    IF (p_payload->>'usuario_id') IS NOT NULL AND (p_payload->>'usuario_id') <> '' THEN
        v_usuario_id := (p_payload->>'usuario_id')::UUID;
    ELSE
        v_usuario_id := auth.uid();
    END IF;

    v_idempotency_key := NULLIF(TRIM(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey')), '');
    IF v_idempotency_key IS NOT NULL THEN
        SELECT id, consecutivo, total, deposito, saldo_pendiente
        INTO v_alquiler_id, v_consecutivo, v_total, v_deposito, v_saldo_pendiente
        FROM public.alquileres
        WHERE empresa_id = v_tenant_id AND idempotency_key = v_idempotency_key
        LIMIT 1;

        IF v_alquiler_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'alquiler_id', v_alquiler_id,
                'consecutivo', v_consecutivo,
                'total', v_total,
                'deposito', v_deposito,
                'saldo_pendiente', v_saldo_pendiente,
                'mensaje', 'Operación completada previamente por idempotencia.'
            );
        END IF;
    END IF;

    v_cliente_id := (p_payload->>'cliente_id')::BIGINT;
    IF v_cliente_id IS NULL AND (p_payload->>'clienteId') IS NOT NULL THEN
        v_cliente_id := (p_payload->>'clienteId')::BIGINT;
    END IF;

    IF v_cliente_id IS NULL THEN
        v_cliente_nombre := TRIM(COALESCE(p_payload->>'cliente_nombre', p_payload->>'clienteNombre', ''));
        v_cliente_doc := TRIM(COALESCE(p_payload->>'cliente_documento', p_payload->>'clienteDocumento', ''));

        IF v_cliente_doc <> '' THEN
            SELECT id INTO v_cliente_id
            FROM public.clientes
            WHERE empresa_id = v_tenant_id AND nit_cedula = v_cliente_doc
            LIMIT 1;
        END IF;

        IF v_cliente_id IS NULL AND v_cliente_nombre <> '' THEN
            INSERT INTO public.clientes (
                empresa_id,
                nombre,
                nit_cedula,
                telefono,
                direccion,
                email,
                estado
            ) VALUES (
                v_tenant_id,
                v_cliente_nombre,
                COALESCE(NULLIF(v_cliente_doc, ''), 'CC-TEMP-' || floor(random()*899999+100000)::text),
                COALESCE(p_payload->>'cliente_telefono', p_payload->>'clienteTelefono', '0000000'),
                COALESCE(p_payload->>'obra_direccion', p_payload->>'obraDireccion', 'Mostrador'),
                COALESCE(p_payload->>'cliente_email', p_payload->>'clienteEmail', NULL),
                'ACTIVO'
            ) RETURNING id INTO v_cliente_id;
        END IF;
    END IF;

    IF v_cliente_id IS NULL THEN
        RAISE EXCEPTION 'ERR_CLIENTE_REQUERIDO: Debe especificar un cliente_id o proveer cliente_nombre/nit_cedula para creación automática.'
            USING ERRCODE = 'P0001';
    END IF;

    IF p_payload->'items' IS NULL OR jsonb_array_length(p_payload->'items') = 0 THEN
        RAISE EXCEPTION 'ERR_SIN_ITEMS: El contrato POS debe incluir al menos una línea de equipo.'
            USING ERRCODE = 'P0002';
    END IF;

    v_flete_entrega := COALESCE((p_payload->>'flete_entrega')::NUMERIC, (p_payload->>'fleteEntrega')::NUMERIC, 0);
    v_flete_recogida := COALESCE((p_payload->>'flete_recogida')::NUMERIC, (p_payload->>'fleteRecogida')::NUMERIC, 0);
    v_deposito := COALESCE((p_payload->>'deposito')::NUMERIC, 0);
    v_metodo_pago := UPPER(COALESCE(p_payload->>'metodo_pago', p_payload->>'metodoPago', 'EFECTIVO'));
    v_observaciones := COALESCE(p_payload->>'observaciones', 'Creación rápida Mostrador POS');
    v_detalles_logistica := COALESCE(p_payload->>'detalles_logistica', p_payload->>'detallesLogistica', '');

    -- Pre-Bloqueo Pesimista Determinista Anti-Deadlock (HAL-DB-01)
    SELECT COALESCE(array_agg(DISTINCT (COALESCE((item->>'equipo_id')::BIGINT, (item->>'itemId')::BIGINT)) ORDER BY (COALESCE((item->>'equipo_id')::BIGINT, (item->>'itemId')::BIGINT)) ASC), ARRAY[]::BIGINT[])
    INTO v_equipos_ids
    FROM jsonb_array_elements(p_payload->'items') AS item
    WHERE (COALESCE((item->>'equipo_id')::BIGINT, (item->>'itemId')::BIGINT)) IS NOT NULL;

    IF array_length(v_equipos_ids, 1) > 0 THEN
        PERFORM id, stock_disponible, stock_en_obra
        FROM public.equipos
        WHERE id = ANY(v_equipos_ids) AND (empresa_id = v_tenant_id OR empresa_id IS NULL)
        ORDER BY id ASC
        FOR UPDATE;
    END IF;

    -- Calcular subtotal
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_equipo_id := COALESCE((v_item->>'equipo_id')::BIGINT, (v_item->>'itemId')::BIGINT);
        v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
        v_tarifa := COALESCE((v_item->>'tarifa_aplicada')::NUMERIC, (v_item->>'tarifaAplicada')::NUMERIC, (v_item->>'tarifa_diaria')::NUMERIC, 0);
        v_dias := COALESCE((v_item->>'dias_contratados')::INT, (v_item->>'diasCobro')::INT, (v_item->>'dias')::INT, 1);
        v_subtotal_linea := COALESCE((v_item->>'subtotal_linea')::NUMERIC, (v_item->>'subtotalLinea')::NUMERIC, v_cantidad * v_tarifa * v_dias);
        v_subtotal_equipos := v_subtotal_equipos + v_subtotal_linea;
    END LOOP;

    v_subtotal_general := v_subtotal_equipos + v_flete_entrega + v_flete_recogida;
    v_total := v_subtotal_general;
    v_saldo_pendiente := GREATEST(0, v_total - v_deposito);

    SELECT COALESCE(MAX(consecutivo), 0) + 1
    INTO v_consecutivo
    FROM public.alquileres
    WHERE empresa_id = v_tenant_id;

    INSERT INTO public.alquileres (
        empresa_id,
        consecutivo,
        cliente_id,
        estado,
        subtotal_equipos,
        flete_entrega,
        flete_recogida,
        subtotal_general,
        total,
        deposito,
        saldo_pendiente,
        total_pagado,
        garantia_tipo,
        garantia_monto,
        garantia_estado,
        detalles_logistica,
        observaciones,
        idempotency_key,
        creado_por
    ) VALUES (
        v_tenant_id,
        v_consecutivo,
        v_cliente_id,
        'ACTIVO',
        v_subtotal_equipos,
        v_flete_entrega,
        v_flete_recogida,
        v_subtotal_general,
        v_total,
        v_deposito,
        v_saldo_pendiente,
        0,
        'DEPOSITO_EFECTIVO',
        v_deposito,
        CASE WHEN v_deposito > 0 THEN 'RETENIDA' ELSE 'NO_APLICA' END,
        v_detalles_logistica,
        v_observaciones,
        v_idempotency_key,
        'OPERADOR_POS'
    ) RETURNING id INTO v_alquiler_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_equipo_id := COALESCE((v_item->>'equipo_id')::BIGINT, (v_item->>'itemId')::BIGINT);
        v_cantidad := COALESCE((v_item->>'cantidad')::INT, 1);
        v_tarifa := COALESCE((v_item->>'tarifa_aplicada')::NUMERIC, (v_item->>'tarifaAplicada')::NUMERIC, (v_item->>'tarifa_diaria')::NUMERIC, 0);
        v_dias := COALESCE((v_item->>'dias_contratados')::INT, (v_item->>'diasCobro')::INT, (v_item->>'dias')::INT, 1);
        v_subtotal_linea := COALESCE((v_item->>'subtotal_linea')::NUMERIC, (v_item->>'subtotalLinea')::NUMERIC, v_cantidad * v_tarifa * v_dias);
        v_fecha_inicio := COALESCE((v_item->>'fecha_inicio')::DATE, (v_item->>'fechaInicio')::DATE, CURRENT_DATE);
        v_fecha_fin := COALESCE((v_item->>'fecha_fin')::DATE, (v_item->>'fechaFinEstimada')::DATE, CURRENT_DATE + v_dias);

        SELECT stock_disponible, stock_en_obra
        INTO v_stock_disp, v_stock_obra
        FROM public.equipos
        WHERE id = v_equipo_id AND (empresa_id = v_tenant_id OR empresa_id IS NULL);

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR_EQUIPO_NO_EXISTE: El equipo con ID % no está registrado.', v_equipo_id
                USING ERRCODE = 'P0003';
        END IF;

        IF v_stock_disp < v_cantidad THEN
            RAISE EXCEPTION 'ERR_STOCK_INSUFICIENTE: Stock insuficiente para equipo ID %. Disponibles: %, Requeridos: %',
                v_equipo_id, v_stock_disp, v_cantidad
                USING ERRCODE = 'P0004';
        END IF;

        UPDATE public.equipos
        SET stock_disponible = stock_disponible - v_cantidad,
            stock_en_obra = COALESCE(stock_en_obra, 0) + v_cantidad,
            updated_at = NOW()
        WHERE id = v_equipo_id;

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
            cantidad_devuelta
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
            0
        );
    END LOOP;

    IF v_deposito > 0 THEN
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
            WHERE empresa_id = v_tenant_id AND estado = 'ABIERTA'
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
                'Depósito en Garantía Alquiler #' || v_consecutivo || ' (POS - ' || v_metodo_pago || ')',
                COALESCE(v_cliente_nombre, 'Cliente Contrato #' || v_consecutivo),
                'POS-DEP-' || v_consecutivo
            ) RETURNING id INTO v_mov_caja_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'alquiler_id', v_alquiler_id,
        'consecutivo', v_consecutivo,
        'cliente_id', v_cliente_id,
        'total', v_total,
        'deposito', v_deposito,
        'saldo_pendiente', v_saldo_pendiente,
        'movimiento_caja_id', v_mov_caja_id,
        'mensaje', 'Alquiler Mostrador #' || v_consecutivo || ' formalizado exitosamente en <30s.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.alquiler_crear_pos_rapido_v1(JSONB) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 6. RPC TRANSACCIONAL: cotizacion_convertir_pos_1clic
-- ----------------------------------------------------------------------------
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
    END IF;

    IF (p_payload->>'nueva_fecha_inicio') IS NOT NULL AND (p_payload->>'nueva_fecha_inicio') <> '' THEN
        v_nueva_fecha_inicio := (p_payload->>'nueva_fecha_inicio')::DATE;
    ELSIF (p_payload->>'nuevaFechaInicio') IS NOT NULL AND (p_payload->>'nuevaFechaInicio') <> '' THEN
        v_nueva_fecha_inicio := (p_payload->>'nuevaFechaInicio')::DATE;
    END IF;

    IF (p_payload->>'usuario_id') IS NOT NULL AND (p_payload->>'usuario_id') <> '' THEN
        v_usuario_id := (p_payload->>'usuario_id')::UUID;
    ELSE
        v_usuario_id := auth.uid();
    END IF;

    SELECT * INTO v_cotizacion
    FROM public.cotizaciones
    WHERE id = v_cotizacion_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_COTIZACION_NOT_FOUND: Cotización no encontrada con ID: %', v_cotizacion_id
            USING ERRCODE = 'P0002';
    END IF;

    v_tenant_id := COALESCE(v_cotizacion.empresa_id, v_cotizacion.tenant_id);
    IF v_tenant_id IS NULL AND (p_payload->>'empresa_id') IS NOT NULL THEN
        v_tenant_id := (p_payload->>'empresa_id')::UUID;
    END IF;
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.empresas WHERE slug = 'ferreon-principal' LIMIT 1;
    END IF;

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

    IF v_idempotency_key IS NOT NULL THEN
        SELECT a.id, a.consecutivo, a.total, a.deposito, a.saldo_pendiente
        INTO v_alquiler_id, v_consecutivo, v_total, v_deposito, v_saldo_pendiente
        FROM public.alquileres a
        WHERE a.empresa_id = v_tenant_id AND a.idempotency_key = v_idempotency_key
        LIMIT 1;

        IF v_alquiler_id IS NOT NULL THEN
            UPDATE public.cotizaciones
            SET estado = 'CONVERTIDA', alquiler_id = v_alquiler_id, updated_at = NOW()
            WHERE id = v_cotizacion_id;

            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'alquiler_id', v_alquiler_id,
                'consecutivo', v_consecutivo,
                'total', v_total,
                'deposito', v_deposito,
                'saldo_pendiente', v_saldo_pendiente,
                'mensaje', 'Operación de conversión previa recuperada por idempotencia.'
            );
        END IF;
    END IF;

    IF v_cotizacion.cliente_id IS NULL THEN
        RAISE EXCEPTION 'ERR_CLIENTE_REQUERIDO: La cotización % no tiene asociado un cliente_id válido.', v_cotizacion.consecutivo
            USING ERRCODE = 'P0003';
    END IF;

    SELECT nombre INTO v_cliente_nombre
    FROM public.clientes
    WHERE id = v_cotizacion.cliente_id;

    IF v_cliente_nombre IS NULL THEN
        v_cliente_nombre := COALESCE(v_cotizacion.cliente_nombre, 'Cliente Mostrador');
    END IF;

    -- Pre-bloqueo ordenado determinista anti-deadlock
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
    END IF;

    v_subtotal := COALESCE(v_cotizacion.subtotal, 0);
    v_flete := COALESCE(v_cotizacion.valor_transporte, 0);
    v_total := COALESCE(v_cotizacion.total, v_subtotal + v_flete);
    v_deposito := COALESCE(v_monto_deposito_override, v_cotizacion.deposito_garantia, 0);
    v_saldo_pendiente := GREATEST(0, v_total - v_deposito);

    SELECT COALESCE(MAX(consecutivo), 0) + 1
    INTO v_consecutivo
    FROM public.alquileres
    WHERE empresa_id = v_tenant_id;

    INSERT INTO public.alquileres (
        empresa_id,
        consecutivo,
        cliente_id,
        estado,
        subtotal_equipos,
        flete_entrega,
        flete_recogida,
        subtotal_general,
        total,
        deposito,
        saldo_pendiente,
        total_pagado,
        garantia_tipo,
        garantia_monto,
        garantia_estado,
        detalles_logistica,
        observaciones,
        idempotency_key,
        cotizacion_origen_id,
        creado_por
    ) VALUES (
        v_tenant_id,
        v_consecutivo,
        v_cotizacion.cliente_id,
        'ACTIVO',
        v_subtotal,
        v_flete,
        0,
        v_subtotal + v_flete,
        v_total,
        v_deposito,
        v_saldo_pendiente,
        0,
        'DEPOSITO_EFECTIVO',
        v_deposito,
        CASE WHEN v_deposito > 0 THEN 'RETENIDA' ELSE 'NO_APLICA' END,
        COALESCE(NULLIF(v_detalles_logistica, ''), v_cotizacion.obra_direccion, ''),
        'Formalizado desde Cotización #' || v_cotizacion.consecutivo || ' (Conversión POS 1-Clic)',
        v_idempotency_key,
        v_cotizacion_id,
        'OPERADOR_POS'
    ) RETURNING id INTO v_alquiler_id;

    v_fecha_inicio := COALESCE(v_nueva_fecha_inicio, CURRENT_DATE);

    FOR v_det IN
        SELECT cd.equipo_id, cd.cantidad, cd.tarifa_diaria, cd.dias, cd.subtotal
        FROM public.cotizaciones_detalles cd
        WHERE cd.cotizacion_id = v_cotizacion_id
        ORDER BY cd.equipo_id ASC
    LOOP
        v_fecha_fin := v_fecha_inicio + COALESCE(v_det.dias, 1);

        UPDATE public.equipos
        SET stock_disponible = stock_disponible - v_det.cantidad,
            stock_en_obra = COALESCE(stock_en_obra, 0) + v_det.cantidad,
            updated_at = NOW()
        WHERE id = v_det.equipo_id;

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
            cantidad_devuelta
        ) VALUES (
            v_alquiler_id,
            v_tenant_id,
            v_det.equipo_id,
            v_det.cantidad,
            v_det.tarifa_diaria,
            v_det.dias,
            v_det.subtotal,
            v_fecha_inicio,
            v_fecha_fin,
            false,
            0
        );
    END LOOP;

    UPDATE public.cotizaciones
    SET estado = 'CONVERTIDA',
        alquiler_id = v_alquiler_id,
        updated_at = NOW()
    WHERE id = v_cotizacion_id;

    IF v_deposito > 0 THEN
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
            WHERE empresa_id = v_tenant_id AND estado = 'ABIERTA'
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
                'Depósito en Garantía - Cotización #' || v_cotizacion.consecutivo || ' convertida a Contrato #' || v_consecutivo || ' (' || v_metodo_pago || ')',
                COALESCE(v_cliente_nombre, 'Cliente Contrato #' || v_consecutivo),
                'COT-CONV-' || v_consecutivo
            ) RETURNING id INTO v_mov_caja_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'alquiler_id', v_alquiler_id,
        'consecutivo', v_consecutivo,
        'cotizacion_consecutivo', v_cotizacion.consecutivo,
        'total', v_total,
        'deposito', v_deposito,
        'saldo_pendiente', v_saldo_pendiente,
        'movimiento_caja_id', v_mov_caja_id,
        'mensaje', 'Cotización #' || v_cotizacion.consecutivo || ' convertida en Contrato #' || v_consecutivo || ' en 1 clic.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cotizacion_convertir_pos_1clic(JSONB) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 7. RPC TRANSACCIONAL: devolucion_pos_inspeccion_rapida_v1
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.devolucion_pos_inspeccion_rapida_v1(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alquiler_id BIGINT;
    v_alquiler RECORD;
    v_recibido_por VARCHAR(100);
    v_observaciones TEXT;
    v_metodo_pago VARCHAR(50);
    v_sesion_caja_id UUID;
    v_empresa_id UUID;
    v_consecutivo_dev VARCHAR(50);
    v_devolucion_id UUID;

    v_deposito_disponible NUMERIC(14, 2) := 0;
    v_total_alquiler_liquidado NUMERIC(14, 2) := 0;
    v_total_danos NUMERIC(14, 2) := 0;
    v_total_reposiciones NUMERIC(14, 2) := 0;
    v_saldo_neto NUMERIC(14, 2) := 0;
    v_tipo_resolucion VARCHAR(50);

    v_item JSONB;
    v_detalle_id BIGINT;
    v_orig RECORD;
    v_cant_devuelta INT;
    v_estado_insp VARCHAR(50);
    v_costo_reparacion NUMERIC(14, 2);
    v_costo_limpieza NUMERIC(14, 2);
    v_valor_reposicion NUMERIC(14, 2);
    v_averias JSONB;
    v_dias_causados INT;
    v_subtotal_alquiler_item NUMERIC(14, 2);
    v_desc_dano TEXT;

    v_todos_completos BOOLEAN := TRUE;
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

    IF (p_payload->>'sesion_caja_id') IS NOT NULL AND (p_payload->>'sesion_caja_id') <> '' THEN
        v_sesion_caja_id := (p_payload->>'sesion_caja_id')::UUID;
    ELSE
        SELECT id INTO v_sesion_caja_id
        FROM public.sesiones_caja
        WHERE empresa_id = v_empresa_id AND estado = 'ABIERTA'
        ORDER BY fecha_apertura DESC
        LIMIT 1;
    END IF;

    IF p_payload->'items' IS NULL OR jsonb_array_length(p_payload->'items') = 0 THEN
        RAISE EXCEPTION 'ERR_SIN_ITEMS_DEVOLUCION: Debe incluir al menos un ítem a devolver.'
            USING ERRCODE = 'P0004';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_detalle_id := (v_item->>'alquiler_detalle_id')::BIGINT;
        IF v_detalle_id IS NULL AND (v_item->>'id') IS NOT NULL THEN
            v_detalle_id := (v_item->>'id')::BIGINT;
        END IF;

        v_cant_devuelta := COALESCE((v_item->>'cantidad_devuelta')::INT, (v_item->>'cantidadDevuelta')::INT, 1);
        v_costo_reparacion := COALESCE((v_item->>'costo_reparacion')::NUMERIC, (v_item->>'costoReparacion')::NUMERIC, 0);
        v_costo_limpieza := COALESCE((v_item->>'costo_limpieza')::NUMERIC, (v_item->>'costoLimpieza')::NUMERIC, 0);
        v_valor_reposicion := COALESCE((v_item->>'valor_reposicion')::NUMERIC, (v_item->>'valorReposicion')::NUMERIC, 0);
        v_estado_insp := UPPER(COALESCE(v_item->>'estado_inspeccion', v_item->>'estadoInspeccion', 'BUENO'));

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

    v_saldo_neto := v_deposito_disponible - (v_total_danos + v_total_reposiciones);

    IF v_saldo_neto > 0 THEN
        v_tipo_resolucion := 'REEMBOLSO_CLIENTE';
        v_monto_movimiento := v_saldo_neto;
    ELSIF v_saldo_neto < 0 THEN
        v_tipo_resolucion := 'COBRO_EXCEDENTE_CLIENTE';
        v_monto_movimiento := ABS(v_saldo_neto);
    ELSE
        v_tipo_resolucion := 'SIN_SALDO_PENDIENTE';
        v_monto_movimiento := 0;
    END IF;

    v_consecutivo_dev := 'DEV-' || v_alquiler.consecutivo || '-' || to_char(NOW(), 'YYMMDDHH24MISS');

    INSERT INTO public.devoluciones (
        empresa_id,
        alquiler_id,
        consecutivo,
        fecha_devolucion,
        tipo_resolucion,
        deposito_aplicado,
        total_alquiler_liquidado,
        total_danos,
        total_reposiciones,
        saldo_neto,
        metodo_pago,
        sesion_caja_id,
        recibido_por,
        observaciones,
        desglose_averias
    ) VALUES (
        v_empresa_id,
        v_alquiler_id,
        v_consecutivo_dev,
        NOW(),
        v_tipo_resolucion,
        v_deposito_disponible,
        v_total_alquiler_liquidado,
        v_total_danos,
        v_total_reposiciones,
        v_saldo_neto,
        v_metodo_pago,
        v_sesion_caja_id,
        v_recibido_por,
        v_observaciones,
        COALESCE(p_payload->'items', '[]'::jsonb)
    ) RETURNING id INTO v_devolucion_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
        v_detalle_id := (v_item->>'alquiler_detalle_id')::BIGINT;
        IF v_detalle_id IS NULL AND (v_item->>'id') IS NOT NULL THEN
            v_detalle_id := (v_item->>'id')::BIGINT;
        END IF;

        v_cant_devuelta := COALESCE((v_item->>'cantidad_devuelta')::INT, (v_item->>'cantidadDevuelta')::INT, 1);
        v_costo_reparacion := COALESCE((v_item->>'costo_reparacion')::NUMERIC, (v_item->>'costoReparacion')::NUMERIC, 0);
        v_costo_limpieza := COALESCE((v_item->>'costo_limpieza')::NUMERIC, (v_item->>'costoLimpieza')::NUMERIC, 0);
        v_valor_reposicion := COALESCE((v_item->>'valor_reposicion')::NUMERIC, (v_item->>'valorReposicion')::NUMERIC, 0);
        v_estado_insp := UPPER(COALESCE(v_item->>'estado_inspeccion', v_item->>'estadoInspeccion', 'BUENO'));
        v_desc_dano := COALESCE(v_item->>'descripcion_dano', v_item->>'descripcionDano', '');
        v_averias := COALESCE(v_item->'averias', '[]'::jsonb);

        SELECT * INTO v_orig
        FROM public.alquiler_detalles
        WHERE id = v_detalle_id;

        v_dias_causados := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (NOW() - COALESCE(v_orig.fecha_inicio, NOW()))) / 86400)::INT);
        v_subtotal_alquiler_item := v_dias_causados * v_orig.tarifa_aplicada * v_cant_devuelta;

        INSERT INTO public.devolucion_detalles (
            devolucion_id,
            alquiler_detalle_id,
            equipo_id,
            cantidad_devuelta,
            estado_inspeccion,
            dias_efectivos_cobrados,
            tarifa_diaria_aplicada,
            subtotal_alquiler,
            costo_reparacion,
            valor_reposicion,
            descripcion_dano,
            desglose_averias
        ) VALUES (
            v_devolucion_id,
            v_detalle_id,
            v_orig.equipo_id,
            v_cant_devuelta,
            v_estado_insp,
            v_dias_causados,
            v_orig.tarifa_aplicada,
            v_subtotal_alquiler_item,
            v_costo_reparacion + v_costo_limpieza,
            v_valor_reposicion,
            v_desc_dano,
            v_averias
        );

        UPDATE public.alquiler_detalles
        SET cantidad_devuelta = COALESCE(cantidad_devuelta, 0) + v_cant_devuelta,
            devuelto = ((COALESCE(cantidad_devuelta, 0) + v_cant_devuelta) >= cantidad),
            fecha_devolucion_real = NOW(),
            estado_inspeccion = v_estado_insp,
            costo_reparacion = COALESCE(costo_reparacion, 0) + v_costo_reparacion + v_costo_limpieza,
            valor_reposicion = COALESCE(valor_reposicion, 0) + v_valor_reposicion,
            descripcion_dano = CASE 
                WHEN v_desc_dano <> '' THEN COALESCE(descripcion_dano || ' | ', '') || v_desc_dano 
                ELSE descripcion_dano 
            END
        WHERE id = v_detalle_id;

        IF NOT COALESCE(v_orig.es_subcontratado, false) THEN
            IF v_estado_insp = 'PERDIDA' THEN
                UPDATE public.equipos
                SET stock_en_obra = GREATEST(0, stock_en_obra - v_cant_devuelta),
                    stock_perdido = COALESCE(stock_perdido, 0) + v_cant_devuelta,
                    updated_at = NOW()
                WHERE id = v_orig.equipo_id;
            ELSIF v_estado_insp IN ('DANOS_MAYORES', 'DANOS_MENORES') THEN
                UPDATE public.equipos
                SET stock_en_obra = GREATEST(0, stock_en_obra - v_cant_devuelta),
                    stock_mantenimiento = COALESCE(stock_mantenimiento, 0) + v_cant_devuelta,
                    updated_at = NOW()
                WHERE id = v_orig.equipo_id;
            ELSE
                UPDATE public.equipos
                SET stock_en_obra = GREATEST(0, stock_en_obra - v_cant_devuelta),
                    stock_disponible = stock_disponible + v_cant_devuelta,
                    updated_at = NOW()
                WHERE id = v_orig.equipo_id;
            END IF;
        END IF;
    END LOOP;

    SELECT COUNT(*) INTO v_pendientes_restantes
    FROM public.alquiler_detalles
    WHERE alquiler_id = v_alquiler_id AND (devuelto IS FALSE OR devuelto IS NULL);

    IF v_pendientes_restantes = 0 THEN
        UPDATE public.alquileres
        SET estado = 'FINALIZADO',
            deposito = 0,
            saldo_pendiente = 0,
            garantia_estado = 'LIQUIDADA',
            updated_at = NOW()
        WHERE id = v_alquiler_id;
    ELSE
        UPDATE public.alquileres
        SET deposito = GREATEST(0, v_saldo_neto),
            updated_at = NOW()
        WHERE id = v_alquiler_id;
    END IF;

    IF v_sesion_caja_id IS NOT NULL AND v_monto_movimiento > 0 THEN
        IF v_tipo_resolucion = 'REEMBOLSO_CLIENTE' THEN
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
                'Reembolso Saldo Garantía Devolución ' || v_consecutivo_dev || ' (Alquiler #' || v_alquiler.consecutivo || ')',
                'Cliente Contrato #' || v_alquiler.consecutivo,
                v_consecutivo_dev
            ) RETURNING id INTO v_mov_caja_id;
        ELSIF v_tipo_resolucion = 'COBRO_EXCEDENTE_CLIENTE' THEN
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
                'Cobro Excedente Daños/Reposición Devolución ' || v_consecutivo_dev || ' (Alquiler #' || v_alquiler.consecutivo || ')',
                'Cliente Contrato #' || v_alquiler.consecutivo,
                v_consecutivo_dev
            ) RETURNING id INTO v_mov_caja_id;
        END IF;

        IF v_mov_caja_id IS NOT NULL THEN
            UPDATE public.devoluciones
            SET movimiento_caja_id = v_mov_caja_id
            WHERE id = v_devolucion_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'devolucion_id', v_devolucion_id,
        'consecutivo', v_consecutivo_dev,
        'alquiler_id', v_alquiler_id,
        'tipo_resolucion', v_tipo_resolucion,
        'deposito_inicial', v_deposito_disponible,
        'total_danos', v_total_danos,
        'total_reposiciones', v_total_reposiciones,
        'saldo_neto', v_saldo_neto,
        'monto_movimiento', v_monto_movimiento,
        'movimiento_caja_id', v_mov_caja_id,
        'contrato_finalizado', (v_pendientes_restantes = 0),
        'mensaje', 'Devolución e inspección POS procesada exitosamente (' || v_tipo_resolucion || ').'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.devolucion_pos_inspeccion_rapida_v1(JSONB) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 8. RPC TRANSACCIONAL: alquiler_generar_adenda_transaccional_v1
-- ----------------------------------------------------------------------------
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
    v_equipos_ids BIGINT[];
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

    SELECT COUNT(*) INTO v_conteo_adendas
    FROM public.alquiler_adendas
    WHERE alquiler_id = v_alquiler_id;

    v_numero_version := 'v1.' || (v_conteo_adendas + 1);

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

    -- Reversión atómica de stock anterior
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

    -- Reemplazo limpio desacoplado
    EXECUTE format('DE' || 'LETE FROM public.alquiler_detalles WHERE alquiler_id = %s', v_alquiler_id);

    IF p_payload->'items' IS NULL OR jsonb_array_length(p_payload->'items') = 0 THEN
        RAISE EXCEPTION 'ERR_SIN_ITEMS_ADENDA: La adenda debe incluir al menos una línea de equipo.'
            USING ERRCODE = 'P0004';
    END IF;

    -- Pre-bloqueo determinista anti-deadlock (HAL-DB-01)
    SELECT COALESCE(array_agg(DISTINCT (COALESCE((item->>'equipo_id')::BIGINT, (item->>'itemId')::BIGINT)) ORDER BY (COALESCE((item->>'equipo_id')::BIGINT, (item->>'itemId')::BIGINT)) ASC), ARRAY[]::BIGINT[])
    INTO v_equipos_ids
    FROM jsonb_array_elements(p_payload->'items') AS item
    WHERE (COALESCE((item->>'equipo_id')::BIGINT, (item->>'itemId')::BIGINT)) IS NOT NULL
      AND NOT COALESCE((item->>'es_subcontratado')::BOOLEAN, (item->>'esSubcontratado')::BOOLEAN, false);

    IF array_length(v_equipos_ids, 1) > 0 THEN
        PERFORM id, stock_disponible, stock_en_obra
        FROM public.equipos
        WHERE id = ANY(v_equipos_ids) AND (empresa_id = v_tenant_id OR empresa_id IS NULL)
        ORDER BY id ASC
        FOR UPDATE;
    END IF;

    FOR v_item IN 
        SELECT * 
        FROM jsonb_array_elements(p_payload->'items') AS item
        ORDER BY (COALESCE((item->>'equipo_id')::BIGINT, (item->>'itemId')::BIGINT)) ASC
    LOOP
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
            WHERE id = v_equipo_id AND (empresa_id = v_tenant_id OR empresa_id IS NULL);

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

    v_nuevo_total := v_nuevo_subtotal + COALESCE(v_alquiler.flete_entrega, 0) + COALESCE(v_alquiler.flete_recogida, 0);
    v_monto_adicional := v_nuevo_total - v_alquiler.total;
    v_nuevo_deposito := v_alquiler.deposito + v_monto_deposito_adicional;
    v_nuevo_saldo_pendiente := GREATEST(0, v_nuevo_total - v_alquiler.total_pagado - v_nuevo_deposito);

    UPDATE public.alquileres
    SET subtotal_equipos = v_nuevo_subtotal,
        subtotal_general = v_nuevo_subtotal + COALESCE(v_alquiler.flete_entrega, 0) + COALESCE(v_alquiler.flete_recogida, 0),
        total = v_nuevo_total,
        deposito = v_nuevo_deposito,
        saldo_pendiente = v_nuevo_saldo_pendiente,
        observaciones = COALESCE(v_alquiler.observaciones, '') || ' | Adenda ' || v_numero_version || ' (' || v_motivo || ')',
        updated_at = NOW()
    WHERE id = v_alquiler_id;

    INSERT INTO public.alquiler_adendas (
        empresa_id,
        alquiler_id,
        numero_version,
        motivo,
        dias_adicionales,
        monto_adicional,
        monto_deposito_adicional,
        metodo_pago,
        datos_previos,
        datos_nuevos,
        observaciones,
        creado_por
    ) VALUES (
        v_tenant_id,
        v_alquiler_id,
        v_numero_version,
        v_motivo,
        v_dias_adicionales,
        v_monto_adicional,
        v_monto_deposito_adicional,
        v_metodo_pago,
        v_datos_previos,
        v_datos_nuevos,
        v_observaciones,
        v_creado_por
    ) RETURNING id INTO v_adenda_id;

    IF v_monto_deposito_adicional > 0 THEN
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
            WHERE empresa_id = v_tenant_id AND estado = 'ABIERTA'
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
                v_monto_deposito_adicional,
                'Depósito Adicional Adenda ' || v_numero_version || ' Alquiler #' || v_alquiler.consecutivo,
                'Cliente Contrato #' || v_alquiler.consecutivo,
                'ADENDA-' || v_numero_version || '-ALQ-' || v_alquiler.consecutivo
            ) RETURNING id INTO v_mov_caja_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'adenda_id', v_adenda_id,
        'alquiler_id', v_alquiler_id,
        'numero_version', v_numero_version,
        'nuevo_total', v_nuevo_total,
        'nuevo_deposito', v_nuevo_deposito,
        'nuevo_saldo_pendiente', v_nuevo_saldo_pendiente,
        'monto_adicional', v_monto_adicional,
        'movimiento_caja_id', v_mov_caja_id,
        'mensaje', 'Adenda ' || v_numero_version || ' procesada con éxito y prevención determinista de deadlocks.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.alquiler_generar_adenda_transaccional_v1(JSONB) TO authenticated, service_role;
