<!-- Generated: 2026-08-24 | Files scanned: 5 | Token estimate: ~400 -->
# Backend Architecture & Codemap

Este mapa refleja la capa de APIs y Middleware Edge de Next.js que se encarga de la autorización nativa con Supabase.

## Route Handlers & Middleware

- **`src/middleware.ts`**
  - Intercepta `/configuracion` y `/bodega`.
  - Lee JWT usando `@supabase/ssr`.
  - Realiza un `NextResponse.rewrite('/unauthorized')` si el `user_metadata.rol` del usuario logueado no tiene permisos suficientes.

- **`src/app/api/auth/[...all]/route.ts`**
  - *(Deprecado o en desuso)*: Contenía la matriz estática simulada de `USUARIOS_DEMO`. Ha sido reemplazado por la solución nativa.

- **`src/app/api/auth/callback/route.ts`**
  - **Método**: GET
  - Intercambia el parámetro `code` de Google OAuth por una cookie de sesión JWT válida de Supabase. Redirige a `/`.

- **`src/app/api/usuarios/route.ts`**
  - **Servicios Integrados**: `supabase.auth.admin`
  - **Privilegios**: Requiere `SUPABASE_SERVICE_ROLE_KEY`.
  - **Método GET**: Lista usuarios y sus avatares llamando a `supabase.auth.admin.listUsers()`.
  - **Método POST**: Crea usuarios y asigna `user_metadata` con el rol seleccionado y el avatar.

## Data Schemas

La base de datos es gestionada directamente por `auth.users` de PostgreSQL (Supabase Auth).
El esquema dentro del campo JSONB `raw_user_meta_data` es:
```json
{
  "nombre": "string",
  "rol": "SUPERADMIN | ADMIN | OPERADOR_BODEGA | FACTURACION_CARTERA | CONSULTOR_AUDITOR",
  "avatarUrl": "string"
}
```
