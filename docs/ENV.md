<!-- AUTO-GENERATED: Environment Documentation from .env.example -->
# Environment Variables Reference

Las siguientes variables son necesarias para levantar el entorno de FerreOn ERP localmente o en producción (Vercel).

| Variable | Requerido | Descripción | Ejemplo |
|----------|:---------:|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL Pública del proyecto en Supabase (API endpoint). | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima pública JWT de Supabase (Frontend). | `eyJhbGciOiJIUz...` |
| `SUPABASE_SECRET_KEY` | Sí | Clave de servidor para nuevo SDK `@supabase/server`. NUNCA exponer al cliente. | `sb_secret_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave clásica service_role para omitir RLS en acciones administrativas y de auditoría. | `eyJhbGciOiJIUz...` |
| `UPSTASH_REDIS_REST_URL` | Sí | URL REST API de Upstash Redis (Serverless Cache y Rate Limit). | `https://tu-endpoint.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token REST de autenticación Upstash Redis. | `tu-token-seguro-upstash` |
| `STRIPE_SECRET_KEY` | No | Llave privada de Stripe para suscripciones SaaS. | `sk_test_...` |
| `NEXT_PUBLIC_APP_URL` | Sí | URL base de la aplicación para redirecciones y callbacks. | `http://localhost:3000` |
| `NODE_ENV` | Sí | Entorno de ejecución (`development` o `production`). | `development` |

## Notas de Seguridad
- Las variables que comienzan con `NEXT_PUBLIC_` se incrustan en el bundle compilado de JavaScript del navegador. Nunca almacenes secretos, llaves maestras de API ni contraseñas bajo este prefijo.
- En despliegues en Vercel, asegúrate de configurar las variables tanto para el entorno `Preview` como para `Production`.
<!-- END AUTO-GENERATED -->
