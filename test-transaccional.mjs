import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eqruvswlpsttuyuglwts.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzI1Njk2NiwiZXhwIjoyMTAyODMyOTY2fQ.Mac4fsZ1fWAp3JX5NUwbq5ue65G_lvIIXcFgcjDBzRM';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runTransactionalTests() {
  console.log('===============================================================');
  console.log('🚀 INICIANDO PRUEBAS DE INTEGRACIÓN TRANSACCIONAL (ACID)');
  console.log('===============================================================\n');

  const testSku = `TEST-EQ-${Date.now()}`;
  const testNit = `NIT-${Date.now()}`;
  let equipoId, clienteId, alquilerId, detalleId;

  try {
    // -------------------------------------------------------------
    // PRUEBA 1: Crear Equipo de Prueba con Stock
    // -------------------------------------------------------------
    console.log('1️⃣ Creando equipo de prueba en public.equipos...');
    const { data: equipo, error: errEquipo } = await supabase
      .from('equipos')
      .insert([{
        codigo: testSku,
        nombre: 'Rotomartillo Industrial Bosch Test',
        categoria: 'Perforación',
        tarifa_diaria: 35000,
        stock_total: 5,
        stock_disponible: 5,
        stock_en_obra: 0,
        stock_mantenimiento: 0,
        estado: 'Activo'
      }])
      .select()
      .single();

    if (errEquipo) throw new Error(`Fallo creación equipo: ${errEquipo.message}`);
    equipoId = equipo.id;
    console.log(`   ✅ Equipo creado: ID ${equipoId}, SKU: ${equipo.codigo}, Stock Disponible: ${equipo.stock_disponible}`);

    // -------------------------------------------------------------
    // PRUEBA 2: Crear Cliente de Prueba
    // -------------------------------------------------------------
    console.log('\n2️⃣ Creando cliente de prueba en public.clientes...');
    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .insert([{
        nit_cedula: testNit,
        nombre: 'CONSTRUCTORA PRUEBAS INTEGRACIÓN SAS',
        telefono: '3001234567',
        email: 'contacto@constructora-test.com',
        direccion: 'Calle 100 # 15-20',
        estado: 'Activo'
      }])
      .select()
      .single();

    if (errCliente) throw new Error(`Fallo creación cliente: ${errCliente.message}`);
    clienteId = cliente.id;
    console.log(`   ✅ Cliente creado: ID ${clienteId}, Nombre: ${cliente.nombre}`);

    // -------------------------------------------------------------
    // PRUEBA 3: Creación Transaccional de Contrato (RPC crear_alquiler_transaccional)
    // -------------------------------------------------------------
    console.log('\n3️⃣ Invocando RPC crear_alquiler_transaccional (Solicitando 2 unidades)...');
    const contractPayload = {
      cliente_id: clienteId,
      estado: 'ACTIVO',
      subtotal_equipos: 210000, // 2 unids * $35k * 3 días
      flete_entrega: 30000,
      flete_recogida: 30000,
      subtotal_general: 270000,
      total: 270000,
      deposito: 50000,
      garantia_monto: 300000,
      garantia_tipo: 'Efectivo',
      observaciones: 'Prueba automatizada transaccional',
      detalles_logistica: 'Entregar en obra',
      creado_por: 'TEST_AGENT',
      items: [{
        equipo_id: equipoId,
        cantidad: 2,
        tarifa_aplicada: 35000,
        dias_contratados: 3,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: new Date(Date.now() + 3 * 86400000).toISOString()
      }]
    };

    const { data: contratoResult, error: errContrato } = await supabase.rpc('crear_alquiler_transaccional', {
      p_payload: contractPayload
    });

    if (errContrato) throw new Error(`Fallo RPC crear_alquiler_transaccional: ${errContrato.message}`);
    alquilerId = contratoResult.id;
    console.log(`   ✅ Contrato creado atómicamente: ID ${alquilerId}, Consecutivo: ${contratoResult.consecutivo}, Saldo Pendiente: $${contratoResult.saldo_pendiente}`);

    // Verificar descuento de stock en DB
    const { data: eqActualizado } = await supabase.from('equipos').select('stock_disponible, stock_en_obra').eq('id', equipoId).single();
    console.log(`   🔎 Verificación de Stock: Disponible=${eqActualizado.stock_disponible} (Esperado: 3), En Obra=${eqActualizado.stock_en_obra} (Esperado: 2)`);
    if (eqActualizado.stock_disponible !== 3 || eqActualizado.stock_en_obra !== 2) {
      throw new Error(`Inconsistencia en descuento de inventario.`);
    }

    // Obtener ID del detalle creado
    const { data: detList } = await supabase.from('alquiler_detalles').select('id').eq('alquiler_id', alquilerId);
    detalleId = detList[0].id;

    // -------------------------------------------------------------
    // PRUEBA 4: Control de Sobreventa y Rollback Transaccional
    // -------------------------------------------------------------
    console.log('\n4️⃣ Probando sobreventa (Solicitando 10 unidades cuando solo hay 3 disponibles)...');
    const overSalePayload = {
      cliente_id: clienteId,
      subtotal_equipos: 350000,
      total: 350000,
      items: [{
        equipo_id: equipoId,
        cantidad: 10, // Excede el disponible
        tarifa_aplicada: 35000,
        dias_contratados: 1
      }]
    };

    const { error: errOversale } = await supabase.rpc('crear_alquiler_transaccional', {
      p_payload: overSalePayload
    });

    if (!errOversale) {
      throw new Error(`ERROR CRÍTICO: La transacción permitió sobreventa indebida.`);
    }
    console.log(`   ✅ Rollback exitoso. Error capturado correctamente: "${errOversale.message}"`);

    // -------------------------------------------------------------
    // PRUEBA 5: Registro de Pago y Trigger de Saldos
    // -------------------------------------------------------------
    console.log('\n5️⃣ Registrando abono de $100,000 en public.pagos...');
    const { data: pago, error: errPago } = await supabase
      .from('pagos')
      .insert([{
        alquiler_id: alquilerId,
        cliente_id: clienteId,
        monto: 100000,
        metodo_pago: 'TRANSFERENCIA',
        referencia: 'TR-TEST-998811',
        registrado_por: 'TEST_AGENT'
      }])
      .select()
      .single();

    if (errPago) throw new Error(`Fallo registro pago: ${errPago.message}`);
    console.log(`   ✅ Pago registrado: ID ${pago.id}, Monto: $${pago.monto}`);

    // Verificar recálculo del Trigger en alquileres
    const { data: alqPostPago } = await supabase.from('alquileres').select('total, deposito, total_pagado, saldo_pendiente').eq('id', alquilerId).single();
    console.log(`   🔎 Verificación de Saldos tras Trigger: Total=$${alqPostPago.total}, Depósito=$${alqPostPago.deposito}, Total Pagado=$${alqPostPago.total_pagado} (Esperado: 100000), Saldo Pendiente=$${alqPostPago.saldo_pendiente} (Esperado: 120000)`);
    if (parseFloat(alqPostPago.total_pagado) !== 100000 || parseFloat(alqPostPago.saldo_pendiente) !== 120000) {
      throw new Error(`Inconsistencia en cálculo del trigger.`);
    }

    // -------------------------------------------------------------
    // PRUEBA 6: Devolución de Equipos y Restitución de Stock
    // -------------------------------------------------------------
    console.log('\n6️⃣ Invocando RPC procesar_devolucion_alquiler (Devolviendo 2 unidades)...');
    const devolucionPayload = {
      alquiler_id: alquilerId,
      devoluciones: [{
        detalle_id: detalleId,
        cantidad_devuelta: 2,
        costo_dano: 0
      }]
    };

    const { data: devResult, error: errDev } = await supabase.rpc('procesar_devolucion_alquiler', {
      p_payload: devolucionPayload
    });

    if (errDev) throw new Error(`Fallo RPC procesar_devolucion_alquiler: ${errDev.message}`);
    console.log(`   ✅ Devolución procesada: Finalizado=${devResult.finalizado}`);

    // Verificar restitución de stock
    const { data: eqFinal } = await supabase.from('equipos').select('stock_disponible, stock_en_obra').eq('id', equipoId).single();
    console.log(`   🔎 Verificación de Stock Restituido: Disponible=${eqFinal.stock_disponible} (Esperado: 5), En Obra=${eqFinal.stock_en_obra} (Esperado: 0)`);
    if (eqFinal.stock_disponible !== 5 || eqFinal.stock_en_obra !== 0) {
      throw new Error(`Inconsistencia en restitución de inventario.`);
    }

    // Verificar estado del contrato
    const { data: alqFinal } = await supabase.from('alquileres').select('estado').eq('id', alquilerId).single();
    console.log(`   🔎 Estado final del contrato: "${alqFinal.estado}" (Esperado: FINALIZADO)`);
    if (alqFinal.estado !== 'FINALIZADO') {
      throw new Error(`El contrato no pasó a estado FINALIZADO.`);
    }

    console.log('\n===============================================================');
    console.log('🎉 TODAS LAS PRUEBAS TRANSACCIONALES PASARON CON ÉXITO (100%)');
    console.log('===============================================================');

  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBAS TRANSACCIONALES:', error.message);
    process.exit(1);
  } finally {
    // Limpieza de datos de prueba
    console.log('\n🧹 Limpiando registros de prueba...');
    if (alquilerId) {
      await supabase.from('pagos').delete().eq('alquiler_id', alquilerId);
      await supabase.from('alquiler_detalles').delete().eq('alquiler_id', alquilerId);
      await supabase.from('alquileres').delete().eq('id', alquilerId);
    }
    if (clienteId) await supabase.from('clientes').delete().eq('id', clienteId);
    if (equipoId) await supabase.from('equipos').delete().eq('id', equipoId);
    console.log('   ✅ Limpieza completada.');
  }
}

runTransactionalTests();
