# Tareas Granulares de Implementación: 006-edicion-alquileres-wizard

## Tareas

- [ ] **Task 1: Corrección de la RPC en Supabase y Migración SQL**
  - Aplicar parche SQL a `public.editar_alquiler_transaccional_v1` en Supabase (proyecto `eqruvswlpsttuyuglwts`).
  - Crear archivo `supabase/migrations/20261009_fix_editar_alquiler_rpc.sql`.
  - Probar ejecución directa con `execute_sql`.

- [ ] **Task 2: Sincronización del Servicio de Dominio (`AlquilerTransaccionalService.ts`)**
  - Agregar campos `cliente_id`, `garantia_tipo`, `estado`, y tributarios al payload RPC.
  - Implementar soporte polimórfico para cotizaciones UUID en tabla `cotizaciones`.

- [ ] **Task 3: Sincronización de Modo y Handlers en `AlquileresInteractiveIsland.tsx`**
  - Ajustar `openAction(contrato, 'EDITAR')` para inicializar `setModoCreacionInicial(contrato.estado === 'COTIZACION' ? 'COTIZACION' : 'CONTRATO')`.
  - Mejorar el handler `onSuccess` para desplegar Toast de éxito y refrescar reactivamente stores y visor PDF.

- [ ] **Task 4: Tratamiento de Errores y Cierre en `AlquilerForm.tsx` y `useAlquilerForm.ts`**
  - Renderizar banner de error visible cuando `errorMsg` esté presente en cualquier paso del formulario.
  - En modo edición (`isEditMode = true`), cerrar directamente el modal llamando a `onSuccess` en vez de bloquear en `AlquilerSuccessView`.

- [ ] **Task 5: Verificación End-to-End con Chrome DevTools MCP**
  - Realizar prueba interactiva de edición en vivo del contrato en `http://localhost:3000/alquileres?tab=contratos`.
  - Guardar y verificar:
    1. Cierre limpio del modal.
    2. Toast de éxito visible.
    3. Cero errores en consola DevTools.
    4. Datos y totales actualizados en tabla y visor PDF.
