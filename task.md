# Speckit Tasks: Aprovisionamiento de Tenant Multi-Tenant y Dummy Data

## Tarea 1: Actualización de Prisma Schema [✅ COMPLETADA]
- [x] Modificar `prisma/schema.prisma` para agregar los nuevos campos al modelo `Tenant` (`telefono`, `ciudad`, `tamanoEmpresa`, `autorizado`).

## Tarea 2: Migración DDL - Función de Dummy Data Seeding [✅ COMPLETADA]
- [x] Crear archivo SQL `20260924120200_tenant_dummy_data_seeder.sql`.
- [x] Implementar la función `seed_dummy_tenant_data(p_empresa_id uuid, p_user_id uuid)` que inserte atómicamente:
  - 2 Clientes (Persona Natural y Jurídica).
  - 5 Equipos (Andamios, Taladros, etc.) y 1 Proveedor.
  - 1 Caja chica abierta con saldo inicial.
  - 1 Contrato de Alquiler activo asociado a un cliente y equipo.
  - 1 Orden de Compra o Subcontratación.
- [x] Asegurar que todos los registros tengan el `empresa_id` correcto y referencial.

## Tarea 3: Migración DDL - Trigger de Registro [✅ COMPLETADA]
- [x] Crear archivo SQL `20260924120300_tenant_onboarding_trigger.sql`.
- [x] Implementar la función `handle_new_tenant_registration()`:
  - Crear la empresa en `public.empresas` (`autorizado = false`, `trialing`).
  - Crear el acceso en `public.empresa_usuarios` como `ADMIN`.
  - **Llamar a la función de sembrado:** `PERFORM seed_dummy_tenant_data(v_empresa_id, new.id);`
- [x] Asociar el Trigger `AFTER INSERT` en `auth.users`.
- [x] Ejecutar las migraciones vía MCP. (✅ *Ejecutadas con éxito directamente vía Supabase MCP*).

## Tarea 4: Interfaz de Usuario (UI de Sign Up y Banner Global) [✅ COMPLETADA]
- [x] Editar `src/app/auth/login/page.tsx` para agregar los inputs: NIT, Teléfono, Ciudad, Tamaño de Empresa.
- [x] Crear/Editar un layout o componente global (ej. `TopBanner.tsx` / `AppShell.tsx`) que lea si `autorizado === false` y muestre: *"Modo Prueba - Esperando Activación Oficial"*.
- [x] Asegurar que el middleware permita el paso, y que las páginas funcionen.

## Tarea 5: Marca de Agua en PDFs [✅ COMPLETADA]
- [x] Modificar el generador de PDFs (Liquidaciones/Cotizaciones) para inyectar una marca de agua *"DOCUMENTO DE PRUEBA - NO VÁLIDO"* si el Tenant tiene `autorizado = false`.
