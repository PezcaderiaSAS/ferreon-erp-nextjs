<!-- Generated: 2026-09-03 | Files scanned: ~10 | Token estimate: ~250 -->
# Data Schemas & Persistence Map

## Base de Datos (Supabase PostgreSQL)
- **Row Level Security (RLS)**: Altamente optimizado para el modelo Multi-tenant. Todas las tablas contienen el campo `tenant_id`. Las políticas RLS restringen el acceso usando `auth.jwt() ->> 'app_metadata'`.

## Esquemas Críticos (JSONB)
- **`auth.users` (Gestión de Identidad Supabase)**:
  - Usamos el campo nativo `raw_user_meta_data` para inyectar datos del perfil:
  ```json
  {
    "nombre": "string",
    "rol": "superadmin | admin | operador | facturacion",
    "avatarUrl": "string"
  }
  ```

## Entidades de Dominio (`src/core/domain/entities/`)
- **`EmpresaConfig`**:
  - Responsable de configuraciones del arrendatario (Tenant).
  - Incorpora el atributo de diseño `themeApp` para sincronizar UI local (ej. `salmon`, `ocean`, `slate`).
- **`AlquilerEntity` / `FacturaEntity`**:
  - Validaciones científicas rigurosas (conversión explícita de `gramos` a `kilos`).
  - Idempotencia en la generación de contratos y creación al vuelo (On-the-fly modals).
