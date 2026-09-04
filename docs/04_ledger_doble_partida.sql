-- ==========================================
-- 04_ledger_doble_partida.sql
-- Migración: Contabilidad de Partida Doble
-- ==========================================

BEGIN;

-- 1. ENUM para Tipos de Cuenta
CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- 2. Tabla: financial_accounts (Plan de Cuentas)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type account_type NOT NULL,
    is_cash_equivalent BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla: transactions (Cabecera del Asiento Contable)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(255) NOT NULL,
    reference_id UUID, -- Polymorphic reference (alquiler_id, pago_id, etc)
    created_by UUID, -- Quien registró la transacción
    idempotency_key UUID UNIQUE NOT NULL, -- Clave única para evitar duplicados
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla: journal_entries (Líneas de Débito/Crédito)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL, -- Positivo = Débito, Negativo = Crédito
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Trigger y Función: Evitar UPDATES/DELETES en journal_entries (Inmutabilidad)
CREATE OR REPLACE FUNCTION prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Las entradas de diario (journal_entries) son inmutables. Use un contra-asiento para corregir.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_prevent_update_delete_journal_entries
BEFORE UPDATE OR DELETE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION prevent_modification();

-- 6. RPC: insert_transaction (Inserción Atómica y Validación de Partida Doble)
CREATE OR REPLACE FUNCTION insert_transaction(
    p_description VARCHAR,
    p_reference_id UUID,
    p_created_by UUID,
    p_idempotency_key UUID,
    p_entries JSONB -- Formato: [{"account_id": "uuid", "amount": 100}, {"account_id": "uuid", "amount": -100}]
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_entry JSONB;
    v_total_amount DECIMAL(15,2) := 0;
BEGIN
    -- Validar sumatoria de partida doble (Débitos + Créditos = 0)
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        v_total_amount := v_total_amount + (v_entry->>'amount')::DECIMAL;
    END LOOP;

    IF v_total_amount != 0 THEN
        RAISE EXCEPTION 'Violación de Partida Doble: La suma de débitos y créditos debe ser 0. Total actual: %', v_total_amount;
    END IF;

    -- Insertar Cabecera de Transacción (Falla si idempotency_key está duplicado)
    INSERT INTO public.transactions (description, reference_id, created_by, idempotency_key)
    VALUES (p_description, p_reference_id, p_created_by, p_idempotency_key)
    RETURNING id INTO v_transaction_id;

    -- Insertar Líneas de Diario
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        INSERT INTO public.journal_entries (transaction_id, account_id, amount)
        VALUES (v_transaction_id, (v_entry->>'account_id')::UUID, (v_entry->>'amount')::DECIMAL);
    END LOOP;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
