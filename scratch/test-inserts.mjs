import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error('❌ Error: Variables de entorno no encontradas en .env.local');
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, anonKey);
const adminClient = createClient(supabaseUrl, serviceKey);

async function testInsert() {
  console.log('======================================================');
  console.log('🔍 PRUEBA DE INSERCIONES: ANON CLIENT VS SERVICE ROLE');
  console.log('======================================================');

  // Obtener empresa ID activa para cumplir con multitenancy
  const { data: emp, error: empErr } = await adminClient.from('empresas').select('id').limit(1).single();
  if (empErr || !emp) {
    console.error('❌ Error obteniendo empresa activa:', empErr);
    return;
  }
  const empresaId = emp.id;
  console.log(`🏢 Empresa de prueba: ${empresaId}\n`);

  // ----------------------------------------------------
  // 1. Inserción de Cliente con cliente ANON (sin sesión)
  // ----------------------------------------------------
  console.log('--- 1. Test Cliente (Anon Client) ---');
  const testNit = 'TEST-' + Date.now();
  const { data: cDataAnon, error: cErrAnon } = await anonClient
    .from('clientes')
    .insert([{
      empresa_id: empresaId,
      nit_cedula: testNit,
      nombre: 'CLIENTE TEST ANON',
      telefono: '123456789',
      direccion: 'Calle Test 123',
      email: 'anon@test.com',
      estado: 'Activo'
    }])
    .select();

  if (cErrAnon) {
    console.log('🔒 Resultado Anon:', cErrAnon.message, `(Código: ${cErrAnon.code})`);
    console.log('ℹ️ Comportamiento esperado si RLS está habilitado para usuarios no autenticados.');
  } else {
    console.log('✅ Cliente insertado con Anon:', cDataAnon);
  }

  // ----------------------------------------------------
  // 2. Inserción de Cliente con cliente ADMIN (Service Role)
  // ----------------------------------------------------
  console.log('\n--- 2. Test Cliente (Admin / Service Role) ---');
  const { data: cDataAdmin, error: cErrAdmin } = await adminClient
    .from('clientes')
    .insert([{
      empresa_id: empresaId,
      nit_cedula: testNit + '-ADMIN',
      nombre: 'CLIENTE TEST ADMIN',
      telefono: '3101234567',
      direccion: 'Avenida Test 456',
      email: 'admin@test.com',
      estado: 'Activo'
    }])
    .select()
    .single();

  if (cErrAdmin) {
    console.log('❌ Error Admin Cliente:', cErrAdmin.message);
  } else {
    console.log('✅ Cliente insertado con éxito (Admin): ID', cDataAdmin.id);
  }

  // ----------------------------------------------------
  // 3. Inserción de Proveedor con ADMIN
  // ----------------------------------------------------
  console.log('\n--- 3. Test Proveedor (Admin) ---');
  const { data: pDataAdmin, error: pErrAdmin } = await adminClient
    .from('proveedores')
    .insert([{
      empresa_id: empresaId,
      nombre: 'PROVEEDOR TEST SCRATCH',
      nit: 'NIT-PROV-' + Date.now(),
      telefono: '3209876543',
      contacto: 'Ing. Supervisor Prueba',
      email: 'prov@test.com',
      estado: 'ACTIVO'
    }])
    .select()
    .single();

  if (pErrAdmin) {
    console.log('❌ Error Proveedor:', pErrAdmin.message);
  } else {
    console.log('✅ Proveedor insertado con éxito: ID', pDataAdmin.id);
  }

  // ----------------------------------------------------
  // 4. Inserción de Equipo con ADMIN
  // ----------------------------------------------------
  console.log('\n--- 4. Test Equipo (Admin) ---');
  const { data: eqData, error: eqErr } = await adminClient
    .from('equipos')
    .insert([{
      empresa_id: empresaId,
      nombre: 'EQUIPO TEST SCRATCH',
      codigo: 'SKU-' + Date.now().toString().slice(-6),
      categoria: 'Andamios',
      tarifa_diaria: 25000,
      valor_reposicion: 300000,
      stock_total: 8,
      stock_disponible: 8,
      stock_en_obra: 0,
      stock_mantenimiento: 0,
      peso: 12,
      estado: 'Activo'
    }])
    .select()
    .single();

  if (eqErr) {
    console.log('❌ Error Equipo:', eqErr.message);
  } else {
    console.log('✅ Equipo insertado con éxito: ID', eqData.id, '| Stock Disp:', eqData.stock_disponible);
  }

  // ----------------------------------------------------
  // 5. Inserción de Cotización con ADMIN
  // ----------------------------------------------------
  console.log('\n--- 5. Test Cotización (Admin) ---');
  let cotId = null;
  if (cDataAdmin && eqData) {
    const cons = Math.floor(Date.now() / 1000) % 100000;
    const { data: cotData, error: cotErr } = await adminClient
      .from('cotizaciones')
      .insert([{
        empresa_id: empresaId,
        consecutivo: String(cons),
        cliente_id: cDataAdmin.id,
        cliente_nombre: cDataAdmin.nombre,
        cliente_documento: cDataAdmin.nit_cedula,
        cliente_telefono: cDataAdmin.telefono,
        cliente_email: cDataAdmin.email,
        fecha_emision: new Date().toISOString(),
        estado: 'BORRADOR',
        subtotal: 50000,
        total: 50000
      }])
      .select()
      .single();

    if (cotErr) {
      console.log('❌ Error Cotización:', cotErr.message);
    } else {
      cotId = cotData.id;
      console.log('✅ Cotización insertada con éxito: ID', cotId, '| Consecutivo:', cons);
    }
  }

  // ----------------------------------------------------
  // 6. Inserción de Alquiler con ADMIN
  // ----------------------------------------------------
  console.log('\n--- 6. Test Alquiler y Detalle (Admin) ---');
  let alqId = null;
  if (cDataAdmin && eqData) {
    const consAlq = Math.floor(Date.now() / 1000) % 100000 + 1;
    const { data: alqData, error: alqErr } = await adminClient
      .from('alquileres')
      .insert([{
        empresa_id: empresaId,
        consecutivo: consAlq,
        cliente_id: cDataAdmin.id,
        estado: 'ACTIVO',
        subtotal_equipos: 50000,
        total: 50000,
        saldo_pendiente: 50000,
        deposito: 0
      }])
      .select()
      .single();

    if (alqErr) {
      console.log('❌ Error Alquiler:', alqErr.message);
    } else {
      alqId = alqData.id;
      console.log('✅ Alquiler insertado con éxito: ID', alqId, '| Consecutivo:', consAlq);

      // Insertar detalle
      const { data: detData, error: detErr } = await adminClient
        .from('alquiler_detalles')
        .insert([{
          alquiler_id: alqId,
          equipo_id: eqData.id,
          empresa_id: empresaId,
          cantidad: 2,
          dias_contratados: 1,
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date(Date.now() + 86400000).toISOString(),
          tarifa_aplicada: 25000,
          subtotal_linea: 50000,
          devuelto: false,
          cantidad_devuelta: 0
        }])
        .select()
        .single();

      if (detErr) {
        console.log('❌ Error Detalle Alquiler:', detErr.message);
      } else {
        console.log('✅ Detalle de Alquiler insertado: ID', detData.id, '| Cantidad:', detData.cantidad);
      }
    }
  }

  // ----------------------------------------------------
  // 7. Limpieza Segura de Prueba
  // ----------------------------------------------------
  console.log('\n--- 7. Limpieza de Prueba ---');
  if (alqId) {
    await adminClient.from('alquiler_detalles').delete().eq('alquiler_id', alqId);
    await adminClient.from('alquileres').delete().eq('id', alqId);
  }
  if (cotId) await adminClient.from('cotizaciones').delete().eq('id', cotId);
  if (eqData) await adminClient.from('equipos').delete().eq('id', eqData.id);
  if (pDataAdmin) await adminClient.from('proveedores').delete().eq('id', pDataAdmin.id);
  if (cDataAdmin) await adminClient.from('clientes').delete().eq('id', cDataAdmin.id);
  if (cDataAnon && cDataAnon[0]) await adminClient.from('clientes').delete().eq('id', cDataAnon[0].id);

  console.log('✨ Registros de prueba eliminados correctamente. Base de datos limpia.');
  console.log('======================================================\n');
}

testInsert();
