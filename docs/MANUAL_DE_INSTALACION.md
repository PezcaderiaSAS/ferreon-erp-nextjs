# Manual de Instalación: Alquileres ERP (Autenticación Supabase + Google OAuth)

Este manual documenta el paso a paso para desplegar y configurar la infraestructura de autenticación de Alquileres ERP para nuevos clientes. El sistema está diseñado sobre **Next.js App Router** y utiliza **Supabase Auth** de manera nativa con inicio de sesión mediante **Google OAuth**.

## Requisitos Previos
- Cuenta en [Supabase](https://supabase.com).
- Cuenta en [Google Cloud Console](https://console.cloud.google.com).
- Proyecto de Vercel (o similar) para el despliegue del frontend de Next.js.

---

## 1. Configuración de Google Cloud Console (OAuth Client ID)

Para que los usuarios puedan ingresar con Google, necesitas generar credenciales OAuth 2.0.

1. Ingresa a **Google Cloud Console**.
2. Crea un nuevo proyecto o selecciona uno existente (Ej. `ClienteX - Alquileres ERP`).
3. Ve a **APIs & Services > OAuth consent screen**.
   - Selecciona **External** (si los usuarios tendrán correos de diferentes dominios) o **Internal** (si todos pertenecen al mismo Google Workspace).
   - Llena la información de la aplicación (Nombre: *Alquileres ERP*, Correo de soporte).
   - Guarda y continúa. No necesitas scopes adicionales más allá de `email` y `profile`.
4. Ve a **APIs & Services > Credentials**.
5. Haz clic en **Create Credentials > OAuth client ID**.
6. Selecciona **Web application**.
7. En **Authorized JavaScript origins**, ingresa:
   - `http://localhost:3000` (para desarrollo)
   - `https://tu-dominio-en-vercel.app` (para producción)
8. En **Authorized redirect URIs**, debes ingresar el callback exacto provisto por Supabase (lo obtendremos en el siguiente paso).
9. Haz clic en **Create**. Guarda tu **Client ID** y **Client Secret**.

---

## 2. Configuración de Supabase (Auth Providers & Roles)

Alquileres ERP gestiona la sesión y la base de datos a través de Supabase.

1. Ingresa a tu panel de **Supabase** y crea un nuevo proyecto.
2. Navega a **Authentication > Providers > Google**.
3. Activa el proveedor de Google.
4. Ingresa el **Client ID** y **Client Secret** obtenidos en el paso de Google Cloud.
5. Copia la URL de **Callback URL (para OAuth)** que te da Supabase y pégala en los **Authorized redirect URIs** de tu Google Cloud Console (Paso 1.8). Haz clic en guardar en ambos paneles.

### Extracción de Credenciales Críticas
Para que la API del sistema (específicamente `/api/usuarios`) pueda crear invitaciones de usuario con roles empaquetados (`user_metadata`), necesitamos la clave de administrador.

1. En Supabase, ve a **Project Settings > API**.
2. Copia la **Project URL**.
3. Copia la **anon / public key**.
4. Copia la **service_role / secret key** (Esta llave otorga permisos totales sobre la base de datos, ¡nunca debe exponerse al frontend!).

---

## 3. Configuración del Entorno (.env.local)

En la raíz del proyecto `ferreon-erp-nextjs`, crea o modifica el archivo `.env.local` con las credenciales extraídas:

```env
# URL base de Supabase (Pública)
NEXT_PUBLIC_SUPABASE_URL=https://<tu-id-proyecto>.supabase.co

# Llave anónima pública
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>

# Llave Privada de Administrador (Service Role - NUNCA agregar NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

> [!WARNING]
> La llave `SUPABASE_SERVICE_ROLE_KEY` es crítica para el funcionamiento del RBAC en la pestaña "Usuarios y Accesos". Si no se incluye, la creación de cuentas de administrador fallará por falta de permisos.

## 4. Primer Administrador del Sistema

Dado que el sistema requiere ser `SUPERADMIN` o `ADMIN` para acceder a la configuración de usuarios:

1. El cliente dueño del sistema debe ingresar a la URL pública y hacer clic en **Ingresar con Google**.
2. Dado que es su primer ingreso, su cuenta se creará automáticamente en Supabase, pero sin rol.
3. El instalador debe ir manualmente al panel de **Supabase > Authentication > Users**, seleccionar al usuario recién creado y editar su **User Metadata** (en formato JSON) para inyectar su rol:

```json
{
  "rol": "SUPERADMIN",
  "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
}
```

A partir de este punto, este usuario puede gestionar toda la aplicación y crear a los demás trabajadores directamente desde la UI de **Alquileres ERP** en la pestaña `/configuracion`.
