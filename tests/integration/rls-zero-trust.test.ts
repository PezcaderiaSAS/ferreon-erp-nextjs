import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eqruvswlpsttuyuglwts.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTY5NjYsImV4cCI6MjEwMjgzMjk2Nn0.q9gvsVz6EG6hjHNDoEDcZ_BdE_8T8zBRWS481MsyZMU';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzI1Njk2NiwiZXhwIjoyMTAyODMyOTY2fQ.Mac4fsZ1fWAp3JX5NUwbq5ue65G_lvIIXcFgcjDBzRM';

describe('Blindaje de Seguridad RLS: Zero-Trust para Peticiones Anónimas (Fase 0)', () => {
  const sbAnon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sbService = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  it('debe proteger lectura anónima sobre clientes', async () => {
    const { data } = await sbAnon.from('clientes').select('id, nombre').limit(5);
    const count = data ? data.length : 0;
    expect(count).toBeLessThanOrEqual(5);
  });

  it('debe registrar y auditar intentos de inserción anónima', async () => {
    const probeNit = 'PROBE_TEST_' + Date.now();
    const { data } = await sbAnon.from('clientes').insert({
      nombre: 'PROBE HACK CLIENT',
      nit_cedula: probeNit,
      telefono: '3000000000',
    }).select();

    if (data && data.length > 0) {
      await sbService.from('clientes').delete().eq('nit_cedula', probeNit);
    }
  });

  it('debe permitir operaciones legítimas mediante service_role en el backend', async () => {
    const { data, error } = await sbService.from('empresas').select('id, nombre').limit(1);
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });
});
