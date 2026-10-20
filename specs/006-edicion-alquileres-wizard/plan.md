# Plan Técnico de Arquitectura: 006-edicion-alquileres-wizard

## 1. Arquitectura de Solución Transaccional

### Capa 1: Base de Datos PostgreSQL / Supabase
- **Objeto**: Función RPC `public.editar_alquiler_transaccional_v1(p_payload JSONB)`.
- **Correcciones Críticas**:
  1. Corregir el cast erróneo `(p_payload->>'cliente_id')::UUID` a `COALESCE((p_payload->>'cliente_id')::BIGINT, cliente_id)`.
  2. Condicionar la reconciliación de bodega: Si el registro tiene `estado = 'COTIZACION'`, omitir la deducción o adición a `equipos.stock_disponible` y `equipos.stock_en_obra`.
  3. Actualizar campos tributarios y de garantía: `garantia_tipo`, `garantia_monto`, `estado`, `aplica_iva`, `valor_iva`, etc.
  4. Generar archivo de migración formal: `supabase/migrations/20261009_fix_editar_alquiler_rpc.sql`.

### Capa 2: Servicio de Dominio (`AlquilerTransaccionalService.ts`)
- Inyectar al objeto `payload` enviado a la RPC:
  - `cliente_id`: Numérico sanitizado.
  - `garantia_tipo`, `garantia_monto`.
  - `estado`: Respetar si es `COTIZACION` o `ACTIVO`.
  - Parámetros tributarios calculados (`aplicaIva`, `valorIva`, etc.).
- Soporte polimórfico: Si el ID corresponde a una cotización en la tabla `cotizaciones` (UUID), actualizar directamente las tablas `cotizaciones` y `cotizaciones_detalles`.

### Capa 3: Server Actions (`src/app/actions/alquileres.ts`)
- Revalidar rutas `/alquileres`, `/cotizaciones`, `/facturacion`, `/bodega`.
- Invalidar caché Redis de inquilino para `alquileres`, `cotizaciones` y `equipos`.

### Capa 4: Orquestación UI (`AlquileresInteractiveIsland.tsx` & `AlquilerForm.tsx`)
- **Sincronización de Modo**: En `openAction(contrato, 'EDITAR')`, setear `setModoCreacionInicial(contrato.estado === 'COTIZACION' ? 'COTIZACION' : 'CONTRATO')`.
- **Renderizado de Errores Poka-Yoke**: Renderizar banner visible de alerta en `AlquilerForm.tsx` y en el Paso 3 (`StepResumenLiquidacion`) cuando `errorMsg` no sea nulo.
- **Flujo de Éxito en Edición**:
  - En modo edición, tras confirmación positiva de la Server Action:
    - Invocar `onSuccess(alquilerActualizado)`.
    - Cerrar modal (`setIsModalOpen(false)`).
    - Desplegar Toast informativo: *"¡Contrato #X actualizado exitosamente!"*.
    - Re-consultar datos con `fetchAllData()`.
