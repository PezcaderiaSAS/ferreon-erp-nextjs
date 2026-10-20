# Especificación Técnica EARS: 006-edicion-alquileres-wizard

## 1. Identificación y Resumen
- **Módulo**: Gestión de Alquileres y Cotizaciones (`Alquileres System`)
- **Impacto**: Crítico (Flujo transaccional de edición de contratos y cotizaciones)
- **Objetivo**: Corregir la falla donde el modal permanece abierto sin retroalimentación y los cambios no impactan la base de datos, facturación ni PDF al presionar "Guardar" en el Paso 3 del Wizard de edición.

---

## 2. Requerimientos Formales en Sintaxis EARS

### 2.1 Requerimientos Ubicuos (Ubiquitous)
- **UBQ-01**: El sistema debe presentar el nombre de marca oficial estrictamente como **"Alquileres System"** en todos los componentes de interfaz, modales, tickets y documentos PDF.
- **UBQ-02**: Todo error originado durante la validación de formulario o ejecución en servidor debe ser renderizado de forma visible e inequívoca en la cabecera del Wizard mediante un banner reactivo de error y notificación Toast.

### 2.2 Requerimientos Guiados por Eventos (Event-driven)
- **EVT-01**: Cuando el operador haga clic en "Editar Contrato" desde el menú contextual de un contrato con estado `ACTIVO`, el sistema debe inicializar el formulario en modo `CONTRATO`, bloqueando la regresión involuntaria al modo `COTIZACION`.
- **EVT-02**: Cuando el operador haga clic en "Editar Cotización" desde el listado de cotizaciones, el sistema debe inicializar el formulario en modo `COTIZACION`, permitiendo actualizar las condiciones comerciales sin descontar stock físico de bodega.
- **EVT-03**: Cuando el operador haga clic en "Guardar Cambios" en el Paso 3 del Wizard de edición, el sistema debe ejecutar la transacción atómica en Supabase, cerrar automáticamente el modal tras confirmar éxito, emitir un Toast de notificación afirmativa y disparar la revalidación reactiva de listados, facturación y visor de PDF.

### 2.3 Requerimientos Guiados por Estado (State-driven)
- **STD-01**: Mientras el formulario se encuentre en modo de edición (`isEditMode = true`), el botón de acción principal en el Paso 3 debe ostentar la etiqueta `"Guardar Cambios del Contrato"` (o `"Guardar Cambios de la Cotización"` según corresponda) y mostrar un spinner de bloqueo físico Poka-Yoke durante la persistencia.
- **STD-02**: Mientras la transacción de guardado se esté procesando, el componente `AlquilerBlockingOverlay` debe impedir clics repetidos o navegaciones accidentales.

### 2.4 Requerimientos ante Comportamiento No Deseado (Unwanted Behavior)
- **UNW-01**: Si la llamada RPC a Supabase o la validación Zod falla, el sistema NO DEBE cerrar el modal silenciosamente ni permanecer congelado sin explicación; debe desplegar el mensaje de error exacto con descripción accionable en español y habilitar nuevamente los controles.
- **UNW-02**: Si se intenta editar un contrato o cotización cuya llave foránea `cliente_id` es de tipo `BIGINT`, la función RPC de PostgreSQL NO DEBE intentar castear el valor a `UUID`, evitando el error fatal `column "cliente_id" is of type bigint but expression is of type uuid`.

### 2.5 Requerimientos Opcionales (Optional)
- **OPT-01**: Donde el usuario requiera verificar inmediatamente el documento tras guardar la edición, la notificación Toast de éxito debe incluir un botón de acceso directo *"Ver PDF Actualizado"*.

---

## 3. Diagnóstico de Causa Raíz (Introspección Técnica)
1. **Fallo de Tipado en Base de Datos (PostgreSQL RPC `editar_alquiler_transaccional_v1`)**:
   En la migración `20260922_resiliencia_concurrencia_wms_y_rpc.sql` y en la función activa en Supabase, la sentencia de actualización contiene `SET cliente_id = (p_payload->>'cliente_id')::UUID`. Al ser `cliente_id` de tipo `BIGINT`, PostgreSQL aborta la transacción con error fatal `column "cliente_id" is of type bigint but expression is of type uuid`.
2. **Payload Incompleto en Dominio (`AlquilerTransaccionalService.ts`)**:
   `AlquilerTransaccionalService.editarContrato` no suministraba `cliente_id`, `garantia_tipo`, `aplica_impuesto`, `tasa_impuesto` ni parámetros de estado/fechas al payload RPC.
3. **Desincronización de Modo en UI (`AlquileresInteractiveIsland.tsx`)**:
   Al invocar `openAction(contrato, 'EDITAR')`, nunca se actualizaba `modoCreacionInicial` al tipo real del contrato (`contrato.estado === 'COTIZACION' ? 'COTIZACION' : 'CONTRATO'`), forzando por defecto el modo `'COTIZACION'` en contratos activos.
4. **Tragado Silencioso de Errores en UI (`AlquilerForm.tsx`)**:
   `form.errorMsg` se almacenaba en el estado de React pero jamás se renderizaba en el JSX de `AlquilerForm.tsx` ni en `StepResumenLiquidacion.tsx`. Todo error de backend dejaba el formulario en blanco y abierto sin ninguna indicación al usuario.
5. **Cierre y Notificación Post-Guardado**:
   No existía un callback directo para cerrar el modal inmediatamente en modo edición con emisión de Toast y recarga de caché.
