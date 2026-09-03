<!-- Generated: 2026-09-03 | Files scanned: ~15 | Token estimate: ~280 -->
# Data Schemas & Persistence Map

## Base de Datos (Supabase PostgreSQL)
- **Row Level Security (RLS)**: Altamente optimizado para el modelo Multi-tenant. Las tablas contienen el campo `tenant_id` y validan el contexto de autenticación mediante `auth.uid()`.
- **Replicación en Tiempo Real (Supabase Realtime)**:
  - Habilitada para `equipos`, `alquileres` y `clientes`.
  - Emite eventos `INSERT`, `UPDATE` y `DELETE` para alimentar stores reactivos en todos los navegadores conectados.
- **Procedimientos Almacenados (RPCs)**:
  - `crear_alquiler_transaccional`: Ejecuta inserción atómica de cabecera y detalles de alquiler, bloqueo de filas de equipos (`FOR UPDATE`), descuento de stock disponible e incremento de stock en obra con `ROLLBACK` automático si el stock es insuficiente.

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
- **`EmpresaConfig`**: Configuraciones del arrendatario y sincronización de tema visual.
- **`AlquilerEntity` / `Cliente` / `Equipo`**: Modelos de dominio con tipado inmutable, validaciones Zod y soporte de Rollback Optimista.
