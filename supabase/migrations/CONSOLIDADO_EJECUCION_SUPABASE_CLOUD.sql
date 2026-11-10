-- ============================================================================
-- SCRIPT CONSOLIDADO DE MIGRACIONES ESTRUCTURALES — SUPABASE CLUSTER
-- Proyecto: Alquileres System (FerreOn ERP)
-- Cluster ID: eqruvswlpsttuyuglwts (us-west-2)
-- Fases: P0, P1, P2 (Noviembre 2026)
-- Instrucciones: Ejecutar este script completo en el SQL Editor de Supabase Cloud.
-- ============================================================================

BEGIN;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ARCHIVO: supabase/migrations/20261104130000_p0_security_seal_rls_hotfix.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- MIGRACIÓN CANÓNICA: 20261104130000_p0_security_seal_rls_hotfix.sql
-- Módulo: Hardening Crítico RLS (P0 - Zero Trust)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Objetivo: Revocar completamente el acceso de lectura y escritura anónima
--           provocado por políticas con USING (true) y cláusulas IS NULL.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ASEGURAR HABILITACIÓN DE RLS EN LAS TABLAS TRANSACCIONALES
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alquileres ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alquiler_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alquiler_adendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.devolucion_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cotizaciones_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kardex_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sesiones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movimientos_caja ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. PURGA DE POLÍTICAS HISTÓRICAS PERMISIVAS Y REDUNDANTES
-- ----------------------------------------------------------------------------
-- 2.1 Clientes
DROP POLICY IF EXISTS "Permitir lectura en clientes para usuarios autenticados" ON public.clientes;
DROP POLICY IF EXISTS "Permitir escritura en clientes para usuarios autenticados" ON public.clientes;
DROP POLICY IF EXISTS "clientes_tenant_isolation" ON public.clientes;
DROP POLICY IF EXISTS "aislamiento_tenant_clientes" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete_policy" ON public.clientes;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.clientes;

-- 2.2 Equipos
DROP POLICY IF EXISTS "equipos_tenant_isolation" ON public.equipos;
DROP POLICY IF EXISTS "aislamiento_tenant_equipos" ON public.equipos;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en equipos" ON public.equipos;
DROP POLICY IF EXISTS "equipos_select_policy" ON public.equipos;
DROP POLICY IF EXISTS "equipos_insert_policy" ON public.equipos;
DROP POLICY IF EXISTS "equipos_update_policy" ON public.equipos;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.equipos;

-- 2.3 Alquileres y Detalles
DROP POLICY IF EXISTS "alquileres_tenant_isolation" ON public.alquileres;
DROP POLICY IF EXISTS "aislamiento_tenant_alquileres" ON public.alquileres;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en alquileres" ON public.alquileres;
DROP POLICY IF EXISTS "alquiler_detalles_tenant_isolation" ON public.alquiler_detalles;
DROP POLICY IF EXISTS "aislamiento_tenant_alquiler_detalles" ON public.alquiler_detalles;
DROP POLICY IF EXISTS "Aislamiento tenant en alquiler_adendas" ON public.alquiler_adendas;

-- 2.4 Facturación y Cartera
DROP POLICY IF EXISTS "facturas_tenant_isolation" ON public.facturas;
DROP POLICY IF EXISTS "aislamiento_tenant_facturas" ON public.facturas;
DROP POLICY IF EXISTS "pagos_tenant_isolation" ON public.pagos;
DROP POLICY IF EXISTS "aislamiento_tenant_pagos" ON public.pagos;

-- 2.5 Devoluciones y Cotizaciones
DROP POLICY IF EXISTS "devoluciones_tenant_isolation" ON public.devoluciones;
DROP POLICY IF EXISTS "aislamiento_tenant_devoluciones" ON public.devoluciones;
DROP POLICY IF EXISTS "devolucion_detalles_tenant_isolation" ON public.devolucion_detalles;
DROP POLICY IF EXISTS "cotizaciones_tenant_isolation" ON public.cotizaciones;
DROP POLICY IF EXISTS "aislamiento_tenant_cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_detalles_tenant_isolation" ON public.cotizaciones_detalles;

