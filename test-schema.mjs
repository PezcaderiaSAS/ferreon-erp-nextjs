import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eqruvswlpsttuyuglwts.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzI1Njk2NiwiZXhwIjoyMTAyODMyOTY2fQ.Mac4fsZ1fWAp3JX5NUwbq5ue65G_lvIIXcFgcjDBzRM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  // Query 1: Get existing rows to see valid 'estado' values
  const { data: rows, error: rowsErr } = await supabase.from('equipos').select('estado').limit(5);
  console.log('Existing estado values:', rows);
  
  // Try updating with 'Disponible' vs 'Activo'
  console.log('Testing constraints...');
}

checkSchema();
