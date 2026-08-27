import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eqruvswlpsttuyuglwts.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTY5NjYsImV4cCI6MjEwMjgzMjk2Nn0.q9gvsVz6EG6hjHNDoEDcZ_BdE_8T8zBRWS481MsyZMU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('Fetching equipos...');
  const { data, error } = await supabase.from('equipos').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

main();
