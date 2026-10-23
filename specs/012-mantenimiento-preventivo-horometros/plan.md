# Plan Técnico de Arquitectura: SPEC-012 Mantenimiento Preventivo & Horómetros
**Proyecto**: Alquileres System (FerreOn ERP & WMS)  
**Autor**: Software Architect & Data Engineer  

---

## 1. Modelo de Datos y Compatibilidad DBRE
Para garantizar retrocompatibilidad total y zero-downtime, los datos de mantenimiento se encapsulan en el contrato de dominio de `equipos`:
```typescript
export interface MantenimientoConfig {
  tieneHorometro: boolean;
  horasUsoAcumuladas: number;
  horasLimiteMantenimiento: number;
  diasUsoAcumulados: number;
  diasLimiteMantenimiento: number;
  ultimoMantenimientoAt: string | null;
  ultimoMantenimientoObs: string | null;
}
```
En base de datos se almacena en el campo flexible `metadata_mantenimiento` (JSONB) dentro de `equipos` o en columnas mapeadas en Supabase, evitando romper esquemas existentes.

---

## 2. Capa de Dominio Puro (TDD)
- **Archivo**: `src/core/services/mantenimiento-preventivo.service.ts`
- **Funciones Puras Inmutables**:
  1. `evaluarSemaforoMantenimiento(config: MantenimientoConfig): 'OK' | 'PROXIMO' | 'VENCIDO'`
     - `OK`: Consumo < 80%.
     - `PROXIMO`: Consumo >= 80% y < 100%.
     - `VENCIDO`: Consumo >= 100% o unidades en `stock_mantenimiento`.
  2. `calcularPorcentajeUso(actual: number, limite: number): number`
  3. `liquidarCicloDevolucion(config: MantenimientoConfig, diasObra: number, horometroRetorno?: number, horometroDespacho?: number): MantenimientoConfig`
  4. `ejecutarResetMantenimiento(config: MantenimientoConfig, obs: string, costo?: number): MantenimientoConfig`

---

## 3. Server Actions & Seguridad
- **Archivo**: `src/app/actions/mantenimiento.ts`
- `registrarMantenimientoPreventivoAction(params)`:
  - Valida esquema Zod `MantenimientoActionSchema`.
  - Transfiere unidades de `stock_mantenimiento` a `stock_disponible`.
  - Registra movimiento en `kardex_inventario` (`MANTENIMIENTO_PREVENTIVO`).
  - Asienta auditoría inmutable en `AuditLogger`.
  - Invalida caché Redis con clave multi-tenant.

---

## 4. Componentes UI & Chrome DevTools Verification
1. `src/components/bodega/RegistrarMantenimientoModal.tsx`:
   - Modal accesible con `role="dialog"`, soporte `Escape` y cierre en backdrop.
   - Desglose de insumos, horas reseteadas y observaciones del mecánico.
2. `src/components/bodega/BarraVidaUtilEquipo.tsx`:
   - Barra fluida con código de colores HSL según `DESIGN.md`.
3. Inyección en `BodegaInteractiveIsland.tsx`:
   - Tab / Filtro rápido `🔧 Mantenimiento`.
   - Botón directo "Mantenimiento / Taller" en la fila del equipo.
4. Inspección DevTools:
   - Laptop (1366x768) y Móvil (375px) con 0 errores en consola.
