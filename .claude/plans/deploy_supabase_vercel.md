# Plan de Despliegue: Supabase & Vercel

Este documento es el Runbook (guía paso a paso) para desplegar de forma segura el proyecto **FerreOn (AppFrios Pezca)** utilizando Vercel para el Frontend (Next.js) y Supabase para el Backend (PostgreSQL + Auth).

## 1. Preparación del Entorno Supabase (Base de Datos)

### 1.1 Crear Proyecto en Supabase
1. Ingresa a [supabase.com](https://supabase.com/) y crea un nuevo proyecto.
2. Asigna un nombre al proyecto (ej. `FerreOn-Production`).
3. Define una contraseña segura para la base de datos y guárdala.
4. Selecciona la región más cercana a tus usuarios.

### 1.2 Migración de Esquemas y Semillas (Seeds)
Si utilizas el CLI de Supabase localmente:
1. Vincula el proyecto local con el remoto:
   ```bash
   npx supabase link --project-ref <tu-project-ref>
   ```
2. Aplica las migraciones a producción:
   ```bash
   npx supabase db push
   ```
3. *(Opcional)* Si existen datos iniciales (roles, configuraciones base):
   ```bash
   npx supabase db reset --linked
   ```

### 1.3 Obtener Credenciales de Supabase
Dirígete a **Project Settings > API** y copia los siguientes valores:
- `Project URL` (será `NEXT_PUBLIC_SUPABASE_URL`)
- `anon` `public` API Key (será `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `service_role` secret (será `SUPABASE_SERVICE_ROLE_KEY` - ¡No exponer al cliente!)

## 2. Preparación del Entorno Vercel (Frontend Next.js)

### 2.1 Conexión del Repositorio
1. Ingresa a [vercel.com](https://vercel.com/) y haz clic en **Add New... > Project**.
2. Conecta tu cuenta de GitHub/GitLab e importa el repositorio de `FerreOn`.
3. Vercel detectará automáticamente que es un proyecto **Next.js**.

### 2.2 Configuración de Variables de Entorno
En la pantalla de configuración del proyecto (antes de darle Deploy), abre la sección **Environment Variables** y añade las obtenidas en Supabase:

| Clave | Valor |
|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[TU-REF].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| `eyJh...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` (Solo requerida si haces operaciones admin en el servidor) |

### 2.3 Despliegue Inicial
1. Haz clic en **Deploy**.
2. Vercel ejecutará `npm run build`. (Asegúrate de que tus tipos y linters pasen correctamente; ya confirmamos localmente que el build es exitoso ✅).
3. Una vez finalizado, Vercel te otorgará una URL de producción (ej. `ferreon.vercel.app`).

## 3. Post-Despliegue y Pruebas de Integración

### 3.1 Configuración de Auth (Redirecciones)
1. En Supabase, ve a **Authentication > URL Configuration**.
2. En **Site URL**, coloca la URL de Vercel (`https://ferreon.vercel.app`).
3. En **Redirect URLs**, añade: `https://ferreon.vercel.app/**`.

### 3.2 Prueba End-to-End en Producción
1. Ingresa a la URL de Vercel.
2. Inicia sesión (o crea un usuario de prueba).
3. Dirígete al **Módulo de Cartera**.
4. Realiza un clic en un registro y abre el modal `RegistrarPagoModal`.
5. Valida que las interacciones del "Soft Tech" y las transacciones base persistan los datos correctamente en el panel de Supabase.

---
> **Nota de Loop-Start:** Este documento puede ser utilizado por el agente en modo autónomo si se integran los tokens de Vercel CLI y Supabase CLI en el entorno local.
