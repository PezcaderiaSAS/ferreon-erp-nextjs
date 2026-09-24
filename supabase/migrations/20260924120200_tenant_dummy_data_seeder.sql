-- ============================================================================
-- FERREON ERP - MIGRACIÓN DDL
-- Objetivo: Función PL/pgSQL para sembrar datos Dummy de prueba (SaaS Onboarding)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_dummy_tenant_data(p_empresa_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_bodega_id uuid;
  v_cliente_1_id integer;
  v_cliente_2_id integer;
  v_equipo_1_id bigint;
  v_equipo_2_id bigint;
  v_equipo_3_id bigint;
  v_equipo_4_id bigint;
  v_equipo_5_id bigint;
  v_alquiler_id integer;
  v_caja_id uuid;
BEGIN
  -- 1. Crear Bodega Principal
  INSERT INTO public.bodegas (empresa_id, nombre, codigo, direccion, es_principal, activa)
  VALUES (p_empresa_id, 'Bodega Central (Demo)', 'BOD-01', 'Av. Principal #123', true, true)
  RETURNING id INTO v_bodega_id;

  -- 2. Crear Clientes
  INSERT INTO public.clientes (empresa_id, tipo_documento, numero_documento, nombre, email, telefono, ciudad, estado_cartera, activo)
  VALUES 
    (p_empresa_id, 'NIT', '900123456-1', 'Constructora Demo S.A.S.', 'contacto@constructorademo.com', '3001234567', 'Bucaramanga', 'AL_DIA', true)
  RETURNING id INTO v_cliente_1_id;

  INSERT INTO public.clientes (empresa_id, tipo_documento, numero_documento, nombre, email, telefono, ciudad, estado_cartera, activo)
  VALUES 
    (p_empresa_id, 'CC', '1098765432', 'Juan Pérez (Cliente Prueba)', 'juan.perez@email.com', '3119876543', 'Floridablanca', 'AL_DIA', true)
  RETURNING id INTO v_cliente_2_id;

  -- 3. Crear Equipos
  INSERT INTO public.equipos (empresa_id, codigo, nombre, categoria, estado, stock_total, stock_disponible, tarifa_dia, tarifa_semana, tarifa_mes, valor_reposicion)
  VALUES (p_empresa_id, 'AND-001', 'Andamio Tubular Estandar 1.5x1.5m', 'Andamios', 'DISPONIBLE', 50, 48, 2500, 15000, 50000, 120000)
  RETURNING id INTO v_equipo_1_id;

  INSERT INTO public.equipos (empresa_id, codigo, nombre, categoria, estado, stock_total, stock_disponible, tarifa_dia, tarifa_semana, tarifa_mes, valor_reposicion)
  VALUES (p_empresa_id, 'TAL-001', 'Taladro Percutor Industrial 800W', 'Herramienta Eléctrica', 'DISPONIBLE', 10, 9, 35000, 200000, 600000, 850000)
  RETURNING id INTO v_equipo_2_id;

  INSERT INTO public.equipos (empresa_id, codigo, nombre, categoria, estado, stock_total, stock_disponible, tarifa_dia, tarifa_semana, tarifa_mes, valor_reposicion)
  VALUES (p_empresa_id, 'MEZ-001', 'Mezcladora de Concreto 1 Bulto', 'Maquinaria Pesada', 'DISPONIBLE', 5, 5, 80000, 450000, 1500000, 3500000)
  RETURNING id INTO v_equipo_3_id;

  INSERT INTO public.equipos (empresa_id, codigo, nombre, categoria, estado, stock_total, stock_disponible, tarifa_dia, tarifa_semana, tarifa_mes, valor_reposicion)
  VALUES (p_empresa_id, 'TAB-001', 'Tablero de Madera para Encofrado', 'Madera y Encofrado', 'DISPONIBLE', 100, 100, 1500, 9000, 30000, 45000)
  RETURNING id INTO v_equipo_4_id;

  INSERT INTO public.equipos (empresa_id, codigo, nombre, categoria, estado, stock_total, stock_disponible, tarifa_dia, tarifa_semana, tarifa_mes, valor_reposicion)
  VALUES (p_empresa_id, 'COR-001', 'Cortadora de Ladrillo 14"', 'Herramienta Eléctrica', 'DISPONIBLE', 3, 3, 60000, 350000, 1100000, 2100000)
  RETURNING id INTO v_equipo_5_id;

  -- 4. Crear Stocks en Bodega
  INSERT INTO public.bodega_stocks (empresa_id, bodega_id, equipo_id, stock_fisico, stock_reservado) VALUES 
    (p_empresa_id, v_bodega_id, v_equipo_1_id, 50, 0),
    (p_empresa_id, v_bodega_id, v_equipo_2_id, 10, 0),
    (p_empresa_id, v_bodega_id, v_equipo_3_id, 5, 0),
    (p_empresa_id, v_bodega_id, v_equipo_4_id, 100, 0),
    (p_empresa_id, v_bodega_id, v_equipo_5_id, 3, 0);

  -- 5. Crear Sesión de Caja Abierta
  INSERT INTO public.sesiones_caja (empresa_id, tenant_id, usuario_id, estado, monto_apertura, observaciones)
  VALUES (p_empresa_id, p_empresa_id, p_user_id, 'ABIERTA', 150000, 'Apertura de caja de prueba inicial.')
  RETURNING id INTO v_caja_id;

  -- 6. Crear un Contrato de Alquiler de Prueba
  INSERT INTO public.alquileres (empresa_id, consecutivo, cliente_id, bodega_origen_id, estado, subtotal_equipos, total, total_pagado, saldo_pendiente, aplica_iva, valor_iva, creado_por)
  VALUES (p_empresa_id, 1, v_cliente_1_id, v_bodega_id, 'ACTIVO_EN_OBRA', 190000, 190000, 50000, 140000, false, 0, 'Sistema Demo')
  RETURNING id INTO v_alquiler_id;

  -- 7. Detalles del Alquiler (Equipos Despachados)
  INSERT INTO public.alquiler_detalles (empresa_id, alquiler_id, equipo_id, linea_numero, cantidad, cantidad_devuelta, dias_contratados, fecha_inicio, tarifa_aplicada, subtotal_linea)
  VALUES 
    (p_empresa_id, v_alquiler_id, v_equipo_1_id, 1, 2, 0, 7, CURRENT_DATE, 15000, 30000),
    (p_empresa_id, v_alquiler_id, v_equipo_2_id, 2, 1, 0, 4, CURRENT_DATE, 40000, 160000);

  -- 8. Movimiento Kardex por Salida
  INSERT INTO public.kardex_inventario (empresa_id, bodega_id, equipo_id, alquiler_id, tipo_movimiento, cantidad, saldo_anterior, saldo_nuevo, referencia_documento, observaciones)
  VALUES 
    (p_empresa_id, v_bodega_id, v_equipo_1_id, v_alquiler_id, 'SALIDA_ALQUILER', 2, 50, 48, 'ALQ-001', 'Despacho Inicial de Prueba'),
    (p_empresa_id, v_bodega_id, v_equipo_2_id, v_alquiler_id, 'SALIDA_ALQUILER', 1, 10, 9, 'ALQ-001', 'Despacho Inicial de Prueba');

  -- 9. Ingreso a Caja (Abono del Contrato)
  INSERT INTO public.movimientos_caja (empresa_id, tenant_id, sesion_caja_id, usuario_id, tipo, monto, concepto, beneficiario)
  VALUES (p_empresa_id, p_empresa_id, v_caja_id, p_user_id, 'INGRESO', 50000, 'Abono anticipo Alquiler #1', 'Constructora Demo S.A.S.');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
