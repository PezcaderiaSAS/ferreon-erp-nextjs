---
name: postgres-transaction-guard
description: >
  Diseña, revisa y ejecuta operaciones transaccionales atómicas contra PostgreSQL
  en Supabase para FerreOn ERP: bloqueos a nivel de fila (FOR UPDATE), consistencia
  de stock, control de sobreventa (overselling), triggers financieros y procedimientos
  almacenados (RPCs) con ROLLBACK garantizado.
---

# Postgres Transaction Guard — FerreOn ERP

Esta skill define las reglas obligatorias de consistencia transaccional y atomicidad en PostgreSQL para FerreOn ERP.

## 1. Reglas de Oro Transaccionales (ACID)

1. **Atomicidad por Operación de Negocio (All-or-Nothing):**
   - Un contrato de alquiler o devolución **NO** debe realizarse en llamadas HTTP independientes que dejen estados parciales.
   - Debe ejecutarse en una sola unidad atómica en PostgreSQL mediante procedimientos almacenados (`RPC`) o bloques `BEGIN ... EXCEPTION ... ROLLBACK`.

2. **Bloqueo a Nivel de Fila (`SELECT ... FOR UPDATE`):**
   - Siempre que se descuente o restituya inventario en `public.equipos`, se debe bloquear la fila correspondiente con `FOR UPDATE` para prevenir condiciones de carrera (Race Conditions) y sobreventa concurrente (Overselling).

3. **Invariante de Inventario (Check Constraints):**
   - En `public.equipos`, se debe cumplir siempre:
     `stock_disponible + stock_en_obra + stock_mantenimiento = stock_total`
   - La base de datos debe rechazar cualquier operación que intente dejar `stock_disponible < 0`.

4. **Consistencia Financiera por Triggers:**
   - La sumatoria de pagos en `public.pagos` debe actualizar automáticamente el `total_pagado` y `saldo_pendiente` en `public.alquileres`, y marcar `public.facturas.estado_pago = 'PAGADA'` al liquidar el 100%.

5. **Transacciones Cortas y Desacopladas:**
   - Cerrar las transacciones de base de datos antes de invocar servicios externos (SIIGO, correos, pasarelas de pago).

## 2. Patrón de Procedimiento RPC en Supabase

```sql
CREATE OR REPLACE FUNCTION public.crear_alquiler_transaccional(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_alquiler_id BIGINT;
    v_item JSONB;
    v_stock_disp INT;
BEGIN
    -- 1. Insertar Cabecera
    INSERT INTO public.alquileres (...) RETURNING id INTO v_alquiler_id;

    -- 2. Procesar ítems con bloqueo FOR UPDATE
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
    LOOP
        SELECT stock_disponible INTO v_stock_disp
        FROM public.equipos
        WHERE id = (v_item->>'equipo_id')::BIGINT
        FOR UPDATE;

        IF v_stock_disp < (v_item->>'cantidad')::INT THEN
            RAISE EXCEPTION 'Stock insuficiente para equipo %', (v_item->>'equipo_id');
        END IF;

        UPDATE public.equipos
        SET stock_disponible = stock_disponible - (v_item->>'cantidad')::INT,
            stock_en_obra = stock_en_obra + (v_item->>'cantidad')::INT
        WHERE id = (v_item->>'equipo_id')::BIGINT;

        INSERT INTO public.alquiler_detalles (...);
    END LOOP;

    RETURN json_build_object('success', true, 'id', v_alquiler_id)::JSONB;
END;
$$;
```
