import { createClient } from '@supabase/supabase-js';

const url = 'https://eqruvswlpsttuyuglwts.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTY5NjYsImV4cCI6MjEwMjgzMjk2Nn0.q9gvsVz6EG6hjHNDoEDcZ_BdE_8T8zBRWS481MsyZMU';

const supabase = createClient(url, anonKey);

async function test() {
  const { data, error } = await supabase
    .from('equipos')
    .insert([{
      codigo: 'TEST-SKU-' + Date.now(),
      nombre: 'Test Equipo',
      categoria: 'Herramientas Manuales',
      tarifa_diaria: 1000,
      stock_total: 10,
      stock_disponible: 10,
      stock_en_obra: 0,
      estado: 'Activo'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error al crear:', error);
  } else {
    console.log('Exito al crear:', data);
    
    // Test Edit
    const { data: updateData, error: updateError } = await supabase
      .from('equipos')
      .update({ nombre: 'Test Update' })
      .eq('id', data.id)
      .select()
      .single();
      
    if (updateError) console.error('Error edit:', updateError);
    else console.log('Exito edit:', updateData);
  }
}

test();
