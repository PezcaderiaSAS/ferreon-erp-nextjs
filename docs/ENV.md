# Configuración de Entorno (Environment Variables)

Este documento detalla las variables de entorno requeridas para ejecutar el proyecto Alquileres System.

<!-- AUTO-GENERATED -->
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase (Cliente/Server) | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima pública de Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave administrativa (bypass RLS). NUNCA exponer al cliente | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `DATABASE_URL` | Sí | Cadena de conexión Postgres (Transaction Pooling recomendado) | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `CRON_SECRET` | No | Token para proteger endpoints Vercel Cron | `mi-secreto-super-seguro` |
| `NODE_ENV` | No | Entorno de ejecución (`development`, `production`) | `development` |
| `NEXT_PUBLIC_APP_URL` | Sí | URL base de la aplicación (usada para callbacks) | `http://localhost:3000` |
| `UPSTASH_REDIS_REST_URL` | Sí | Endpoint de la API REST de Upstash Redis | `https://tu-endpoint-upstash.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token de acceso para Upstash Redis | `tu-token-seguro-upstash` |
<!-- AUTO-GENERATED -->
