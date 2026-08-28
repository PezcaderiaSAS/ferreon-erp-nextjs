import { createClient } from '@supabase/supabase-js';

const url = 'https://eqruvswlpsttuyuglwts.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTY5NjYsImV4cCI6MjEwMjgzMjk2Nn0.q9gvsVz6EG6hjHNDoEDcZ_BdE_8T8zBRWS481MsyZMU';

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
