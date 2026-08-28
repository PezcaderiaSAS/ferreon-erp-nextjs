import { createClient } from '@supabase/supabase-js';

const url = 'https://eqruvswlpsttuyuglwts.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTY5NjYsImV4cCI6MjEwMjgzMjk2Nn0.q9gvsVz6EG6hjHNDoEDcZ_BdE_8T8zBRWS481MsyZMU';

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
