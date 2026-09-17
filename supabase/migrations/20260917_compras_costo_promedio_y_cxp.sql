-- ==============================================================================
-- Migración: 20260917_compras_costo_promedio_y_cxp.sql
-- Propósito: Implementación de Valuación de Inventarios por Costo Promedio Ponderado (PMP),
--            Kardex Valorizado, Cartera de Proveedores / Cuentas por Pagar (CXP),
--            Abonos a Proveedores con Comprobante de Egreso y Procedimiento Transaccional
--            Pesimista (SELECT FOR UPDATE) anti-deadlocks.
-- Fecha: 2026-09-17
-- ==============================================================================

BEGIN;

-- 1. Ampliación de la tabla `equipos` para Valuación Patrimonial PMP
ALTER TABLE public.equipos 
  ADD COLUMN IF NOT EXISTS costo_promedio BIGINT DEFAULT 0 CHECK (costo_promedio >= 0),
  ADD COLUMN IF NOT EXISTS ultimo_costo_compra BIGINT DEFAULT 0 CHECK (ultimo_costo_compra >= 0);

-- Inicializar costo_promedio en equipos existentes que estén en 0 usando valor_reposicion
UPDATE public.equipos 
SET costo_promedio = COALESCE(ROUND(valor_reposicion), 0),
    ultimo_costo_compra = COALESCE(ROUND(valor_reposicion), 0)
WHERE (costo_promedio IS NULL OR costo_promedio = 0) AND valor_reposicion IS NOT NULL AND valor_reposicion > 0;

-- 2. Ampliación de la tabla `kardex_inventario` para Costeo Valorizado
ALTER TABLE public.kardex_inventario 
  ADD COLUMN IF NOT EXISTS costo_unitario BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_total BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_promedio_resultante BIGINT DEFAULT 0;

-- 3. Ampliación de las tablas `compras` y `compras_detalles`
ALTER TABLE public.compras 
  ADD COLUMN IF NOT EXISTS remision_factura_proveedor VARCHAR,
  ADD COLUMN IF NOT EXISTS fecha_recepcion_bodega TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bodeguero_id UUID;

ALTER TABLE public.compras_detalles 
  ADD COLUMN IF NOT EXISTS cantidad_recibida INTEGER DEFAULT 0;

-- 4. Creación de la tabla `proveedor_cuentas_pagar`
CREATE TABLE IF NOT EXISTS public.proveedor_cuentas_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID,
    compra_id UUID NOT NULL REFERENCES public.compras(id) ON DELETE RESTRICT,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE RESTRICT,
    numero_orden VARCHAR NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    monto_total BIGINT NOT NULL CHECK (monto_total >= 0),
    saldo_pendiente BIGINT NOT NULL CHECK (saldo_pendiente >= 0),
    estado VARCHAR NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ABONADA_PARCIAL', 'PAGADA', 'ANULADA')),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de alto rendimiento para Cartera de Proveedores
