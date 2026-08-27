import { beforeAll, afterEach } from 'vitest';

beforeAll(() => {
  // Simular variables de entorno si es necesario
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
});

afterEach(() => {
  // Limpieza global después de cada prueba
});
