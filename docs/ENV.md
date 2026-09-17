<!-- AUTO-GENERATED: Environment Documentation from .env.example -->
# Environment Variables Reference

Las siguientes variables son necesarias para levantar el entorno de FerreOn ERP localmente o en producción (Vercel).

| Variable | Requerido | Descripción | Ejemplo |
|----------|:---------:|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL Pública del proyecto en Supabase (API endpoint). | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima pública JWT de Supabase (Frontend). | `eyJhbGciOiJIUz...` |
| `SUPABASE_SECRET_KEY` | Sí | Clave de servidor para nuevo SDK `@supabase/server`. NUNCA exponer al cliente. | `sb_secret_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave service_role para omitir RLS en acciones administrativas de UltraAdmin y auditoría transversal. | `eyJhbGciOiJIUz...` |
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL para Prisma ORM (Connection Pooling pgbouncer). | `postgresql://postgres.[REF]:[PASS]@...:6543/postgres?pgbouncer=true` |
| `UPSTASH_REDIS_REST_URL` | Sí | URL REST API de Upstash Redis (Serverless Cache, Rate Limit e invalidación atómica forzada de sesiones en <1s). | `https://tu-endpoint.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token REST de autenticación Upstash Redis. | `tu-token-seguro-upstash` |
| `CRON_SECRET` | No | Token secreto para proteger invocaciones de Cron Jobs en Vercel. | `token_secreto_cron_...` |
| `STRIPE_SECRET_KEY` | No | Llave privada de Stripe para suscripciones SaaS. | `sk_test_...` |
| `NEXT_PUBLIC_APP_URL` | Sí | URL base de la aplicación para redirecciones y callbacks. | `http://localhost:3000` |
| `NODE_ENV` | Sí | Entorno de ejecución (`development` o `production`). | `development` |

## Notas de Seguridad y Gobernanza
- **Separación de Privilegios:** `SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en Server Actions protegidas por el guard `is_ultra_admin()` (`src/app/actions/ultraadmin.ts`), garantizando que solo el rol `SUPER_ADMIN` pueda ejecutar consultas o mutaciones transversales entre empresas.
- **Revocación Atómica en Redis:** `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` son indispensables para la revocación instantánea de sesiones (`session:user:{id}`) cuando un UltraAdmin desactiva un usuario o degrada sus permisos, impidiendo accesos no autorizados con tokens JWT en caché.
- Las variables que comienzan con `NEXT_PUBLIC_` se incrustan en el bundle compilado de JavaScript del navegador. Nunca almacenes secretos, llaves maestras de API ni contraseñas bajo este prefijo.
- En despliegues en Vercel, asegúrate de configurar las variables tanto para el entorno `Preview` como para `Production`.
<!-- END AUTO-GENERATED -->
