import { z } from 'zod';

/**
 * Esquema de validación para variables públicas (expuestas en el navegador).
 * Regla de Oro: NUNCA agregar aquí variables de rol administrativo o secretos.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida'),
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
});

/**
 * Esquema de validación para variables privadas del servidor (Node.js Serverless).
 * Se valida estrictamente en runtime del backend para prevenir arranques con secretos faltantes.
 */
const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(10, 'DATABASE_URL es obligatoria para Prisma ORM'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY es obligatoria para operaciones administrativas'),
  CRON_SECRET: z.string().min(10, 'CRON_SECRET es requerido para proteger endpoints de tareas programadas'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(10).optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
});

// Verificación en runtime: Solo validar secretos de servidor cuando estemos en Node.js
const isServer = typeof window === 'undefined';

function validateEnvironment() {
  // 1. Detección preventiva de fugas: Ningún secreto de backend debe tener prefijo NEXT_PUBLIC_
  if (isServer) {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('NEXT_PUBLIC_') && (key.includes('SECRET') || key.includes('SERVICE_ROLE') || key.includes('PASSWORD'))) {
        throw new Error(
          `[CRITICAL_SECURITY_BREACH] La variable sensible '${key}' contiene el prefijo NEXT_PUBLIC_. Esto expondría credenciales al navegador. Corrija su archivo .env.local inmediatamente.`
        );
      }
    }
  }

  // 2. En entorno de test unitario (Vitest), proveer fallbacks seguros si no hay .env cargado
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

  if (isTest) {
    return {
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-test-environment',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5432/postgres',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key-test',
      CRON_SECRET: process.env.CRON_SECRET || 'test-cron-secret-123456',
    };
  }

  if (isServer) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error('❌ [CONFIG_ENV] Error de validación en variables de entorno del servidor:');
      console.error(parsed.error.flatten().fieldErrors);
      // Advertencia en dev para no bloquear tooling, excepción estricta en producción
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Variables de entorno incompletas en producción. El servidor no puede iniciar.');
      }
    }
    return parsed.success ? parsed.data : (process.env as any);
  } else {
    const parsed = clientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
    if (!parsed.success) {
      console.warn('⚠️ [CONFIG_ENV] Variables públicas de Supabase faltantes en el cliente:', parsed.error.flatten().fieldErrors);
    }
    return parsed.success ? parsed.data : (process.env as any);
  }
}

export const env = validateEnvironment();
