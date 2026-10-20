# Tareas de Implementación Atómica (TDD): SPEC-008

## Tarea 1: Purga In-Memory en Logout [x]
- [x] Modificar `src/lib/auth/logout.ts` para importar y resetear el estado de `useBodegaStore`, `useClienteStore`, `useAlquilerStore`, `useEmpresaStore` y `useTenantStore`.

## Tarea 2: Contrato y Mapeo de Tenant en Equipos [x]
- [x] En `src/infrastructure/state/bodegaStore.ts`, agregar `empresaId?: string | null` en `EquipoUI` y el método `resetStore`.
- [x] En `src/lib/mappers.ts`, mapear `empresaId` en `equipoToEquipoUI`.

## Tarea 3: Filtro Reactivo y Validación Poka-Yoke en Formulario [x]
- [x] En `src/components/forms/alquiler/useAlquilerForm.ts`, asegurar que `equiposActivos` excluya ítems de otros tenants si `empresaConfig?.id` está presente.
- [x] En `verificarStockItem` y `ejecutarGuardadoTransaccional`, agregar validación de pertenencia al catálogo para abortar preventivamente con mensaje informativo si el equipo no pertenece al tenant.
- [x] En `src/components/forms/alquiler/StepEquiposLogistica.tsx`, alertar visualmente si un ítem seleccionado no pertenece al inventario del tenant activo.

## Tarea 4: Blindaje en Server Actions y Caché Redis [x]
- [x] En `src/app/actions/equipos.ts`, corregir `invalidateTenantCache` pasando `empresaId` en vez de `user.id`.
- [x] En `src/app/actions/alquiler-segmentado.ts`, mapear `ERR_ITEM_NOT_FOUND` a un mensaje claro y legible para el usuario.
- [x] Corregir claves de caché de tenant en `clientes.ts` y `facturacion-recurrente.ts` pasando `empresaId`.

## Tarea 5: Verificación Automatizada y QA [x]
- [x] Ejecutar `npx vitest run tests/integration/components/alquiler-registro-fallo.test.tsx` (4/4 passed).
- [x] Crear y ejecutar `tests/integration/components/alquiler-tenant-isolation.test.tsx` (4/4 passed).
- [x] Ejecutar `npx tsc --noEmit` (0 errores de TypeScript en todo el proyecto).
