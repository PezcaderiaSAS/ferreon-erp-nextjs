# Runbook Operativo - FerreOn ERP

## Procedimientos de Despliegue
1. **Verificación de Tipos y Tests:** Asegurarse de que `npm run typecheck` y `npm run test` pasen exitosamente.
2. **Compilación de Producción:** Ejecutar `npm run build` para validar que las 19 rutas y el middleware compilen con código 0.
3. **Migración de Base de Datos (Supabase):**
   Cualquier script SQL nuevo (ej. tablas `kardex_inventario`, `sesiones_caja`) debe empujarse al entorno de producción:
   `supabase db push` o ejecutar el SQL manualmente en el SQL Editor de Supabase.
4. **Build Vercel:** Al hacer push a la rama `main`, Vercel despliega automáticamente mediante CI/CD.

## Mantenimiento y Poka-Yoke Operativo
- **Cierre de Caja Forzado:** Si un cajero olvidó cerrar sesión y se fue, un admin debe poder forzar el estado a `CERRADA` directamente en Supabase o a través de una UI de SuperAdmin, para evitar bloqueos al día siguiente.
- **Sincronización de Identidad Corporativa y Caché:** Al actualizar el logo o datos de la empresa desde `/configuracion`, la acción invalida automáticamente la clave de caché del tenant en Upstash Redis (`invalidateTenantCache(tenantId, ['empresa', 'alquileres'])`). Si los documentos emitidos muestran datos antiguos tras un fallo de red, limpiar la clave `tenant:{id}:empresa` en Upstash Redis.
- **Resolución de Bloqueos en Edición de Contratos:** Si un contrato tiene devoluciones procesadas o se encuentra `FINALIZADO` o `CANCELADO`, el sistema inhabilita su edición en la interfaz para proteger la integridad del Kardex y la facturación. Cualquier ajuste posterior debe registrarse como nuevo movimiento o documento contable.
- **Auditoría y Supervisión UltraAdmin:** El panel administrativo en `/admin/empresas` permite a los usuarios autorizados con rol `ULTRAADMIN` (evaluado por la función SQL `is_ultra_admin()`) auditar eventos inmutables en `audit_logs`, inspeccionar tenants y activar/suspender accesos de usuarios de manera centralizada.

## Troubleshooting Común
- **Caché de Cabeceras de Seguridad (CSP):**
  - *Síntoma:* La consola arroja bloqueos de scripts en línea o advertencias sobre `upgrade-insecure-requests`.
  - *Causa:* El navegador o CDN retiene la versión anterior de la cabecera CSP en caché HTTP.
  - *Solución:* Aplicar recarga forzada (`Ctrl + F5` en Windows/Linux, `Cmd + Shift + R` en Mac/iOS) o limpiar historial de Safari en iOS. En `src/lib/security/csp.ts`, verificar que `script-src` mantenga `'unsafe-inline'` y no contenga `nonce` ni `strict-dynamic`.
- **Apilamiento de Menús en Modales:**
  - *Síntoma:* Un desplegable de búsqueda se muestra cortado o tapado por la fila de arriba.
  - *Causa:* Contexto de apilamiento CSS fijo donde la fila anterior tiene mayor `z-index`.
  - *Solución:* El formulario de alquileres usa `openComboboxRowId` para elevar la fila en uso a `zIndex: 100` y `EquipoCombobox` usa un umbral de colisión de 220px para abrir hacia abajo.

<!-- AUTO-GENERATED: Variables de Entorno -->
## Variables de Entorno Requeridas
| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (Requerido) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave anónima pública de Supabase (Requerido) |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave secreta para operaciones administrativas/bypassing RLS (Requerido) |
| `STRIPE_SECRET_KEY` | Llave privada de Stripe (Requerido para pagos) |
| `UPSTASH_REDIS_REST_URL` | URL de la caché Redis (Requerido) |
<!-- AUTO-GENERATED END -->