CREATE INDEX IF NOT EXISTS idx_cxp_tenant_empresa ON public.proveedor_cuentas_pagar (tenant_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_cxp_proveedor ON public.proveedor_cuentas_pagar (proveedor_id);
CREATE INDEX IF NOT EXISTS idx_cxp_estado_vencimiento ON public.proveedor_cuentas_pagar (estado, fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_cxp_compra ON public.proveedor_cuentas_pagar (compra_id);

-- 5. Creación de la tabla `proveedor_abonos_cxp`
CREATE TABLE IF NOT EXISTS public.proveedor_abonos_cxp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID,
    cuenta_pagar_id UUID NOT NULL REFERENCES public.proveedor_cuentas_pagar(id) ON DELETE CASCADE,
    numero_comprobante VARCHAR NOT NULL, -- Ej: CE-2026-0001
    fecha_abono DATE NOT NULL DEFAULT CURRENT_DATE,
    monto_abono BIGINT NOT NULL CHECK (monto_abono > 0),
    metodo_pago VARCHAR NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE')),
    sesion_caja_id UUID REFERENCES public.sesiones_caja(id) ON DELETE SET NULL,
    referencia_bancaria VARCHAR,
    observaciones TEXT,
    usuario_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abonos_cxp_cuenta ON public.proveedor_abonos_cxp (cuenta_pagar_id);
CREATE INDEX IF NOT EXISTS idx_abonos_cxp_fecha ON public.proveedor_abonos_cxp (fecha_abono DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.proveedor_cuentas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedor_abonos_cxp ENABLE ROW LEVEL SECURITY;

-- Políticas RLS Permisivas para usuarios autenticados y service_role
DO $$
BEGIN
    DROP POLICY IF EXISTS "cxp_authenticated_policy" ON public.proveedor_cuentas_pagar;
    CREATE POLICY "cxp_authenticated_policy" ON public.proveedor_cuentas_pagar
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "cxp_service_role_policy" ON public.proveedor_cuentas_pagar;
    CREATE POLICY "cxp_service_role_policy" ON public.proveedor_cuentas_pagar
        FOR ALL TO service_role USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "abonos_authenticated_policy" ON public.proveedor_abonos_cxp;
    CREATE POLICY "abonos_authenticated_policy" ON public.proveedor_abonos_cxp
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "abonos_service_role_policy" ON public.proveedor_abonos_cxp;
    CREATE POLICY "abonos_service_role_policy" ON public.proveedor_abonos_cxp
        FOR ALL TO service_role USING (true) WITH CHECK (true);
END $$;

-- 6. Procedimiento Almacenado Transaccional Pesimista
-- Recibe una orden de compra en bodega, recalcula el Costo Promedio Ponderado
-- de forma matemática, genera Kardex y crea la Cuenta por Pagar si es a Crédito.
CREATE OR REPLACE FUNCTION public.recibir_compra_y_actualizar_pmp_transaccional(
    p_compra_id UUID,
    p_usuario_id UUID,
    p_remision_factura VARCHAR DEFAULT NULL,
    p_observaciones_bodega TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_compra RECORD;
    v_detalle RECORD;
    v_equipo_ids BIGINT[];
    v_nuevo_stock_total INTEGER;
    v_nuevo_stock_disponible INTEGER;
    v_costo_promedio_actual BIGINT;
    v_costo_promedio_nuevo BIGINT;
    v_valor_inventario_previo NUMERIC;
    v_valor_compra_nueva NUMERIC;
    v_dias_credito INTEGER := 30;
    v_fecha_vencimiento DATE;
    v_cxp_id UUID;
BEGIN
    -- 1. Validar existencia y estado de la compra
    SELECT * INTO v_compra
    FROM public.compras
    WHERE id = p_compra_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'La orden de compra especificada no existe.');
    END IF;

    IF v_compra.estado = 'COMPLETADA' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta orden de compra ya fue recibida y liquidada previamente.');
    END IF;

    IF v_compra.estado = 'ANULADA' THEN
        RETURN jsonb_build_object('success', false, 'error', 'No se puede recibir una orden de compra anulada.');
    END IF;

    -- 2. Recolectar todos los equipo_id involucrados para bloqueo pesimista ordenado
    SELECT ARRAY_AGG(equipo_id ORDER BY equipo_id ASC)
    INTO v_equipo_ids
    FROM public.compras_detalles
    WHERE compra_id = p_compra_id;

    IF v_equipo_ids IS NULL OR ARRAY_LENGTH(v_equipo_ids, 1) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'La orden de compra no contiene equipos en su detalle.');
    END IF;

    -- 3. Bloqueo pesimista ordenado anti-deadlocks
    PERFORM 1
    FROM public.equipos
    WHERE id = ANY(v_equipo_ids)
    ORDER BY id ASC
    FOR UPDATE;

    -- 4. Procesar cada equipo: actualizar existencias, PMP y Kardex
    FOR v_detalle IN
        SELECT cd.*, e.stock_total, e.stock_disponible, COALESCE(e.costo_promedio, 0) AS costo_promedio
        FROM public.compras_detalles cd
        JOIN public.equipos e ON e.id = cd.equipo_id
        WHERE cd.compra_id = p_compra_id
        ORDER BY cd.equipo_id ASC
    LOOP
        v_costo_promedio_actual := v_detalle.costo_promedio;

        -- Cálculo del Costo Promedio Ponderado (PMP):
        -- Si el stock previo es <= 0, el costo promedio toma el precio unitario de la compra
        IF v_detalle.stock_total <= 0 THEN
            v_costo_promedio_nuevo := ROUND(v_detalle.precio_unitario);
        ELSE
            v_valor_inventario_previo := (v_detalle.stock_total::NUMERIC * v_costo_promedio_actual::NUMERIC);
            v_valor_compra_nueva := (v_detalle.cantidad::NUMERIC * v_detalle.precio_unitario::NUMERIC);
            v_costo_promedio_nuevo := ROUND((v_valor_inventario_previo + v_valor_compra_nueva) / (v_detalle.stock_total + v_detalle.cantidad));
        END IF;

        -- Nuevos stocks
        v_nuevo_stock_total := v_detalle.stock_total + v_detalle.cantidad;
        v_nuevo_stock_disponible := v_detalle.stock_disponible + v_detalle.cantidad;

        -- Actualizar registro del equipo
        UPDATE public.equipos
        SET stock_total = v_nuevo_stock_total,
            stock_disponible = v_nuevo_stock_disponible,
            costo_promedio = v_costo_promedio_nuevo,
            ultimo_costo_compra = ROUND(v_detalle.precio_unitario),
            updated_at = now()
        WHERE id = v_detalle.equipo_id;

        -- Marcar cantidad recibida en el detalle
        UPDATE public.compras_detalles
        SET cantidad_recibida = v_detalle.cantidad
        WHERE id = v_detalle.id;

        -- Inserción inmutable en Kardex con costo unitario, costo total y PMP resultante
        INSERT INTO public.kardex_inventario (
            equipo_id,
            tenant_id,
            empresa_id,
            tipo_movimiento,
            cantidad_delta,
            stock_resultante,
            costo_unitario,
            costo_total,
            costo_promedio_resultante,
            motivo,
            referencia_documento,
            usuario_id,
            creado_en
        ) VALUES (
            v_detalle.equipo_id,
            v_compra.tenant_id,
            v_compra.empresa_id,
            'INGRESO_COMPRA',
            v_detalle.cantidad,
            v_nuevo_stock_disponible,
            ROUND(v_detalle.precio_unitario),
            ROUND(v_detalle.cantidad::NUMERIC * v_detalle.precio_unitario::NUMERIC),
            v_costo_promedio_nuevo,
            COALESCE(p_observaciones_bodega, 'Recepción en Bodega - Orden ' || v_compra.numero_orden || ' - Proveedor: ' || v_compra.proveedor_nombre),
            v_compra.numero_orden,
            COALESCE(p_usuario_id::TEXT, 'SISTEMA'),
            now()
        );
    END LOOP;

    -- 5. Si la compra es a CREDITO, crear o actualizar la Cuenta por Pagar (CXP)
    IF v_compra.metodo_pago = 'CREDITO' THEN
        -- Buscar días de crédito pactados con el proveedor
        IF v_compra.proveedor_id IS NOT NULL THEN
            SELECT COALESCE(dias_credito, 30) INTO v_dias_credito
            FROM public.proveedores
            WHERE id = v_compra.proveedor_id;
            IF NOT FOUND THEN
                v_dias_credito := 30;
            END IF;
        END IF;

        v_fecha_vencimiento := (COALESCE(v_compra.fecha_compra, CURRENT_DATE) + (v_dias_credito || ' days')::INTERVAL)::DATE;

        -- Insertar en proveedor_cuentas_pagar si no existe
        INSERT INTO public.proveedor_cuentas_pagar (
            tenant_id,
            empresa_id,
            compra_id,
            proveedor_id,
            numero_orden,
            fecha_emision,
            fecha_vencimiento,
            monto_total,
            saldo_pendiente,
            estado,
            observaciones,
            created_at,
            updated_at
        ) VALUES (
            v_compra.tenant_id,
            v_compra.empresa_id,
            v_compra.id,
            v_compra.proveedor_id,
            v_compra.numero_orden,
            COALESCE(v_compra.fecha_compra, CURRENT_DATE),
            v_fecha_vencimiento,
            ROUND(v_compra.neto_pagar),
            ROUND(v_compra.neto_pagar),
            'PENDIENTE',
            'Generado automáticamente por recepción de compra a crédito ' || v_compra.numero_orden,
            now(),
            now()
        )
        RETURNING id INTO v_cxp_id;
    END IF;

    -- 6. Actualizar estado de la compra a COMPLETADA
    UPDATE public.compras
    SET estado = 'COMPLETADA',
        fecha_recepcion_bodega = now(),
        bodeguero_id = p_usuario_id,
        remision_factura_proveedor = COALESCE(p_remision_factura, remision_factura_proveedor)
    WHERE id = p_compra_id;

    RETURN jsonb_build_object(
        'success', true,
        'compra_id', p_compra_id,
        'numero_orden', v_compra.numero_orden,
        'equipos_actualizados', ARRAY_LENGTH(v_equipo_ids, 1),
        'cxp_generada', (v_compra.metodo_pago = 'CREDITO'),
        'cxp_id', v_cxp_id,
        'mensaje', 'Compra recibida satisfactoriamente en bodega. Stock, PMP y Kardex actualizados.'
    );
END;
$$;

COMMIT;
