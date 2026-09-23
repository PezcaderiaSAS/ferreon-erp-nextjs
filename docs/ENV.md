<!-- AUTO-GENERATED: Environment Documentation from .env.example -->
# Referencia de Variables de Entorno - Alquileres System

Las siguientes variables son requeridas para ejecutar **Alquileres System** en desarrollo local o en producción (Vercel / Supabase).

| Variable | Requerido | Descripción | Ejemplo / Formato |
|----------|:---------:|-------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL Pública del proyecto en Supabase (API endpoint HTTPS). | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima pública JWT de Supabase para acceso seguro desde el navegador. | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave service_role con bypass de RLS exclusivo para acciones administrativas UltraAdmin. NUNCA exponer al cliente. | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL con connection pooling (pgbouncer) para Prisma ORM. | `postgresql://postgres.[REF]:[PASS]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `UPSTASH_REDIS_REST_URL` | Sí | Endpoint REST API de Upstash Redis para caché distribuida e invalidación forzada de sesiones en <1s. | `https://tu-endpoint.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token de autenticación REST para Upstash Redis. | `tu-token-seguro-upstash` |
| `CRON_SECRET` | No | Token secreto tipo Bearer para autorizar la ejecución de Cron Jobs automáticos (ej. `/api/cron/check-licenses`). | `token_secreto_para_proteger_endpoints_de_cron` |
| `STRIPE_SECRET_KEY` | No | Llave secreta de Stripe para facturación SaaS de suscripciones por empresa. | `sk_test_...` |
| `NEXT_PUBLIC_APP_URL` | Sí | URL canónica base de la aplicación para redirecciones OAuth y callbacks. | `http://localhost:3000` o `https://alquileres-system.com` |
| `NODE_ENV` | Sí | Entorno de ejecución (`development`, `test` o `production`). | `development` |

<!-- AUTO-GENERATED END -->

## Directrices de Seguridad y Gobernanza de Secretos
- **Protección de Credenciales de Servidor:** `SUPABASE_SERVICE_ROLE_KEY` solo debe consumirse en Server Actions (`src/app/actions/ultraadmin.ts`) protegidas por la verificación estricta `is_ultra_admin()`. Prohibido referenciar esta variable en componentes que tengan la directiva `'use client'`.
- **Aislamiento de Sesiones en Redis:** `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` permiten la revocación atómica e inmediata de sesiones (`session:user:{id}`) cuando un administrador suspende una cuenta, evitando que tokens JWT vigentes mantengan acceso no autorizado.
- **Prefijo `NEXT_PUBLIC_`:** Todo identificador con el prefijo `NEXT_PUBLIC_` se incrusta en el paquete cliente compilado por Webpack/Turbopack. Nunca almacenes claves privadas, credenciales de base de datos ni tokens de API de terceros bajo este prefijo.
- **Configuración en CI/CD y Vercel:** Al desplegar en Vercel, asegúrate de suministrar todas las variables requeridas en los entornos `Production`, `Preview` y `Development`.