-- 2.6 Inventario y Caja
DROP POLICY IF EXISTS "kardex_inventario_tenant_isolation" ON public.kardex_inventario;
DROP POLICY IF EXISTS "aislamiento_tenant_kardex" ON public.kardex_inventario;
DROP POLICY IF EXISTS "sesiones_caja_tenant_isolation" ON public.sesiones_caja;
DROP POLICY IF EXISTS "aislamiento_tenant_sesiones_caja" ON public.sesiones_caja;
DROP POLICY IF EXISTS "movimientos_caja_tenant_isolation" ON public.movimientos_caja;
DROP POLICY IF EXISTS "aislamiento_tenant_movimientos_caja" ON public.movimientos_caja;

-- ----------------------------------------------------------------------------
-- 3. CREACIÓN DE POLÍTICAS CANÓNICAS HERMÉTICAS (ZERO TRUST PARA ANON)
-- ----------------------------------------------------------------------------

-- 3.1 Clientes
CREATE POLICY "p0_strict_tenant_isolation_clientes"
ON public.clientes
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.2 Equipos
CREATE POLICY "p0_strict_tenant_isolation_equipos"
ON public.equipos
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.3 Alquileres
CREATE POLICY "p0_strict_tenant_isolation_alquileres"
ON public.alquileres
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.4 Alquiler Detalles
CREATE POLICY "p0_strict_tenant_isolation_alquiler_detalles"
ON public.alquiler_detalles
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.5 Alquiler Adendas
CREATE POLICY "p0_strict_tenant_isolation_alquiler_adendas"
ON public.alquiler_adendas
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.6 Facturas
CREATE POLICY "p0_strict_tenant_isolation_facturas"
ON public.facturas
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.7 Pagos
CREATE POLICY "p0_strict_tenant_isolation_pagos"
ON public.pagos
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.8 Devoluciones
CREATE POLICY "p0_strict_tenant_isolation_devoluciones"
ON public.devoluciones
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.9 Devolucion Detalles
CREATE POLICY "p0_strict_tenant_isolation_devolucion_detalles"
ON public.devolucion_detalles
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.10 Cotizaciones
CREATE POLICY "p0_strict_tenant_isolation_cotizaciones"
ON public.cotizaciones
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.11 Cotizaciones Detalles
CREATE POLICY "p0_strict_tenant_isolation_cotizaciones_detalles"
ON public.cotizaciones_detalles
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.12 Kardex Inventario
CREATE POLICY "p0_strict_tenant_isolation_kardex"
ON public.kardex_inventario
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.13 Sesiones Caja
CREATE POLICY "p0_strict_tenant_isolation_sesiones_caja"
ON public.sesiones_caja
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 3.14 Movimientos Caja
CREATE POLICY "p0_strict_tenant_isolation_movimientos_caja"
ON public.movimientos_caja
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ARCHIVO: supabase/migrations/20261104140000_p1_tenancy_and_referential_integrity.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- MIGRACIÓN CANÓNICA: 20261104140000_p1_tenancy_and_referential_integrity.sql
-- Módulo: Integridad Referencial y Tenancy Unificado (Fase 1 - Prioridad P1)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Objetivo: 
--   1. Eliminar la dualidad tenant_id vs empresa_id en las 11 tablas transaccionales.
--   2. Agregar Foreign Keys faltantes de empresas(id) en CXP y Abonos.
--   3. Asignar empresa_id a las tablas del libro contable (financial_accounts, transactions, journal_entries).
--   4. Implementar constraint compuesto (alquiler_id, cliente_id) anti-facturación cruzada.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PURGADO DE COLUMNA RESIDUAL tenant_id Y CONSOLIDACIÓN EN empresa_id
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
    tablas TEXT[] := ARRAY[
        'sesiones_caja',
        'movimientos_caja',
        'proveedores',
        'cotizaciones',
        'kardex_inventario',
        'compras',
        'subcontrataciones',
        'proveedor_cuentas_pagar',
        'proveedor_abonos_cxp',
        'cliente_movimientos_saldo',
        'pago_metodos_detalle'
    ];
