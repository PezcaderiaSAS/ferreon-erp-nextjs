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
    -- Manejo polimórfico defensivo: verificar si la columna es tarifa_aplicada o precio_unitario
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alquiler_detalles' AND column_name = 'tarifa_aplicada') THEN
        UPDATE public.alquiler_detalles 
        SET tarifa_aplicada = ROUND(tarifa_aplicada), 
            subtotal_linea = ROUND(subtotal_linea)
        WHERE tarifa_aplicada != TRUNC(tarifa_aplicada) 
           OR subtotal_linea != TRUNC(subtotal_linea);

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_alquiler_detalles_cop_entero' AND table_name = 'alquiler_detalles') THEN
            ALTER TABLE public.alquiler_detalles 
                ADD CONSTRAINT chk_alquiler_detalles_cop_entero 
                CHECK (
                    tarifa_aplicada = TRUNC(tarifa_aplicada) 
                    AND subtotal_linea = TRUNC(subtotal_linea)
                );
        END IF;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alquiler_detalles' AND column_name = 'precio_unitario') THEN
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
    END IF;
END $$;

-- 1.3 Facturas
DO $$
BEGIN
    -- Saneamiento defensivo previo para redondear centavos residuales
    UPDATE public.facturas 
    SET total_pagar = ROUND(total_pagar), 
        subtotal = ROUND(subtotal)
    WHERE total_pagar != TRUNC(total_pagar) 
       OR subtotal != TRUNC(subtotal);

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_facturas_cop_entero' AND table_name = 'facturas') THEN
        ALTER TABLE public.facturas 
            ADD CONSTRAINT chk_facturas_cop_entero 
            CHECK (
                total_pagar = TRUNC(total_pagar) 
                AND subtotal = TRUNC(subtotal)
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

-- 1.5 Tarifas de Equipos (Manejo polimórfico defensivo: tarifa_diaria / tarifa_dia)
DO $$
DECLARE
    v_col_dia text := NULL;
    v_col_semana text := NULL;
    v_col_mes text := NULL;
    v_sql text;
    v_set_clauses text[] := ARRAY[]::text[];
    v_where_clauses text[] := ARRAY[]::text[];
    v_chk_clauses text[] := ARRAY[]::text[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipos') THEN
        RETURN;
    END IF;

    -- Detectar nombre de columna para tarifa diaria
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'equipos' AND column_name = 'tarifa_diaria') THEN
        v_col_dia := 'tarifa_diaria';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'equipos' AND column_name = 'tarifa_dia') THEN
        v_col_dia := 'tarifa_dia';
    END IF;

    -- Detectar nombre de columna para tarifa semanal
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'equipos' AND column_name = 'tarifa_semanal') THEN
        v_col_semana := 'tarifa_semanal';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'equipos' AND column_name = 'tarifa_semana') THEN
        v_col_semana := 'tarifa_semana';
    END IF;

    -- Detectar nombre de columna para tarifa mensual
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'equipos' AND column_name = 'tarifa_mensual') THEN
        v_col_mes := 'tarifa_mensual';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'equipos' AND column_name = 'tarifa_mes') THEN
        v_col_mes := 'tarifa_mes';
    END IF;

    IF v_col_dia IS NOT NULL THEN
        v_set_clauses := array_append(v_set_clauses, quote_ident(v_col_dia) || ' = ROUND(' || quote_ident(v_col_dia) || ')');
        v_where_clauses := array_append(v_where_clauses, quote_ident(v_col_dia) || ' != TRUNC(' || quote_ident(v_col_dia) || ')');
        v_chk_clauses := array_append(v_chk_clauses, quote_ident(v_col_dia) || ' = TRUNC(' || quote_ident(v_col_dia) || ')');
    END IF;

    IF v_col_semana IS NOT NULL THEN
        v_set_clauses := array_append(v_set_clauses, quote_ident(v_col_semana) || ' = ROUND(COALESCE(' || quote_ident(v_col_semana) || ', 0))');
        v_where_clauses := array_append(v_where_clauses, '(' || quote_ident(v_col_semana) || ' IS NOT NULL AND ' || quote_ident(v_col_semana) || ' != TRUNC(' || quote_ident(v_col_semana) || '))');
        v_chk_clauses := array_append(v_chk_clauses, 'COALESCE(' || quote_ident(v_col_semana) || ', 0) = TRUNC(COALESCE(' || quote_ident(v_col_semana) || ', 0))');
    END IF;

    IF v_col_mes IS NOT NULL THEN
        v_set_clauses := array_append(v_set_clauses, quote_ident(v_col_mes) || ' = ROUND(COALESCE(' || quote_ident(v_col_mes) || ', 0))');
        v_where_clauses := array_append(v_where_clauses, '(' || quote_ident(v_col_mes) || ' IS NOT NULL AND ' || quote_ident(v_col_mes) || ' != TRUNC(' || quote_ident(v_col_mes) || '))');
        v_chk_clauses := array_append(v_chk_clauses, 'COALESCE(' || quote_ident(v_col_mes) || ', 0) = TRUNC(COALESCE(' || quote_ident(v_col_mes) || ', 0))');
    END IF;

    IF array_length(v_set_clauses, 1) > 0 THEN
        v_sql := 'UPDATE public.equipos SET ' || array_to_string(v_set_clauses, ', ') || ' WHERE ' || array_to_string(v_where_clauses, ' OR ');
        EXECUTE v_sql;

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_equipos_tarifas_cop_entero' AND table_name = 'equipos') THEN
            v_sql := 'ALTER TABLE public.equipos ADD CONSTRAINT chk_equipos_tarifas_cop_entero CHECK (' || array_to_string(v_chk_clauses, ' AND ') || ')';
            EXECUTE v_sql;
        END IF;
    END IF;
END $$;
