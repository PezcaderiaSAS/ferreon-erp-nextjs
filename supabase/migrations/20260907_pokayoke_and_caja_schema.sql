-- ============================================================================
-- Migración Poka-Yoke & Caja (Kardex, Sesiones de Caja, y Candados Concurrentes)
-- ============================================================================

-- 1. Candado Optimista para Overbooking (Alquileres)
-- Función RPC para descontar stock atómicamente y revertir error si no hay suficiente.
CREATE OR REPLACE FUNCTION reducir_stock_seguro(
    p_equipo_id BIGINT,
    p_cantidad_requerida INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_actual INT;
BEGIN
    -- Bloquear la fila para actualización
    SELECT stock_disponible INTO v_stock_actual 
    FROM public.equipos 
    WHERE id = p_equipo_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Equipo no encontrado (ID: %)', p_equipo_id;
    END IF;

    IF v_stock_actual < p_cantidad_requerida THEN
        RAISE EXCEPTION 'STOCK_INSUFICIENTE: Intento de overbooking detectado (Requerido: %, Disponible: %)', p_cantidad_requerida, v_stock_actual;
    END IF;

    -- Actualizar stock
    UPDATE public.equipos 
    SET 
        stock_disponible = stock_disponible - p_cantidad_requerida,
        stock_en_obra = stock_en_obra + p_cantidad_requerida,
        updated_at = NOW()
    WHERE id = p_equipo_id;

    RETURN TRUE;
END;
$$;

-- 2. Trazabilidad de Bodega (Kardex Append-Only)
CREATE TABLE IF NOT EXISTS public.kardex_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipo_id BIGINT NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    tenant_id UUID,
    tipo_movimiento VARCHAR(50) NOT NULL, -- 'INGRESO_COMPRA', 'BAJA_DANO', 'AJUSTE_AUDITORIA', 'ALQUILER_SALIDA', 'DEVOLUCION_ENTRADA'
    cantidad_delta INT NOT NULL, -- Valores positivos o negativos (+2, -1)
    stock_resultante INT NOT NULL,
    motivo TEXT,
    referencia_documento VARCHAR(100), -- Ej. Número de factura de compra o ID de contrato
    usuario_id UUID NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en kardex
ALTER TABLE public.kardex_inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own kardex" ON public.kardex_inventario FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IS NULL);
CREATE POLICY "Tenants can insert own kardex" ON public.kardex_inventario FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL);

-- 3. Punto de Venta (POS) y Sesiones de Caja
CREATE TABLE IF NOT EXISTS public.sesiones_caja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    usuario_id UUID NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA', -- 'ABIERTA', 'CERRADA'
    monto_apertura DECIMAL(12,2) NOT NULL DEFAULT 0,
    monto_cierre DECIMAL(12,2),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    observaciones TEXT
);

-- RLS Sesiones Caja
ALTER TABLE public.sesiones_caja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can manage own sesiones_caja" ON public.sesiones_caja FOR ALL USING (tenant_id = auth.uid() OR tenant_id IS NULL);

-- Modificar pagos para agregar Cash management
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos' AND column_name='efectivo_recibido') THEN
        ALTER TABLE public.pagos ADD COLUMN efectivo_recibido DECIMAL(12,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos' AND column_name='cambio_entregado') THEN
        ALTER TABLE public.pagos ADD COLUMN cambio_entregado DECIMAL(12,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos' AND column_name='sesion_caja_id') THEN
        ALTER TABLE public.pagos ADD COLUMN sesion_caja_id UUID REFERENCES public.sesiones_caja(id);
    END IF;
END $$;