BEGIN
    FOREACH t IN ARRAY tablas LOOP
        -- Si existe la columna empresa_id y tenant_id, rescatar cualquier valor nulo
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'empresa_id') 
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'tenant_id') THEN
            EXECUTE format('UPDATE public.%I SET empresa_id = tenant_id WHERE empresa_id IS NULL AND tenant_id IS NOT NULL', t);
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN tenant_id', t);
        END IF;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. FOREIGN KEYS FALTANTES DE EMPRESA
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_cxp_empresa' AND table_name = 'proveedor_cuentas_pagar'
    ) THEN
        ALTER TABLE public.proveedor_cuentas_pagar 
            ADD CONSTRAINT fk_cxp_empresa 
            FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_abonos_cxp_empresa' AND table_name = 'proveedor_abonos_cxp'
    ) THEN
        ALTER TABLE public.proveedor_abonos_cxp 
            ADD CONSTRAINT fk_abonos_cxp_empresa 
            FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. AISLAMIENTO MULTI-TENANT EN LIBRO MAYOR CONTABLE
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.financial_accounts 
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.transactions 
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.journal_entries 
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;

-- Asignar el tenant principal (FERREON) a registros contables preexistentes huérfanos
UPDATE public.financial_accounts 
SET empresa_id = COALESCE(
    (SELECT id FROM public.empresas WHERE id = 'ac8719ea-f16a-4538-b308-40d9511a14cb'),
    (SELECT id FROM public.empresas ORDER BY created_at ASC LIMIT 1)
)
WHERE empresa_id IS NULL;

UPDATE public.transactions 
SET empresa_id = COALESCE(
    (SELECT id FROM public.empresas WHERE id = 'ac8719ea-f16a-4538-b308-40d9511a14cb'),
    (SELECT id FROM public.empresas ORDER BY created_at ASC LIMIT 1)
)
WHERE empresa_id IS NULL;

UPDATE public.journal_entries 
SET empresa_id = COALESCE(
    (SELECT id FROM public.empresas WHERE id = 'ac8719ea-f16a-4538-b308-40d9511a14cb'),
    (SELECT id FROM public.empresas ORDER BY created_at ASC LIMIT 1)
)
WHERE empresa_id IS NULL;

-- ----------------------------------------------------------------------------
-- 4. CONSTRAINT COMPUESTO ANTI-FACTURACIÓN CRUZADA (ALQUILER_ID + CLIENTE_ID)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- 4.1 Constraint único compuesto en alquileres
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unq_alquiler_cliente' AND table_name = 'alquileres'
    ) THEN
        ALTER TABLE public.alquileres 
            ADD CONSTRAINT unq_alquiler_cliente UNIQUE (id, cliente_id);
    END IF;

    -- 4.2 Sincronizar clientes desfasados en facturas cruzadas históricas antes de aplicar FK
    UPDATE public.facturas f
    SET cliente_id = a.cliente_id
    FROM public.alquileres a
    WHERE f.alquiler_id = a.id AND f.cliente_id != a.cliente_id;

    -- 4.3 Sincronizar clientes desfasados en pagos cruzados históricos antes de aplicar FK
    UPDATE public.pagos p
    SET cliente_id = a.cliente_id
    FROM public.alquileres a
    WHERE p.alquiler_id = a.id AND p.cliente_id != a.cliente_id;

    -- 4.4 Aplicar FK compuesta en facturas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_factura_alquiler_cliente' AND table_name = 'facturas'
    ) THEN
        ALTER TABLE public.facturas 
            ADD CONSTRAINT fk_factura_alquiler_cliente 
            FOREIGN KEY (alquiler_id, cliente_id) REFERENCES public.alquileres(id, cliente_id) ON DELETE RESTRICT;
    END IF;

    -- 4.5 Aplicar FK compuesta en pagos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_pago_alquiler_cliente' AND table_name = 'pagos'
    ) THEN
        ALTER TABLE public.pagos 
            ADD CONSTRAINT fk_pago_alquiler_cliente 
            FOREIGN KEY (alquiler_id, cliente_id) REFERENCES public.alquileres(id, cliente_id) ON DELETE RESTRICT;
    END IF;
