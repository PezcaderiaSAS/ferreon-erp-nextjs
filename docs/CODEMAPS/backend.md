<!-- Generated: 2026-09-03 | Files scanned: ~15 | Token estimate: ~400 -->
# Backend Architecture & API Routes

Este mapa refleja la capa de APIs Serverless de Next.js, Middlewares Edge, la arquitectura Multi-tenant, y las integraciones de pago.

## Edge Middleware
- **`src/middleware.ts`**
  - Manejo integral de autenticación usando `@supabase/ssr`.
  - Verificación de Multi-tenancy por subdominios y headers de Tenant.
  - Rate Limiting usando Upstash Redis en Edge (previene abuso de endpoints críticos).
  - Protección de rutas basada en `user_metadata.rol`.

## API Routes (`src/app/api/`)
- **`auth/callback/route.ts`**: Intercambia código OAuth por token de sesión JWT válido de Supabase.
- **`usuarios/route.ts`**: Utiliza `SUPABASE_SERVICE_ROLE_KEY` para listar, crear e invitar usuarios con roles RBAC (Superadmin, Admin, etc).
- **`clientes/route.ts`, `equipos/route.ts`, `alquileres/route.ts`**: Controladores de acceso a datos que interactúan con los adaptadores de infraestructura para resolver los Domain Use Cases.
- **`stripe/webhook/route.ts`**: (Nuevo) Escucha eventos asíncronos de Stripe (facturas pagadas, suscripciones canceladas) y actualiza el Tenant correspondiente en la BD.
- **`stripe/checkout/route.ts`**: Inicia sesiones de Checkout dinámicas.
