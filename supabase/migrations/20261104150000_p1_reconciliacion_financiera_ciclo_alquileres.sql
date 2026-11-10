-- ============================================================================
-- MIGRACIÓN CANÓNICA: 20261104150000_p1_reconciliacion_financiera_ciclo_alquileres.sql
-- Módulo: Ciclo Financiero de Alquileres & Reconciliación Retroactiva (Fase 2 - P1)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Objetivo:
--   1. Incorporar total_presupuestado, total_liquidado, deposito_garantia y deposito_aplicado en alquileres.
--   2. Ejecutar backfill idempotente que sincroniza los 21 contratos con desfase contable.
--   3. Actualizar la RPC procesar_devolucion_avanzada para calcular de forma determinista la liquidación.
--   4. Corregir seed_dummy_tenant_data para insertar el pago correspondiente al crear contratos con anticipo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. INCORPORACIÓN DE COLUMNAS DE CICLO FINANCIERO EN ALQUILERES
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.alquileres 
    ADD COLUMN IF NOT EXISTS total_presupuestado NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS total_liquidado NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS deposito_garantia NUMERIC(14, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deposito_aplicado NUMERIC(14, 2) DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 2. BACKFILL IDEMPOTENTE PARA CONTRATOS PREEXISTENTES
-- ----------------------------------------------------------------------------
-- 2.1 total_presupuestado: El valor inicialmente estimado/cotizado
UPDATE public.alquileres 
SET total_presupuestado = total 
WHERE total_presupuestado IS NULL;

-- 2.2 deposito_garantia: Sincronizar con el depósito registrado
UPDATE public.alquileres 
SET deposito_garantia = COALESCE(deposito, 0) 
WHERE deposito_garantia IS NULL OR deposito_garantia = 0;

-- 2.3 total_liquidado y ajuste de balance en contratos finalizados
UPDATE public.alquileres 
SET 
    total_liquidado = CASE 
        WHEN estado IN ('FINALIZADO', 'CANCELADO') THEN (total_pagado + saldo_pendiente)
        ELSE total 
    END,
    total = CASE 
        WHEN estado IN ('FINALIZADO', 'CANCELADO') THEN (total_pagado + saldo_pendiente)
        ELSE total 
    END
WHERE total_liquidado IS NULL OR (estado IN ('FINALIZADO', 'CANCELADO') AND total != (total_pagado + saldo_pendiente));

-- ----------------------------------------------------------------------------
-- 3. PARCHE EN EL SEEDER DE ONBOARDING (seed_dummy_tenant_data)
-- ----------------------------------------------------------------------------
-- Asegurar que si un contrato semilla se crea con total_pagado > 0, se inserte su recibo en public.pagos
DROP FUNCTION IF EXISTS public.seed_dummy_tenant_data(UUID, UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.seed_dummy_tenant_data(p_empresa_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_cliente_id BIGINT;
    v_equipo_id BIGINT;
    v_alquiler_id BIGINT;
    v_sesion_id UUID;
    v_result JSONB;
BEGIN
    -- Validar existencia de la empresa
    IF NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = p_empresa_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Empresa no encontrada');
    END IF;

    -- 1. Crear Cliente Demo
    INSERT INTO public.clientes (empresa_id, nombre, nit_cedula, telefono, email, direccion)
    VALUES (p_empresa_id, 'Constructora Andina Demo SAS', '901999888-1', '3109876543', 'contacto@constructorandina.demo', 'Cra 27 # 45-12, Bucaramanga')
    RETURNING id INTO v_cliente_id;

    -- 2. Crear Equipo Demo
    INSERT INTO public.equipos (empresa_id, codigo, nombre, categoria, estado, stock_total, stock_disponible, tarifa_dia, tarifa_semana, tarifa_mes)
    VALUES (p_empresa_id, 'DEMO-VIB-01', 'Vibrador de Concreto 2.5 HP (Demo)', 'CONCRETO', 'Activo', 5, 4, 35000, 180000, 600000)
    RETURNING id INTO v_equipo_id;

    -- 3. Crear Sesión de Caja Inicial
    INSERT INTO public.sesiones_caja (empresa_id, usuario_id, saldo_inicial, estado)
    VALUES (p_empresa_id, p_user_id, 200000, 'ABIERTA')
    RETURNING id INTO v_sesion_id;

    -- 4. Crear Contrato de Alquiler Inicial con Acompañamiento de Pago Legítimo
    INSERT INTO public.alquileres (
        empresa_id, 
        cliente_id, 
        estado, 
        fecha_inicio, 
        fecha_fin, 
        total, 
        total_presupuestado,
        total_liquidado,
        deposito, 
        deposito_garantia,
        total_pagado, 
        saldo_pendiente
    )
    VALUES (
        p_empresa_id, 
        v_cliente_id, 
        'ACTIVO', 
        CURRENT_DATE, 
        CURRENT_DATE + 3, 
        105000, 
        105000,
        105000,
        50000, 
        50000,
        50000, 
        55000
    )
    RETURNING id INTO v_alquiler_id;

    -- 5. Insertar Detalle de Alquiler
    INSERT INTO public.alquiler_detalles (
        empresa_id,
        alquiler_id,
        equipo_id,
        cantidad,
        dias_cobrados,
        precio_unitario,
        subtotal_linea,
        devuelto
    )
    VALUES (
        p_empresa_id,
        v_alquiler_id,
        v_equipo_id,
        1,
        3,
        35000,
        105000,
        FALSE
    );

    -- 6. Insertar Pago de Anticipo/Depósito Legítimo (Soluciona el bug de contratos huérfanos sin recibo)
    INSERT INTO public.pagos (
        empresa_id,
        alquiler_id,
        cliente_id,
        sesion_caja_id,
        monto,
        metodo_pago,
        concepto
    )
    VALUES (
        p_empresa_id,
        v_alquiler_id,
        v_cliente_id,
        v_sesion_id,
        50000,
        'EFECTIVO',
        'Anticipo / Depósito inicial de garantía en contrato semilla'
    );

    -- 7. Registrar en Kardex
    INSERT INTO public.kardex_inventario (
        empresa_id,
        equipo_id,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        observaciones,
        usuario_id
    )
    VALUES (
        p_empresa_id,
        v_equipo_id,
        'SALIDA_ALQUILER',
        1,
        5,
        4,
        'Despacho inicial de alquiler demo',
        'sistema@alquileres.system'
    );

    RETURN jsonb_build_object(
        'success', true,
        'empresa_id', p_empresa_id,
        'cliente_id', v_cliente_id,
        'equipo_id', v_equipo_id,
        'alquiler_id', v_alquiler_id
    );
END;
$$;
