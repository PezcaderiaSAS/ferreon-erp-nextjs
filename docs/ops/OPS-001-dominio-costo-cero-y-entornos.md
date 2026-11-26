# OPS-001: Gobernanza de Dominio a Costo $0, Hardening de Crawlers y Separación de Entornos

> **Proyecto Vercel:** `alquileres-erp-nextjs` (`prj_gUcdNFlzpkGEJKw5lit5l0lnd4uU` / Org `team_WPyjpiE2nTUFMqd4bn0arY31`)
> **Alcance:** Remediación operativa `OPS-001` para **Alquileres System** (Next.js 14 App Router + Vercel + Supabase PostgreSQL 17 + Upstash Redis).
> **Regla de Oro:** Nunca registrar ni confirmar en Git llaves reales, tokens, contraseñas ni JWTs. Usar exclusivamente los dashboards oficiales o archivos `.env*.local` ignorados por Git.

---

## 1. Resumen Ejecutivo y Arquitectura de Entornos

Actualmente la URL legacy `alquileres-erp-nextjs-ruby.vercel.app` quedó expuesta sin política restrictiva de rastreo (`robots.txt` ni `X-Robots-Tag`) y con riesgo de mezcla entre despliegues *Preview* y *Producción*. A partir de esta remediación:

1. **Bloqueo por defecto (*Default-Deny*):** `src/app/robots.ts` (`force-dynamic`), `src/middleware.ts` y `next.config.mjs` bloquean la indexación (`Disallow: /` y `X-Robots-Tag: noindex, nofollow`) en `development`, `preview` y en `production` mientras `ALLOW_INDEXING` sea `'false'` (o esté vacío).
2. **Rutas internas siempre protegidas:** Aun con `ALLOW_INDEXING=true` en producción, las rutas operativas (`/dashboard`, `/alquileres`, `/cotizaciones`, `/subcontrataciones`, `/api`, `/auth`, `/admin`, etc.) y el host legacy `alquileres-erp-nextjs-ruby.vercel.app` mantienen `X-Robots-Tag: noindex, nofollow` y `Disallow`.
3. **Aislamiento estricto por entorno:** Producción y Preview apuntan a proyectos Supabase, bases PostgreSQL y caché Upstash Redis completamente independientes.

---

## Sección A — Opciones de Dominio a Costo `$0` y Configuración DNS

Para eliminar la exposición de `alquileres-erp-nextjs-ruby.vercel.app` sin adquirir un dominio comercial de pago, existen dos alternativas verificadas a costo **$0**:

### Opción 1 (Inmediata, $0, sin DNS externo): Subdominio `.vercel.app` consolidado
- En **Vercel Dashboard → Project (`alquileres-erp-nextjs`) → Settings → Domains**, agrega o define un subdominio limpio y representativo (por ejemplo `alquileres-system.vercel.app` o el que esté disponible en tu cuenta) como **Primary Domain** en el scope **Production**.
- Configura el subdominio legacy `alquileres-erp-nextjs-ruby.vercel.app` con redirección **301** hacia ese dominio primario.
- Ventaja: certificado TLS automático, cero dependencia de registradores externos y costo `$0` permanente.

### Opción 2 ($0 con subdominio comunitario gratuito): `dpdns.org` / `eu.org` / `is-a.dev`
- Registra un subdominio gratuito en un proveedor compatible con registros DNS estándar (por ejemplo **DigitalPlat `dpdns.org`** o **`eu.org`**; evitar Freenom por estar discontinuado).
- En **Vercel Dashboard → Settings → Domains**, añade tu subdominio elegido (ej. `alquileres-system.dpdns.org`) y crea los registros DNS indicados por Vercel en tu proveedor gratuito:
  - Registro `A` para raíz (`@`): `76.76.21.21` (si aplica al subdominio), o
  - Registro `CNAME` para el subdominio: `cname.vercel-dns.com`.
- Espera la propagación DNS y verifica que el estado en Vercel muestre **Valid Configuration** con TLS emitido.

### Paso obligatorio en Supabase Auth tras definir el dominio `$0`
Independientemente de la opción elegida, actualiza **Supabase Dashboard (Proyecto Producción) → Authentication → URL Configuration**:
- **Site URL:** `https://<tu-dominio-canonico-costo-cero>`
- **Redirect URLs:**
  - `https://<tu-dominio-canonico-costo-cero>/api/auth/callback`
  - `https://*-<tu-scope>.vercel.app/api/auth/callback` (solo si pruebas OAuth en Preview contra el proyecto Supabase Preview, configurándolo en el proyecto **Preview**).

---

## Sección B — Separación de Variables en Vercel Dashboard (`Production` vs `Preview` vs `Development`)

En **Vercel Dashboard → Project (`alquileres-erp-nextjs`) → Settings → Environment Variables**, **DESMARCA siempre "All Environments"** al crear credenciales sensibles. Usa las plantillas `.env.production.example`, `.env.preview.example` y `.env.example` del repositorio como guía exacta:

