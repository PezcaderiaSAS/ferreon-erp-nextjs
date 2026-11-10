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
