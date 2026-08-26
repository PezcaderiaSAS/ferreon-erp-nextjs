# Referencia de Variables de Entorno

Este documento mapea la configuración necesaria en el entorno `.env.local` y los despliegues de Vercel. 

<!-- AUTO-GENERATED -->
| Variable | Requerida | Propósito | Ejemplo |
|----------|-----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Conexión pública al endpoint del API de Supabase. | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Llave anónima pública de Supabase para el cliente. | `eyJhb...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí (Backend) | Llave de superusuario con permisos Bypass RLS. NUNCA enviar al Frontend. | `eyJhb...` |
| `CRON_SECRET` | No | Token de Bearer Auth para proteger el endpoint Vercel Cron. | `tu_token_seguro` |
| `NODE_ENV` | Sí | Entorno de ejecución de Next.js (production/development). | `development` |
| `NEXT_PUBLIC_APP_URL` | Sí | Dominio base para redirecciones y webhooks (Stripe/Auth). | `http://localhost:3000` |
| `UPSTASH_REDIS_REST_URL` | No | Conexión al cache en memoria y rate-limiting (Upstash). | `https://tu-endpoint...` |
| `UPSTASH_REDIS_REST_TOKEN` | No | Token de seguridad para conectar a Redis. | `tu-token-seguro` |
<!-- AUTO-GENERATED -->