| Variable | Scope `Production` | Scope `Preview` | Scope `Development` (Local) |
| :--- | :--- | :--- | :--- |
| `VERCEL_ENV` | Automático (`production`) | Automático (`preview`) | No definir (o `development`) |
| `NEXT_PUBLIC_APP_URL` | `https://<dominio-canonico>` | URL del entorno preview | `http://localhost:3000` |
| `CANONICAL_APP_HOST` | `<dominio-canonico>` (sin `https://` ni `/`) | **VACÍO** (obligatorio) | **VACÍO** |
| `ALLOW_INDEXING` | `'false'` al inicio; `'true'` solo tras verificar 301 + GSC | **`'false'`** (siempre) | **`'false'`** |
| `LEGACY_VERCEL_HOSTS` | `alquileres-erp-nextjs-ruby.vercel.app` | `alquileres-erp-nextjs-ruby.vercel.app` | `alquileres-erp-nextjs-ruby.vercel.app` |
| `PRODUCTION_SUPABASE_REF` | *(opcional)* | Ref público del proyecto PROD (para diagnóstico anti-cruce) | *(opcional)* |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase **PROD** | Proyecto Supabase **PREVIEW** | Proyecto Supabase **DEV/PREVIEW** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key **PROD (rotada)** | Anon Key **PREVIEW** | Anon Key **DEV/PREVIEW** |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role **PROD (rotada)** | Service Role **PREVIEW** | Service Role **DEV/PREVIEW** |
| `DATABASE_URL` | Pooler **PROD** puerto `6543` (`?pgbouncer=true`) | Pooler **PREVIEW** puerto `6543` (`?pgbouncer=true`) | Pooler **DEV** puerto `6543` |
| `DIRECT_URL` | Direct **PROD** puerto `5432` | Direct **PREVIEW** puerto `5432` | Direct **DEV** puerto `5432` |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | Instancia Redis **PROD** | Instancia Redis **PREVIEW** | Instancia Redis **DEV** |
| `STRIPE_SECRET_KEY` / `WEBHOOK_SECRET` | Llaves **Live** (`sk_live_...`) | Llaves **Test** (`sk_test_...`) | Llaves **Test** (`sk_test_...`) |

> **Regla crítica:** Mantener `CANONICAL_APP_HOST` **vacío** en `Preview` y `Development` garantiza que `src/middleware.ts` y `next.config.mjs` nunca ejecuten redirecciones 301 desde ramas de prueba hacia Producción.

---

## Sección C — Proyecto Supabase Preview Separado y Ejecución de `supabase/migrations/`

Para cumplir con el aislamiento real de datos entre entornos a costo `$0`:

1. **Crear proyecto Supabase independiente:**
   - En **Supabase Dashboard**, crea un segundo proyecto en el plan gratuito (`$0`), por ejemplo `alquileres-erp-preview`, distinto del proyecto de producción (`eqruvswlpsttuyuglwts`).
2. **Aplicar esquema y migraciones en orden cronológico:**
   - Vincula o ejecuta las migraciones de `supabase/migrations/` en el proyecto Preview:
     ```bash
     supabase link --project-ref <REF_PROYECTO_PREVIEW>
     supabase db push
     ```
   - Si no cuentas con Supabase CLI en tu máquina local, ejecuta los archivos `.sql` de `supabase/migrations/` en estricto orden cronológico desde **Supabase Dashboard (Preview) → SQL Editor**.
3. **Cargar datos de prueba sintéticos:**
   - Ejecuta únicamente `supabase/seed_clean.sql` sobre el proyecto Preview. **Está prohibido** restaurar volcados con datos reales de clientes o facturación de producción en el entorno Preview.
4. **Configurar puertos PostgreSQL según `docs/memory-bank/techContext.md`:**
   - **`DATABASE_URL` (Runtime Serverless / Vercel):** usar obligatoriamente el **puerto `6543`** (Transaction Pooler PgBouncer) con `?pgbouncer=true` para evitar agotamiento de conexiones bajo concurrencia.
   - **`DIRECT_URL` (Migraciones / Prisma CLI):** usar obligatoriamente el **puerto `5432`** (Session Direct) exclusivamente para `prisma migrate`, `prisma db push` y scripts administrativos.

---

## Sección D — Aviso Obligatorio de Rotación de Llaves (Secret Hygiene)

Durante la auditoría de `OPS-001` se detectó que en el historial de Git y en varios scripts del repositorio quedaron incrustadas URLs y llaves JWT (`anon` y `service_role`) correspondientes al proyecto de producción (`eqruvswlpsttuyuglwts`) y a un proyecto auxiliar (`wktqhooudfbajlpefgpy`).

