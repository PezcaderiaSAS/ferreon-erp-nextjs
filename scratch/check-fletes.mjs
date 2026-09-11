import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('alquileres').select('*').order('id', { ascending: false }).limit(3);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('--- Ultimos 3 alquileres ---');
  data.forEach(a => {
    console.log(`ID: ${a.id}, Consecutivo: ${a.consecutivo}, Cliente: ${a.cliente_id}`);
    console.log(`  flete_entrega: ${a.flete_entrega}, flete_recogida: ${a.flete_recogida}, valor_transporte: ${a.valor_transporte}`);
    console.log(`  subtotal_equipos: ${a.subtotal_equipos}, total_general: ${a.total_general}, total: ${a.total}`);
  });
  console.log('\nTodas las columnas:', Object.keys(data[0] || {}));
}

check();
