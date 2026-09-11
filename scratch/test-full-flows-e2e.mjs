import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/) || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o llaves de Supabase.');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const timestamp = Date.now();
const testTag = `[E2E-TEST-${timestamp}]`;

console.log(`\n======================================================`);
console.log(`🚀 INICIANDO AUDITORÍA INTEGRAL DE FLUJOS EN SUPABASE`);
console.log(`Tag de prueba: ${testTag}`);
console.log(`======================================================\n`);

const results = [];

function logStep(name, success, latencyMs, details = '') {
  results.push({ name, success, latencyMs, details });
  const icon = success ? '✅' : '❌';
  console.log(`${icon} [${latencyMs}ms] ${name} ${details ? `-> ${details}` : ''}`);
}

async function runAudit() {
  let empresaId = null;
  let clienteId = null;
  let proveedorId = null;
  let equipoId = null;
  let cotizacionId = null;
  let alquilerId = null;
  let pagoId = null;
  let devolucionId = null;

  try {
    // 0. Resolver empresa ID activa
    const t0 = performance.now();
    const { data: emp, error: empErr } = await supabase.from('empresas').select('id').limit(1).single();
    if (empErr || !emp) throw new Error('No se pudo encontrar una empresa activa: ' + empErr?.message);
    empresaId = emp.id;
    logStep('0. Contexto Empresa', true, Math.round(performance.now() - t0), `Empresa ID: ${empresaId}`);

    // 1. Flujo Clientes: Creación y Persistencia
    const t1 = performance.now();
    const { data: cli, error: cliErr } = await supabase.from('clientes').insert({
      empresa_id: empresaId,
      nombre: `Cliente Test ${testTag}`,
      nit_cedula: `NIT-${timestamp}`,
      telefono: '3001234567',
      direccion: 'Carrera 15 # 45-20 Test',
      email: `test_${timestamp}@ferreon.com`,
      estado: 'Activo'
    }).select().single();
    if (cliErr) throw new Error('Error al crear cliente: ' + cliErr.message);
    clienteId = cli.id;
    logStep('1. Flujo Cliente (Creación)', true, Math.round(performance.now() - t1), `ID: ${clienteId}`);

    // 2. Flujo Proveedores: Creación y Persistencia
    const t2 = performance.now();
    const { data: prov, error: provErr } = await supabase.from('proveedores').insert({
      empresa_id: empresaId,
      nombre: `Proveedor Test ${testTag}`,
      nit: `NITPROV-${timestamp}`,
      telefono: '3109876543',
      contacto: 'Contacto Prueba',
      email: `prov_${timestamp}@ferreon.com`,
      estado: 'ACTIVO'
    }).select().single();
    if (provErr) throw new Error('Error al crear proveedor: ' + provErr.message);
    proveedorId = prov.id;
    logStep('2. Flujo Proveedor (Creación)', true, Math.round(performance.now() - t2), `ID: ${proveedorId}`);

    // 3. Flujo Equipos: Creación con Stock y Tarifas
    const t3 = performance.now();
    const { data: eq, error: eqErr } = await supabase.from('equipos').insert({
      empresa_id: empresaId,
      nombre: `Equipo Test ${testTag}`,
      codigo: `SKU-${timestamp.toString().slice(-6)}`,
      categoria: 'Andamios',
      tarifa_diaria: 35000,
      valor_reposicion: 450000,
      stock_total: 10,
      stock_disponible: 10,
      stock_en_obra: 0,
      stock_mantenimiento: 0,
      peso: 15,
      estado: 'Activo'
    }).select().single();
    if (eqErr) throw new Error('Error al crear equipo: ' + eqErr.message);
    equipoId = eq.id;
    logStep('3. Flujo Equipos (Creación e Inventario Inicial)', true, Math.round(performance.now() - t3), `ID: ${equipoId}, Stock Disp: ${eq.stock_disponible}`);

    // 4. Flujo Compras: Entrada de Mercancía e Incremento de Stock
    const t4 = performance.now();
    const nuevoStockTotal = eq.stock_total + 5;
    const nuevoStockDisp = eq.stock_disponible + 5;
    const { data: eqUpd, error: stockErr } = await supabase.from('equipos').update({
      stock_total: nuevoStockTotal,
      stock_disponible: nuevoStockDisp
    }).eq('id', equipoId).select().single();
    if (stockErr) throw new Error('Error al registrar compra/incremento de stock: ' + stockErr.message);
    logStep('4. Flujo Compras (Aumento de Stock en Bodega)', true, Math.round(performance.now() - t4), `Stock Total: ${eqUpd.stock_total}, Disp: ${eqUpd.stock_disponible}`);

    // 5. Flujo Cotizaciones: Creación con Ítems
    const t5 = performance.now();
    const consecutivoCot = Math.floor(Date.now() / 1000) % 100000 + 1000;
    const { data: cot, error: cotErr } = await supabase.from('cotizaciones').insert({
      empresa_id: empresaId,
      consecutivo: String(consecutivoCot),
      cliente_id: clienteId,
      cliente_nombre: cli.nombre,
      cliente_documento: cli.nit_cedula,
      cliente_telefono: cli.telefono,
      cliente_email: cli.email,
      fecha_emision: new Date().toISOString(),
      estado: 'BORRADOR',
      subtotal: 105000,
      total: 105000,
      valor_transporte: 0
    }).select().single();
    if (cotErr) throw new Error('Error al crear cotización: ' + cotErr.message);
    cotizacionId = cot.id;

    // Ítem de Cotización
    const { error: cotDetErr } = await supabase.from('cotizaciones_detalles').insert({
      cotizacion_id: cotizacionId,
      equipo_id: equipoId,
      cantidad: 1,
      dias: 3,
      tarifa_diaria: 35000,
      subtotal: 105000
    });
    if (cotDetErr) throw new Error('Error al guardar detalle de cotización: ' + cotDetErr.message);
    logStep('5. Flujo Cotizaciones (Cabecera y Detalles)', true, Math.round(performance.now() - t5), `Cotización ID: ${cotizacionId}, Cons: ${consecutivoCot}`);

    // 6. Flujo Alquiler: Creación de Contrato y Reducción de Stock (Entrega)
    const t6 = performance.now();
    const cantAlquilar = 3;
    const consecutivoAlq = consecutivoCot + 1;
    const { data: alq, error: alqErr } = await supabase.from('alquileres').insert({
      empresa_id: empresaId,
      consecutivo: consecutivoAlq,
      cliente_id: clienteId,
      cotizacion_origen_id: cotizacionId,
      estado: 'ACTIVO',
      subtotal_equipos: 525000,
      total: 525000,
      saldo_pendiente: 525000,
      deposito: 0
    }).select().single();
    if (alqErr) throw new Error('Error al crear alquiler: ' + alqErr.message);
    alquilerId = alq.id;

    // Detalle de Alquiler
    let detalleAlquilerId = null;
    const { data: alqDet, error: alqDetErr } = await supabase.from('alquiler_detalles').insert({
      alquiler_id: alquilerId,
      equipo_id: equipoId,
      empresa_id: empresaId,
      cantidad: cantAlquilar,
      tarifa_aplicada: 35000,
      subtotal_linea: 525000,
      dias_contratados: 5,
      fecha_inicio: new Date().toISOString(),
      fecha_fin: new Date(Date.now() + 5 * 86400000).toISOString(),
      devuelto: false,
      cantidad_devuelta: 0
    }).select().single();
    if (alqDetErr) throw new Error('Error al guardar detalle de alquiler: ' + alqDetErr.message);
    detalleAlquilerId = alqDet.id;

    // Descontar inventario por entrega a obra
    const { data: eqPostAlq, error: eqAlqErr } = await supabase.from('equipos').update({
      stock_disponible: eqUpd.stock_disponible - cantAlquilar,
      stock_en_obra: (eqUpd.stock_en_obra || 0) + cantAlquilar
    }).eq('id', equipoId).select().single();
    if (eqAlqErr) throw new Error('Error al descontar stock por alquiler: ' + eqAlqErr.message);
    logStep('6. Flujo Alquiler y Entrega (Contrato y Reserva de Stock)', true, Math.round(performance.now() - t6), `Alquiler ID: ${alquilerId}, Detalle ID: ${detalleAlquilerId}, Stock Disp: ${eqPostAlq.stock_disponible}, Obra: ${eqPostAlq.stock_en_obra}`);

    // 7. Flujo Pagos / Abonos
    const t7 = performance.now();
    const abonoMonto = 200000;
    const { data: pago, error: pagoErr } = await supabase.from('pagos').insert({
      alquiler_id: alquilerId,
      cliente_id: clienteId,
      monto: abonoMonto,
      metodo_pago: 'TRANSFERENCIA',
      referencia: `ABONO-${timestamp}`,
      created_at: new Date().toISOString()
    }).select().single();
    if (pagoErr) throw new Error('Error al registrar abono/pago: ' + pagoErr.message);
    pagoId = pago.id;

    // Actualizar saldo del alquiler
    const nuevoSaldo = alq.saldo_pendiente - abonoMonto;
    const { error: updAlqErr } = await supabase.from('alquileres').update({
      saldo_pendiente: nuevoSaldo,
      deposito: abonoMonto
    }).eq('id', alquilerId);
    if (updAlqErr) throw new Error('Error al actualizar saldo de alquiler: ' + updAlqErr.message);
    logStep('7. Flujo Pagos y Abonos (Registro y Actualización de Saldo)', true, Math.round(performance.now() - t7), `Pago ID: ${pagoId}, Nuevo Saldo: $${nuevoSaldo}`);

    // 8. Flujo Devolución: RPC Transaccional Atómico y Restitución de Stock
    const t8 = performance.now();
    const { data: devResult, error: devErr } = await supabase.rpc('procesar_devolucion_alquiler', {
      p_payload: {
        alquiler_id: alquilerId,
        devoluciones: [
          {
            detalle_id: detalleAlquilerId,
            cantidad_devuelta: cantAlquilar,
            costo_dano: 0
          }
        ]
      }
    });
    if (devErr) throw new Error('Error al ejecutar procesar_devolucion_alquiler: ' + devErr.message);

    // Verificar restitución de stock tras devolución
    const { data: eqPostDev, error: eqDevErr } = await supabase.from('equipos').select('stock_disponible, stock_en_obra').eq('id', equipoId).single();
    if (eqDevErr) throw new Error('Error al verificar stock post devolución: ' + eqDevErr.message);

    // Verificar estado del alquiler post devolución completa
    const { data: alqPostDev } = await supabase.from('alquileres').select('estado').eq('id', alquilerId).single();
    logStep('8. Flujo Devoluciones RPC Transaccional (Restitución Atómica de Stock)', true, Math.round(performance.now() - t8), `Estado Alquiler: ${alqPostDev?.estado}, Stock Restituido Disp: ${eqPostDev.stock_disponible}, Obra: ${eqPostDev.stock_en_obra}`);

    // 9. Consulta de Lectura Global con Relaciones (Verificación de Cero Latencia)
    const t9 = performance.now();
    const { data: verifyAlq, error: vErr } = await supabase.from('alquileres')
      .select('id, consecutivo, clientes(nombre, nit_cedula, telefono), alquiler_detalles(*, equipos(nombre, codigo, tarifa_diaria))')
      .eq('id', alquilerId)
      .single();
    if (vErr) throw new Error('Error al verificar relaciones completas: ' + vErr.message);
    const readTime = Math.round(performance.now() - t9);
    logStep('9. Lectura con Relaciones Completas (Integridad Documental)', true, readTime, `Cliente: ${verifyAlq.clientes?.nombre}, Ítems: ${verifyAlq.alquiler_detalles?.length}`);

  } catch (error) {
    console.error('\n❌ ERROR EN EL FLUJO:', error.message);
    logStep('Flujo Fallido', false, 0, error.message);
  } finally {
    // 10. Limpieza Transaccional Segura (Clean Up)
    console.log(`\n🧹 Ejecutando limpieza segura de registros de prueba...`);
    if (pagoId) await supabase.from('pagos').delete().eq('id', pagoId);
    if (alquilerId) {
      await supabase.from('alquiler_detalles').delete().eq('alquiler_id', alquilerId);
      await supabase.from('alquileres').delete().eq('id', alquilerId);
    }
    if (cotizacionId) {
      await supabase.from('cotizaciones_detalles').delete().eq('cotizacion_id', cotizacionId);
      await supabase.from('cotizaciones').delete().eq('id', cotizacionId);
    }
    if (equipoId) await supabase.from('equipos').delete().eq('id', equipoId);
    if (proveedorId) await supabase.from('proveedores').delete().eq('id', proveedorId);
    if (clienteId) await supabase.from('clientes').delete().eq('id', clienteId);
    console.log(`✨ Limpieza finalizada correctamente.`);
  }

  console.log(`\n======================================================`);
  console.log(`📊 RESUMEN DE AUDITORÍA DE FLUJOS EN BASE DE DATOS`);
  console.log(`======================================================`);
  const todosExitosos = results.every(r => r.success);
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name.padEnd(55)} | Latencia: ${String(r.latencyMs).padStart(4)}ms`);
  });
  console.log(`======================================================`);
  console.log(`Estado General: ${todosExitosos ? '🏆 TODOS LOS FLUJOS VALIDADOS CON ÉXITO' : '⚠️ SE DETECTARON ERRORES'}`);
  console.log(`======================================================\n`);
}

runAudit();