- **Archivos remediados en M4:** `test-rls.mjs` y `test-rls2.mjs` fueron refactorizados para leer únicamente `process.env.NEXT_PUBLIC_SUPABASE_URL` (o `SUPABASE_URL`) y `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, fallando de manera explícita (`exit 1`) si no se cargan variables de entorno.
- **Otros archivos rastreados detectados para remediación y seguimiento:**
  - `test-equipos.mjs`
  - `test-schema.mjs`
  - `test-supabase.mjs`
  - `test-transaccional.mjs`
  - `scripts/update-cliente-b.js`
  - `scripts/verify-live-db-flows.ts`
  - `tests/integration/rls-zero-trust.test.ts` (bajo alcance de seguridad/M1)

### Procedimiento obligatorio de rotación inmediata
Limpiar los archivos en el commit actual **no invalida** los tokens ya registrados en commits anteriores. Ejecuta los siguientes pasos en **Supabase Dashboard (Producción)**:

1. Ve a **Project Settings → API → JWT Settings / API Keys**.
2. Genera o rota el **JWT Secret** y/o las nuevas llaves `anon` y `service_role` (según la consola vigente de Supabase).
3. Actualiza inmediatamente las nuevas llaves en:
   - **Vercel Dashboard → Environment Variables (Scope: `Production`)**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
   - Tus archivos locales ignorados por Git (`.env.development.local` / `.env.local`).
4. Lanza un **Redeploy** en Vercel Producción para que los lambdas y el Edge Middleware tomen las llaves rotadas.
5. Planifica en el siguiente mantenimiento la eliminación de literales en los scripts restantes arriba listados y, si el repositorio es público o compartido, evalúa purgar el historial con `git filter-repo`.

---

## Sección E — Configuración de Redirecciones 301 en Vercel / `CANONICAL_APP_HOST` y Verificación

### 1. Activar redirección 301 hacia el dominio canónico `$0`
1. En **Vercel Dashboard → Project → Settings → Domains**:
   - Configura tu dominio canónico `$0` como **Primary**.
   - En el dominio legacy `alquileres-erp-nextjs-ruby.vercel.app`, haz clic en **Edit → Redirect to `<tu-dominio-canonico>`** con código **301 (Moved Permanently)**.
2. En **Vercel Dashboard → Settings → Environment Variables (Scope: `Production`)**:
   - Define `CANONICAL_APP_HOST=<tu-dominio-canonico>` (solo hostname, sin `https://` ni `/`).
   - Define `NEXT_PUBLIC_APP_URL=https://<tu-dominio-canonico>`.
   - Mantén `LEGACY_VERCEL_HOSTS=alquileres-erp-nextjs-ruby.vercel.app`.
   - Una vez verificado el 301, cambia `ALLOW_INDEXING=true` si deseas indexar únicamente la landing pública y páginas legales (`/`, `/privacidad`, `/terminos`, `/seguridad`).
3. En **Google Search Console**:
   - Verifica la propiedad del dominio canónico `$0` y, si `alquileres-erp-nextjs-ruby.vercel.app` aparecía en resultados previos, solicita su retiro temporal en **Removals** mientras Google procesa el `301` y la cabecera `X-Robots-Tag: noindex, nofollow`.

### 2. Comandos de verificación operativa (`curl` y Node)

Ejecuta estas pruebas tras desplegar en Vercel:

```bash
# 1. Verificar redirección 301 desde el host legacy hacia el dominio canónico (y cabecera noindex)
curl -I https://alquileres-erp-nextjs-ruby.vercel.app/
# Esperado: HTTP/2 301, location: https://<CANONICAL_APP_HOST>/, x-robots-tag: noindex, nofollow

# 2. Verificar que /robots.txt en el host legacy NO hace bucle 301 y mantiene X-Robots-Tag: noindex, nofollow
curl -I https://alquileres-erp-nextjs-ruby.vercel.app/robots.txt

# 3. Verificar que webhooks de Stripe NO reciben redirección 301 (evita ruptura de firmas POST)
curl -I -X POST https://alquileres-erp-nextjs-ruby.vercel.app/api/webhooks/stripe

# 4. Verificar entorno Preview: debe responder 200/307 local con X-Robots-Tag: noindex, nofollow y SIN 301 a Producción
curl -I https://<tu-deploy-preview>.vercel.app/
curl -s https://<tu-deploy-preview>.vercel.app/robots.txt
# Esperado en robots.txt de Preview:
# User-Agent: *
# Disallow: /

# 5. Verificar robots.txt en dominio canónico de Producción (cuando ALLOW_INDEXING=true)
curl -s https://<CANONICAL_APP_HOST>/robots.txt
# Esperado: Allow para /, /privacidad, /terminos, /seguridad y Disallow para /api/, /dashboard/, /alquileres/, etc.
```

Para ejecutar localmente los scripts de prueba RLS sin credenciales hardcodeadas (usando Node 22 nativo):

```bash
node --env-file=.env.development.local test-rls.mjs
node --env-file=.env.development.local test-rls2.mjs
```
