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
