import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    '[test-rls] Faltan variables de entorno requeridas: NEXT_PUBLIC_SUPABASE_URL (o SUPABASE_URL) y NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
  console.error('Ejecuta con: node --env-file=.env.development.local test-rls.mjs');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('clientes')
    .insert([{
      nit_cedula: 'TEST-RLS-' + Date.now(),
      nombre: 'Test RLS',
      telefono: '555',
      estado: 'Activo'
    }])
    .select();

  if (error) {
    console.error('Error with ANON KEY:', error);
  } else {
    console.log('Success with ANON KEY:', data);
  }
}

testInsert();
