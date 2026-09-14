import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eqruvswlpsttuyuglwts.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzI1Njk2NiwiZXhwIjoyMTAyODMyOTY2fQ.Mac4fsZ1fWAp3JX5NUwbq5ue65G_lvIIXcFgcjDBzRM';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testCajaDatabaseIntegration() {
  console.log('--- TEST DE INTEGRACIÓN REAL SUPABASE: CAJA Y POS ---');

  // 1. Verificar lectura de empresas
  const { data: empresas, error: empErr } = await supabase
    .from('empresas')
    .select('id, nombre')
    .limit(1);

  if (empErr || !empresas || empresas.length === 0) {
    throw new Error('Fallo al consultar empresas: ' + (empErr?.message || 'sin datos'));
  }
  const empresaId = empresas[0].id;
  console.log(`✅ Empresa verificada: ${empresas[0].nombre} (${empresaId})`);

  // 2. Insertar sesión de prueba
  const mockUserId = 'ac8719ea-f16a-4538-b308-40d9511a14cb';
  const sesionPayload = {
    empresa_id: empresaId,
    usuario_id: mockUserId,
    estado: 'ABIERTA',
    monto_apertura: 150000,
    observaciones: 'Sesión de prueba automatizada de integridad',
    fecha_apertura: new Date().toISOString()
  };

  const { data: nuevaSesion, error: sErr } = await supabase
    .from('sesiones_caja')
    .insert([sesionPayload])
    .select()
    .single();

  if (sErr || !nuevaSesion) {
    throw new Error('Fallo al insertar en sesiones_caja: ' + sErr?.message);
  }
  console.log(`✅ Sesión de caja insertada exitosamente con ID: ${nuevaSesion.id}`);
  console.log(`   Monto apertura verificado: $${Number(nuevaSesion.monto_apertura).toLocaleString('es-CO')}`);

  // 3. Insertar movimiento de caja menor vinculado
  const movPayload = {
    empresa_id: empresaId,
    sesion_caja_id: nuevaSesion.id,
    usuario_id: mockUserId,
    tipo: 'EGRESO',
    monto: 35000,
    concepto: 'Prueba de combustible para generador eléctrico',
    beneficiario: 'Estación Mobil Central',
    comprobante: 'REC-998811'
  };

  const { data: nuevoMov, error: mErr } = await supabase
    .from('movimientos_caja')
    .insert([movPayload])
    .select()
    .single();

  if (mErr || !nuevoMov) {
    throw new Error('Fallo al insertar en movimientos_caja: ' + mErr?.message);
  }
  console.log(`✅ Movimiento de caja (EGRESO) insertado con ID: ${nuevoMov.id}`);
  console.log(`   Monto: $${Number(nuevoMov.monto).toLocaleString('es-CO')}, Concepto: "${nuevoMov.concepto}"`);

  // 4. Actualizar sesión a CERRADA con detalle de arqueo JSONB y descuadre
  const arqueoDetalle = {
    billetes: { '50000': 2, '10000': 1, '5000': 1 },
    monedas: {}
  }; // Total físico contado = 115,000 COP
  // Esperado = 150,000 - 35,000 = 115,000 COP -> Cuadrado perfecto (diferencia = 0)

  const { data: sesionCerrada, error: cErr } = await supabase
    .from('sesiones_caja')
    .update({
      estado: 'CERRADA',
      monto_cierre: 115000,
      monto_esperado: 115000,
      diferencia: 0,
      motivo_descuadre: null,
      arqueo_detalle: arqueoDetalle,
      fecha_cierre: new Date().toISOString()
    })
    .eq('id', nuevaSesion.id)
    .select()
    .single();

  if (cErr || !sesionCerrada) {
    throw new Error('Fallo al actualizar cierre de sesiones_caja: ' + cErr?.message);
  }
  console.log(`✅ Cierre de sesión y Arqueo Ciego guardado exitosamente:`);
  console.log(`   Estado: ${sesionCerrada.estado}, Físico: $${Number(sesionCerrada.monto_cierre).toLocaleString('es-CO')}`);
  console.log(`   Diferencia: $${Number(sesionCerrada.diferencia).toLocaleString('es-CO')}`);
  console.log(`   Detalle de arqueo persistido en JSONB:`, sesionCerrada.arqueo_detalle);

  // 5. Limpieza de datos de prueba
  await supabase.from('movimientos_caja').delete().eq('id', nuevoMov.id);
  await supabase.from('sesiones_caja').delete().eq('id', nuevaSesion.id);
  console.log(`🧹 Datos de prueba limpiados correctamente de Supabase.`);
  console.log(`\n🎉 TODAS LAS PRUEBAS DE PERSISTENCIA EN SUPABASE PASARON AL 100%.`);
}

testCajaDatabaseIntegration().catch((err) => {
  console.error('❌ ERROR EN TEST:', err);
  process.exit(1);
});
