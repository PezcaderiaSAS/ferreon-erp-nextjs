<!-- Generated: 2026-09-03 | Files scanned: ~20 | Token estimate: ~420 -->
# Backend Architecture & API Routes

Este mapa refleja la capa de APIs Serverless de Next.js, Middlewares Edge, adaptadores de autenticación SSR y políticas anti-caché.

## Edge Middleware & SSR Client
- **`src/middleware.ts`**:
  - Manejo integral de autenticación usando `@supabase/ssr` con cookies `getAll` y `setAll`.
  - Rate Limiting con Upstash Redis en Edge (ventana deslizante perimetral).
  - Verificación y protección RBAC basada en `user_metadata.rol`.
- **`src/infrastructure/persistence/supabase/server.ts`**:
  - `createServerSupabaseClient()`: Implementa el estándar `getAll()` y `setAll()` para ensamblar JWTs fragmentados (chunked cookies `sb-*-auth-token.0`, `.1`) previniendo desincronizaciones de sesión al operar concurrentemente desde múltiples dispositivos.
  - `createAdminSupabaseClient()`: Cliente privilegiado (`service_role`) para operaciones que eluden RLS (idempotencia, RPCs atómicas críticas).

## API Routes (`src/app/api/`)
- **`clientes/route.ts`, `equipos/route.ts`, `alquileres/route.ts`**:
  - Lectura read-through sobre Upstash Redis Multi-Tenant + DB PostgreSQL con RLS.
  - **Protección Anti-Caché Safari/WebKit**: Emisión de cabeceras `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`, `Pragma: no-cache` y `Expires: 0` para forzar frescura absoluta de datos en navegadores macOS.
- **`auth/callback/route.ts`**: Intercambia código OAuth por token de sesión JWT de Supabase.
- **`usuarios/route.ts`**: Gestión RBAC de usuarios con `service_role`.
- **`webhooks/stripe/route.ts`**: Procesamiento asíncrono de eventos de suscripción y facturación.
