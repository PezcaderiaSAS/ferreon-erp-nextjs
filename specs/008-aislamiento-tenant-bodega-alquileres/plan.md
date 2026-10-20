# Plan de Arquitectura y Contratos Técnicos: SPEC-008

## 1. Arquitectura de Solución
El blindaje multi-tenant para resolver la contaminación inter-empresa y el error `ERR_ITEM_NOT_FOUND` se implementa en 4 capas desacopladas:

1. **Capa de Autenticación & Sesión (`src/lib/auth/logout.ts`)**:
   - Extender `unifiedLogout()` para ejecutar `reset()` o `setState` a colecciones vacías en `useBodegaStore`, `useClienteStore`, `useAlquilerStore`, `useEmpresaStore` y `useTenantStore`.
   - Limpieza completa de memoria para neutralizar persistencia de datos de una sesión anterior en SPA.

2. **Capa de Mapeo y Dominio (`src/lib/mappers.ts` & `src/infrastructure/state/bodegaStore.ts`)**:
   - Agregar `empresaId?: string | null` en `EquipoUI`.
   - Mapear `empresaId: equipo.empresaId || equipo.empresa_id || null` en `equipoToEquipoUI`.
   - En `bodegaStore`, añadir método `resetStore()` para purga determinista.

3. **Capa de Formulario & Poka-Yoke (`src/components/forms/alquiler/useAlquilerForm.ts` & `StepEquiposLogistica.tsx`)**:
   - En `equiposActivos`: filtrar por `empresaConfig?.id` si está disponible, garantizando que solo los ítems de la empresa activa sean renderizados en `EquipoCombobox`.
   - En `verificarStockItem`: validar que el ítem exista en `equiposActivos`. Si no existe, marcarlo con `errorTenant: true` y `stockInsuficiente: true`.
   - En `ejecutarGuardadoTransaccional`: verificación preventiva Poka-Yoke previa al envío hacia `crearAlquilerSegmentadoAction`.

4. **Capa Backend & Manejo de Excepciones RPC (`src/app/actions/alquiler-segmentado.ts` & `src/app/actions/equipos.ts`)**:
   - En `crearAlquilerSegmentadoAction`: mapear amigablemente `ERR_ITEM_NOT_FOUND` si llega a generarse en BD.
   - En `src/app/actions/equipos.ts`: corregir la clave de invalidación de caché usando `empresaId` en lugar de `user.id`.

## 2. Contratos de Interfaz (Diffs Conceptuales)
```typescript
export interface EquipoUI {
  id: string | number;
  codigo: string;
  nombre: string;
  categoria: string;
  tarifa_diaria: number;
  stock_total: number;
  stock_disponible: number;
  stock_en_obra: number;
  empresaId?: string | null; // Nuevo contrato multi-tenant
  ...
}
```