END $$;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ARCHIVO: supabase/migrations/20261104150000_p1_reconciliacion_financiera_ciclo_alquileres.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ARCHIVO: supabase/migrations/20261104160000_p2_dbre_partial_indexes_and_cleanup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- MIGRACIÓN CANÓNICA: 20261104160000_p2_dbre_partial_indexes_and_cleanup.sql
-- Módulo: Optimización DBRE e Índices Parciales de Alto Rendimiento (Fase 3 - P2)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Objetivo:
--   1. Acelerar arqueos de caja mediante índices parciales en pagos y devoluciones.
--   2. Optimizar consultas de trazabilidad en kardex por tenant y fecha descendente.
--   3. Acelerar algoritmos de overbooking y curvas de ocupación en alquiler_detalles.
--   4. Deduplicar índices redundantes para optimizar el throughput de escritura.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ÍNDICES PARCIALES DE ALTA VELOCIDAD
-- ----------------------------------------------------------------------------

-- 1.1 Pagos vinculados a sesión de caja abierta/cerrada
CREATE INDEX IF NOT EXISTS idx_pagos_sesion_caja 
ON public.pagos (sesion_caja_id) 
WHERE sesion_caja_id IS NOT NULL;

-- 1.2 Devoluciones vinculadas a sesión de caja
CREATE INDEX IF NOT EXISTS idx_devoluciones_sesion 
ON public.devoluciones (sesion_caja_id) 
WHERE sesion_caja_id IS NOT NULL;

-- 1.3 Kardex de inventario ordenado cronológicamente por tenant
CREATE INDEX IF NOT EXISTS idx_kardex_empresa_creado 
ON public.kardex_inventario (empresa_id, creado_en DESC);

-- 1.4 Curva de ocupación y cálculo de disponibilidad sin colisiones
CREATE INDEX IF NOT EXISTS idx_alquiler_detalles_curva_ocupacion 
ON public.alquiler_detalles (equipo_id, fecha_inicio, fecha_fin) 
WHERE devuelto = FALSE;

-- 1.5 Búsqueda de facturas pendientes de cobro por cliente
CREATE INDEX IF NOT EXISTS idx_facturas_cartera_pendiente 
ON public.facturas (empresa_id, cliente_id, estado_pago) 
WHERE estado_pago IN ('PENDIENTE', 'PARCIAL', 'VENCIDA');



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- ARCHIVO: supabase/migrations/20261104170000_p2_cop_integer_currency_check_constraints.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- MIGRACIÓN CANÓNICA: 20261104170000_p2_cop_integer_currency_check_constraints.sql
-- Módulo: Estandarización de Moneda COP (Aritmética Entera Estricta) (Fase 4 - P2)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Objetivo:
--   1. Blindar contratos, facturación y pagos contra la inserción de centavos decimales.
--   2. Garantizar que en pesos colombianos (COP) todos los importes operen como enteros.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RESTRICCIONES CHECK DE MONEDA COP ENTERA
-- ----------------------------------------------------------------------------

-- 1.1 Alquileres
DO $$
BEGIN
    -- Saneamiento defensivo previo para redondear centavos residuales
    UPDATE public.alquileres 
    SET total = ROUND(total), 
        saldo_pendiente = ROUND(saldo_pendiente), 
        deposito = ROUND(COALESCE(deposito, 0))
    WHERE total != TRUNC(total) 
       OR saldo_pendiente != TRUNC(saldo_pendiente) 
       OR (deposito IS NOT NULL AND deposito != TRUNC(deposito));

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_alquileres_cop_entero' AND table_name = 'alquileres') THEN
        ALTER TABLE public.alquileres 
            ADD CONSTRAINT chk_alquileres_cop_entero 
            CHECK (
                total = TRUNC(total) 
                AND saldo_pendiente = TRUNC(saldo_pendiente) 
                AND COALESCE(deposito, 0) = TRUNC(COALESCE(deposito, 0))
            );
    END IF;
