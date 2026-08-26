<!-- Generated: 2026-08-26 | Files scanned: 50 | Token estimate: ~800 -->
# Frontend Architecture (FerreOn ERP)

## Page Tree (app/)
- `alquileres/page.tsx` → Orquestación de pagos, facturación y estados de contratos.
- `devoluciones/page.tsx` → Recepción de andamios y liquidaciones parciales/totales.

## Key Components (components/)
- `alquileres/DetalleAlquilerModal.tsx` → UI de desglose financiero (Daños, Fletes, CxC).
- `clientes/DetalleClienteModal.tsx` → UI de estado de cliente.
- `bodega/EditarEquipoModal.tsx` → Inventario.

## Domain Core (core/)
- `src/core/domain/entities/alquiler.ts` → Lógica de negocio (días calendario, cálculo de daños separados, liquidación de abonos).

## State Management (infrastructure/state)
- `alquilerStore.ts` (Zustand) → Estado global reactivo con estrategias `sanitizeStore` y clonación estricta sin `JSON.stringify()`.
