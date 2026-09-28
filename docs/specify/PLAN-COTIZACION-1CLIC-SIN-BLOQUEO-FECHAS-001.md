# PLAN-COTIZACION-1CLIC-SIN-BLOQUEO-FECHAS-001: El Cómo Técnico y Arquitectura

## 1. Capa de Base de Datos (PostgreSQL Migration)
- **Archivo**: Nueva migración `supabase/migrations/20260928_eliminar_bloqueo_fechas_cotizaciones.sql`.
- **Modificación**:
  - Reemplazar la función RPC `formalizar_alquiler_cotizacion_transaccional`:
    - Eliminar la validación `IF v_fecha_min_orig IS NOT NULL AND v_fecha_min_orig < CURRENT_DATE THEN RAISE EXCEPTION 'ERR_FECHA_INICIO_PASADA...'`.
    - Si no se suministra `nueva_fecha_inicio`, mantener `v_fecha_min_orig` y las fechas en `alquiler_detalles` tal como fueron cotizadas originalmente.
    - Conservar la lógica de bloqueo pesimista ordenado (`ORDER BY id ASC FOR UPDATE`) y validación de stock dinámico para equipos propios.

## 2. Capa de Lógica de Servidor (Server Actions)
- **Archivo**: `src/app/actions/cotizaciones.ts`.
- **Modificación**:
  - Limpiar el interceptor de `ERR_FECHA_INICIO_PASADA` en `convertirCotizacionAContratoAction`. Si por compatibilidad llegara dicho código, omitir error y permitir el flujo normal.

## 3. Capa de Formulario y Estado Local (Client Wizard)
- **Archivo**: `src/components/forms/alquiler/useAlquilerForm.ts`.
- **Modificación**:
  - Retirar la comprobación `if (esFechaInicioEnPasado) { ... return false; }` en la función de validación de formalización de contrato.
- **Archivo**: `src/components/forms/cotizaciones/ConvertirCotizacionModal.tsx`.
- **Modificación**:
  - Retirar la validación restrictiva `if (fechaExpirada && ...)` en `handleFormalizar`.
  - Ocultar o eliminar la advertencia de ratificación forzada de fechas.

## 4. Capa de Interfaz de Usuario (UI - 1 Solo Clic)
- **Archivo**: `src/components/alquileres/AlquileresInteractiveIsland.tsx`.
- **Modificación**:
  - Añadir estado de carga granular por fila: `const [formalizandoId, setFormalizandoId] = useState<string | number | null>(null);`.
  - Crear manejador `handleFormalizarDirecto(cot: any)`:
    - Prevenir doble clic si `formalizandoId !== null`.
    - Llamar a `convertirCotizacionAContratoAction({ cotizacionId: cot.id, idempotencyKey: ... })`.
    - En caso de éxito: emitir toast de éxito, actualizar el estado local (o recargar vía router/action) y permitir visualización en la pestaña de Contratos.
    - En caso de error de stock (`res.esErrorStock`): abrir el modal asistido `ConvertirCotizacionModal` para que el usuario pueda gestionar el faltante o derivar a subcontratación.
    - En caso de otro error: emitir alerta/toast informativa.
  - Actualizar el botón "Formalizar Contrato":
    - Mostrar spinner animado (`Loader2 className="animate-spin"`) cuando `formalizandoId === cot.id`.
    - `onClick={() => handleFormalizarDirecto(cot)}`.

## 5. Pruebas Unitarias y de Regresión
- **Archivo**: `tests/unit/formalizar-cotizacion-polimorfica.test.ts`.
- **Modificación**:
  - Actualizar las pruebas para verificar que cotizaciones con fecha en el pasado se convierten exitosamente sin requerir ratificación de fecha.
