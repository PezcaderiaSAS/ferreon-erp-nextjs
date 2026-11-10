-- ============================================================================
-- MIGRACIÓN CANÓNICA: 20261104130000_p0_security_seal_rls_hotfix.sql
-- Módulo: Hardening Crítico RLS (P0 - Zero Trust)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Objetivo: Revocar completamente el acceso de lectura y escritura anónima
--           provocado por políticas con USING (true) y cláusulas IS NULL.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. RESOLUCIÓN DE TENANT Y GARANTÍA DE COLUMNA EMPRESA_ID EN TODAS LAS TABLAS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT empresa_id 
    FROM public.empresa_usuarios 
    WHERE user_id = auth.uid() 
      AND es_empresa_activa = TRUE 
    LIMIT 1;
$$;

DO $$
DECLARE
    t TEXT;
    tablas TEXT[] := ARRAY[
        'clientes',
        'equipos',
        'alquileres',
        'alquiler_detalles',
        'alquiler_adendas',
        'facturas',
        'pagos',
        'devoluciones',
        'devolucion_detalles',
        'cotizaciones',
        'cotizaciones_detalles',
        'kardex_inventario',
        'sesiones_caja',
        'movimientos_caja',
        'proveedores',
        'compras',
        'subcontrataciones',
        'proveedor_cuentas_pagar',
        'proveedor_abonos_cxp',
        'cliente_movimientos_saldo',
        'pago_metodos_detalle'
    ];
BEGIN
    FOREACH t IN ARRAY tablas LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            -- 1. Asegurar que la columna empresa_id exista en la tabla
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS empresa_id UUID', t);

            -- 2. Si existe tenant_id, rescatar valores legítimos que coincidan con una empresa
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'tenant_id') THEN
                EXECUTE format('UPDATE public.%I SET empresa_id = tenant_id WHERE empresa_id IS NULL AND tenant_id IN (SELECT id FROM public.empresas)', t);
            END IF;

            -- 3. Asignar el tenant principal a huérfanos antes de crear políticas
            EXECUTE format('UPDATE public.%I SET empresa_id = COALESCE((SELECT id FROM public.empresas WHERE id = ''ac8719ea-f16a-4538-b308-40d9511a14cb''), (SELECT id FROM public.empresas ORDER BY created_at ASC LIMIT 1)) WHERE empresa_id IS NULL', t);
        END IF;
    END LOOP;
END $$;

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
-- 2.0 Purga dinámica exhaustiva de cualquier política existente en las 14 tablas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN (
              'clientes', 'equipos', 'alquileres', 'alquiler_detalles', 'alquiler_adendas',
              'facturas', 'pagos', 'devoluciones', 'devolucion_detalles', 'cotizaciones',
              'cotizaciones_detalles', 'kardex_inventario', 'sesiones_caja', 'movimientos_caja'
          )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;
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
