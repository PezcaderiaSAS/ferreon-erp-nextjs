-- ==========================================
-- 05_seed_chart_of_accounts.sql
-- Inyección: Plan de Cuentas Básico (Seeding)
-- ==========================================

BEGIN;

-- Insertar Cuentas de Activo (Billeteras / Cajas)
INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
VALUES 
    ('Caja Principal', 'ASSET', true, 'Caja física central de la empresa'),
    ('Bancolombia Ahorros', 'ASSET', true, 'Cuenta de ahorros principal'),
    ('Nequi', 'ASSET', true, 'Billetera digital Nequi'),
    ('Daviplata', 'ASSET', true, 'Billetera digital Daviplata'),
    ('Equipos y Maquinaria', 'ASSET', false, 'Valor en libros de los equipos para alquiler'),
    ('Cuentas por Cobrar (Cartera)', 'ASSET', false, 'Saldos pendientes de clientes');

-- Insertar Cuentas de Pasivo
INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
VALUES 
    ('Cuentas por Pagar (Proveedores)', 'LIABILITY', false, 'Deudas pendientes por compras a crédito'),
    ('Depósitos de Garantía', 'LIABILITY', false, 'Dinero retenido a clientes como garantía de alquileres');

-- Insertar Cuentas de Ingreso (Revenue)
INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
VALUES 
    ('Ingresos por Alquileres', 'REVENUE', false, 'Ingresos operacionales por alquiler de equipos'),
    ('Ingresos por Penalidades (Daños)', 'REVENUE', false, 'Ingresos por cobro de equipos dañados o extraviados');

-- Insertar Cuentas de Gasto (Expense / OPEX)
INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
VALUES 
    ('Gastos de Mantenimiento', 'EXPENSE', false, 'Gastos por reparación y mantenimiento de equipos'),
    ('Gastos de Nómina', 'EXPENSE', false, 'Pago de salarios a empleados y operarios'),
    ('Gastos de Servicios Públicos', 'EXPENSE', false, 'Agua, luz, internet de la sucursal');

-- Insertar Cuenta de Capital (Equity)
INSERT INTO public.financial_accounts (name, type, is_cash_equivalent, description)
VALUES 
    ('Capital Social', 'EQUITY', false, 'Capital inicial aportado por los socios');

COMMIT;
