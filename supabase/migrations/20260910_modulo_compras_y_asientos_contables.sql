-- ==============================================================================
-- MIGRACIÓN: MÓDULO DE COMPRAS, INVENTARIOS Y ASIENTOS CONTABLES EN LEDGER
-- Proyecto: FerreOn ERP
-- Fecha: 2026-09-10
-- ==============================================================================

BEGIN;

-- 1. ASEGURAR PLAN DE CUENTAS (financial_accounts)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    is_cash_equivalent BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inyectar Cuentas Básicas del Sistema si no existen
INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Equipos y Maquinaria', 'ASSET', false, 'Valor en libros de los equipos para alquiler y venta'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Equipos y Maquinaria');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Caja Principal', 'ASSET', true, 'Caja física central de la empresa'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Caja Principal');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Bancolombia Ahorros', 'ASSET', true, 'Cuenta bancaria corriente o ahorros'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Bancolombia Ahorros');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Cuentas por Pagar (Proveedores)', 'LIABILITY', false, 'Obligaciones por compras de inventario y maquinaria a crédito'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Cuentas por Pagar (Proveedores)');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Cuentas por Cobrar (Cartera)', 'ASSET', false, 'Saldos pendientes por cobrar de clientes'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Cuentas por Cobrar (Cartera)');

INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
SELECT 'Ingresos por Alquileres', 'REVENUE', false, 'Ingresos operacionales por contratos de alquiler'
WHERE NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE name = 'Ingresos por Alquileres');

-- 2. ASEGURAR TRANSACCIONES Y ENTRADAS DE DIARIO (transactions & journal_entries)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(255) NOT NULL,
    reference_id VARCHAR(100),
    created_by UUID,
    idempotency_key VARCHAR(150) UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL, -- Positivo = Débito, Negativo = Crédito
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de auditoría financiera
CREATE INDEX IF NOT EXISTS idx_journal_entries_txn ON public.journal_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_acc ON public.journal_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON public.transactions(reference_id);

-- 3. TABLA DE COMPRAS (Cabecera de Órdenes de Compra)
CREATE TABLE IF NOT EXISTS public.compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    numero_orden VARCHAR(50) NOT NULL,
    proveedor_nombre VARCHAR(255) NOT NULL,
    proveedor_nit VARCHAR(50),
    proveedor_telefono VARCHAR(50),
    proveedor_email VARCHAR(100),
    fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO' CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CREDITO')),
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    impuestos DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA' CHECK (estado IN ('PENDIENTE', 'COMPLETADA', 'ANULADA')),
    observaciones TEXT,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    usuario_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE DETALLES DE COMPRA (Líneas de Equipos Adquiridos)
CREATE TABLE IF NOT EXISTS public.compras_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
    equipo_id BIGINT NOT NULL REFERENCES public.equipos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(15,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de desempeño
CREATE INDEX IF NOT EXISTS idx_compras_tenant ON public.compras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON public.compras(fecha_compra DESC);
CREATE INDEX IF NOT EXISTS idx_compras_detalles_compra ON public.compras_detalles(compra_id);
CREATE INDEX IF NOT EXISTS idx_compras_detalles_equipo ON public.compras_detalles(equipo_id);

-- 5. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Políticas para compras
DROP POLICY IF EXISTS "Tenants can view own compras" ON public.compras;
CREATE POLICY "Tenants can view own compras" ON public.compras 
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IS NULL);

DROP POLICY IF EXISTS "Tenants can insert own compras" ON public.compras 
    FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL);

-- Políticas para compras_detalles
DROP POLICY IF EXISTS "Tenants can view own compras_detalles" ON public.compras_detalles;
CREATE POLICY "Tenants can view own compras_detalles" ON public.compras_detalles 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenants can insert own compras_detalles" ON public.compras_detalles 
    FOR INSERT WITH CHECK (true);

-- Políticas para contabilidad
DROP POLICY IF EXISTS "Tenants can view financial_accounts" ON public.financial_accounts;
CREATE POLICY "Tenants can view financial_accounts" ON public.financial_accounts 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenants can view transactions" ON public.transactions;
CREATE POLICY "Tenants can view transactions" ON public.transactions 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tenants can view journal_entries" ON public.journal_entries;
CREATE POLICY "Tenants can view journal_entries" ON public.journal_entries 
    FOR SELECT USING (true);

COMMIT;
