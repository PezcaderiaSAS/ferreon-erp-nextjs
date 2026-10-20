# Tareas de Implementación Atómica (TDD): SPEC-009
## Auditoría y Certificación de Aislamiento Multi-Tenant

## Tarea 1: Remediación de `alquileres.ts` [x]
- [x] Blindar `aprobarCotizacionAction` añadiendo `.eq('empresa_id', empresaId)` en el `SELECT` y en el `UPDATE`.
- [x] En `aprobarCotizacionAction`, corregir `invalidateTenantCache` pasando `empresaId` en lugar de `user?.id`.
- [x] Blindar `registrarAbonoAction` añadiendo `.eq('empresa_id', empresaId)` en el `SELECT` y en el `UPDATE`.
- [x] En `updateRentalClientAction`, corregir `invalidateTenantCache` pasando `empresaId` en lugar de `user?.id`.

## Tarea 2: Auditoría y Blindaje de Acciones Críticas Restantes [x]
- [x] Auditar `cotizaciones.ts` (`generarConsecutivoCotizacion`, `obtenerCotizacionesAction`, `obtenerCotizacionPorIdAction`, `actualizarEstadoCotizacionAction`, `convertirCotizacionAContratoAction`, `eliminarCotizacionAction`) y asegurar que todas las queries exijan `empresa_id`.
- [x] Auditar `compras.ts`, `caja-transaccional.service.ts`, `devoluciones.ts`, `cuentas-por-pagar.ts`, `proveedores.ts`, `pagos.ts`, `facturacion.ts`, `kardex.ts` y `empresa.ts`.
- [x] Corregir cualquier llamada residual a `invalidateTenantCache` que use `user.id` migrándola a `empresaId`.
- [x] Eliminar fallbacks inseguros a registros ajenos (e.g. primera empresa en `empresa.ts`).

## Tarea 3: Suite Automatizada de Pruebas Adversariales (Vitest) [x]
- [x] Crear archivo `tests/integration/security/cross-tenant-isolation.test.ts`.
- [x] Implementar prueba: Usuario de Tenant Beta intentando consultar o aprobar cotización de Tenant Alpha -> Rechazado sin alterar estado.
- [x] Implementar prueba: Usuario de Tenant Beta intentando registrar abono en contrato de Tenant Alpha -> Rechazado sin alterar saldo.
- [x] Implementar prueba: Usuario de Tenant Beta consultando compras -> Retorna únicamente compras propias, cero compras ajenas.
- [x] Implementar prueba: Usuario de Tenant Beta intentando editar proveedor de Tenant Alpha -> Rechazado.
- [x] Implementar prueba: Usuario de Tenant Beta intentando abonar a cuenta por pagar ajena -> Rechazado.
- [x] Implementar prueba: Configuración corporativa sin tenant no entrega datos de otra empresa.

## Tarea 4: Verificación Integral y Despliegue [x]
- [x] Ejecutar la suite completa de pruebas de seguridad en Vitest (7 de 7 pasadas).
- [x] Ejecutar verificación estática `tsc --noEmit` garantizando 0 errores de compilación.
- [x] Actualizar memoria persistente (`retain` y `MEMORY.md`).
- [x] Despliegue y commit formal a Git.