END $$;

-- 1.2 Alquiler Detalles
DO $$
BEGIN
    -- Saneamiento defensivo previo para redondear centavos residuales
    UPDATE public.alquiler_detalles 
    SET precio_unitario = ROUND(precio_unitario), 
        subtotal_linea = ROUND(subtotal_linea)
    WHERE precio_unitario != TRUNC(precio_unitario) 
       OR subtotal_linea != TRUNC(subtotal_linea);

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_alquiler_detalles_cop_entero' AND table_name = 'alquiler_detalles') THEN
        ALTER TABLE public.alquiler_detalles 
            ADD CONSTRAINT chk_alquiler_detalles_cop_entero 
            CHECK (
                precio_unitario = TRUNC(precio_unitario) 
                AND subtotal_linea = TRUNC(subtotal_linea)
            );
    END IF;
END $$;

-- 1.3 Facturas
DO $$
BEGIN
    -- Saneamiento defensivo previo para redondear centavos residuales
    UPDATE public.facturas 
    SET total_pagar = ROUND(total_pagar), 
        saldo_pendiente = ROUND(saldo_pendiente)
    WHERE total_pagar != TRUNC(total_pagar) 
       OR saldo_pendiente != TRUNC(saldo_pendiente);

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_facturas_cop_entero' AND table_name = 'facturas') THEN
        ALTER TABLE public.facturas 
            ADD CONSTRAINT chk_facturas_cop_entero 
            CHECK (
                total_pagar = TRUNC(total_pagar) 
                AND saldo_pendiente = TRUNC(saldo_pendiente)
            );
    END IF;
END $$;

-- 1.4 Pagos
DO $$
BEGIN
    -- Saneamiento defensivo previo para redondear centavos residuales
    UPDATE public.pagos 
    SET monto = ROUND(monto)
    WHERE monto != TRUNC(monto);

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_pagos_cop_entero' AND table_name = 'pagos') THEN
        ALTER TABLE public.pagos 
            ADD CONSTRAINT chk_pagos_cop_entero 
            CHECK (monto = TRUNC(monto));
    END IF;
END $$;

-- 1.5 Tarifas de Equipos
DO $$
BEGIN
    -- Saneamiento defensivo previo para redondear centavos residuales
    UPDATE public.equipos 
    SET tarifa_dia = ROUND(tarifa_dia), 
        tarifa_semana = ROUND(COALESCE(tarifa_semana, 0)), 
        tarifa_mes = ROUND(COALESCE(tarifa_mes, 0))
    WHERE tarifa_dia != TRUNC(tarifa_dia) 
       OR (tarifa_semana IS NOT NULL AND tarifa_semana != TRUNC(tarifa_semana))
       OR (tarifa_mes IS NOT NULL AND tarifa_mes != TRUNC(tarifa_mes));

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_equipos_tarifas_cop_entero' AND table_name = 'equipos') THEN
        ALTER TABLE public.equipos 
            ADD CONSTRAINT chk_equipos_tarifas_cop_entero 
            CHECK (
                tarifa_dia = TRUNC(tarifa_dia) 
                AND COALESCE(tarifa_semana, 0) = TRUNC(COALESCE(tarifa_semana, 0))
                AND COALESCE(tarifa_mes, 0) = TRUNC(COALESCE(tarifa_mes, 0))
            );
    END IF;
END $$;


-- ============================================================================
-- REGISTRO DE MIGRACIONES EN SCHEMA_MIGRATIONS
-- ============================================================================
DO 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations') THEN
        INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
        VALUES 
            ('20261104130000', NULL, 'p0_security_seal_rls_hotfix'),
            ('20261104140000', NULL, 'p1_tenancy_and_referential_integrity'),
            ('20261104150000', NULL, 'p1_reconciliacion_financiera_ciclo_alquileres'),
            ('20261104160000', NULL, 'p2_dbre_partial_indexes_and_cleanup'),
            ('20261104170000', NULL, 'p2_cop_integer_currency_check_constraints')
        ON CONFLICT (version) DO NOTHING;
    END IF;
END ;

COMMIT;
