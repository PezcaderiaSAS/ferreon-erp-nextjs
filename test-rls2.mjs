import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    '[test-rls2] Faltan variables de entorno requeridas: NEXT_PUBLIC_SUPABASE_URL (o SUPABASE_URL) y NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
  console.error('Ejecuta con: node --env-file=.env.development.local test-rls2.mjs');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('alquileres')
    .insert([{
      cliente_id: 57,
      estado: 'ACTIVO',
      flete_entrega: 10,
      flete_recogida: 10,
      subtotal_equipos: 10,
      subtotal_general: 10,
      deposito: 10,
      garantia_monto: 10,
      garantia_tipo: 'Letra',
      observaciones: '',
      detalles_logistica: '',
      total: 30
    }])
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

testInsert();
