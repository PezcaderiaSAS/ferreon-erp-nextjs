-- ============================================================================
-- FERREON ERP - MIGRACIÓN DDL
-- Objetivo: Función PL/pgSQL para sembrar datos Dummy de prueba (SaaS Onboarding)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_dummy_tenant_data(p_empresa_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cliente_1_id bigint;
  v_cliente_2_id bigint;
  v_equipo_1_id bigint;
  v_equipo_2_id bigint;
  v_equipo_3_id bigint;
  v_alquiler_id bigint;
  v_consecutivo integer;
  v_caja_id uuid;
  v_pfx text;
BEGIN
  v_pfx := UPPER(substr(replace(p_empresa_id::text, '-', ''), 1, 4));

  -- 1. Crear Clientes
  INSERT INTO public.clientes (empresa_id, nit_cedula, nombre, email, telefono, direccion, estado)
  VALUES 
    (p_empresa_id, '900123456-1', 'Constructora Demo S.A.S.', 'contacto@constructorademo.com', '3001234567', 'Av. Principal #123, Bucaramanga', 'Activo')
  RETURNING id INTO v_cliente_1_id;

  INSERT INTO public.clientes (empresa_id, nit_cedula, nombre, email, telefono, direccion, estado)
  VALUES 
    (p_empresa_id, '1098765432', 'Juan Pérez (Cliente Prueba)', 'juan.perez@email.com', '3119876543', 'Calle 45 #12-34, Floridablanca', 'Activo')
  RETURNING id INTO v_cliente_2_id;

  -- 2. Crear Equipos de Maquinaria
  INSERT INTO public.equipos (empresa_id, codigo, nombre, categoria, estado, stock_total, stock_disponible, stock_en_obra, stock_mantenimiento, tarifa_diaria, valor_reposicion)
  VALUES (p_empresa_id, 'AND-' || v_pfx, 'Andamio Tubular Estándar 1.5x1.5m', 'Andamios', 'Activo', 50, 48, 2, 0, 2500, 120000)
  RETURNING id INTO v_equipo_1_id;

  INSERT INTO public.equipos (empresa_id, codigo, nombre, categoria, estado, stock_total, stock_disponible, stock_en_obra, stock_mantenimiento, tarifa_diaria, valor_reposicion)
  VALUES (p_empresa_id, 'TAL-' || v_pfx, 'Taladro Percutor Industrial 800W', 'Herramienta Eléctrica', 'Activo', 10, 9, 1, 0, 35000, 850000)
  RETURNING id INTO v_equipo_2_id;

  INSERT INTO public.equipos (empresa_id, codigo, nombre, categoria, estado, stock_total, stock_disponible, stock_en_obra, stock_mantenimiento, tarifa_diaria, valor_reposicion)
  VALUES (p_empresa_id, 'MEZ-' || v_pfx, 'Mezcladora de Concreto 1 Bulto', 'Maquinaria Pesada', 'Activo', 5, 5, 0, 0, 80000, 3500000)
  RETURNING id INTO v_equipo_3_id;

  -- 3. Crear Sesión de Caja Abierta
  INSERT INTO public.sesiones_caja (empresa_id, tenant_id, usuario_id, estado, monto_apertura, observaciones)
  VALUES (p_empresa_id, p_empresa_id, p_user_id, 'ABIERTA', 150000, 'Apertura de caja de prueba inicial.')
  RETURNING id INTO v_caja_id;

  -- 4. Crear Contrato de Alquiler de Prueba
  SELECT COALESCE(MAX(consecutivo), 0) + 1 INTO v_consecutivo FROM public.alquileres;

  INSERT INTO public.alquileres (
    empresa_id, 
    consecutivo, 
    cliente_id, 
    estado, 
    subtotal_equipos, 
    flete_entrega, 
    flete_recogida, 
    subtotal_general, 
    total, 
    deposito, 
    garantia_monto, 
    garantia_tipo, 
    garantia_estado, 
    total_pagado, 
    saldo_pendiente, 
    creado_por
  ) VALUES (
    p_empresa_id, 
    v_consecutivo, 
    v_cliente_1_id, 
    'ACTIVO', 
    175000, 
    15000, 
    15000, 
    205000, 
    205000, 
    50000, 
    50000, 
    'EFECTIVO', 
    'CUSTODIA', 
    50000, 
    155000, 
    'Sistema Demo'
  ) RETURNING id INTO v_alquiler_id;

  -- 5. Detalles del Alquiler
  INSERT INTO public.alquiler_detalles (
    empresa_id, 
    alquiler_id, 
    equipo_id, 
    linea_numero, 
    cantidad, 
    cantidad_devuelta, 
    dias_contratados, 
    tarifa_aplicada, 
    subtotal_linea, 
    devuelto, 
    fecha_inicio, 
    fecha_fin
  ) VALUES 
    (p_empresa_id, v_alquiler_id, v_equipo_1_id, 1, 2, 0, 7, 2500, 35000, false, now(), now() + interval '7 days'),
    (p_empresa_id, v_alquiler_id, v_equipo_2_id, 2, 1, 0, 4, 35000, 140000, false, now(), now() + interval '4 days');

  -- 6. Movimiento de Caja (Abono inicial)
  INSERT INTO public.movimientos_caja (
    empresa_id, 
    tenant_id, 
    sesion_caja_id, 
    usuario_id, 
    tipo, 
    monto, 
    concepto, 
    beneficiario
  ) VALUES (
    p_empresa_id, 
    p_empresa_id, 
    v_caja_id, 
    p_user_id, 
    'INGRESO', 
    50000, 
    'Anticipo Contrato Alquiler #' || v_consecutivo, 
    'Constructora Demo S.A.S.'
  );

END;
$$;
