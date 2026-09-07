<!-- Generated: 2026-09-07 | Files scanned: ~20 | Token estimate: ~450 -->
# Frontend Architecture

## Page Tree (`src/app/`)
- `/alquileres`: Dashboard de contratos, wizard de nuevo alquiler y manejo de abonos.
- `/bodega`: Panel de inventario, Kardex visual (pendiente) y ajustes Poka-Yoke de stock (`EditarEquipoModal.tsx`).
- `/caja`: Gestión de turnos, apertura, cierres de caja y arqueo de efectivo.
- `/devoluciones`: Wizard Poka-Yoke interactivo para el reingreso parcial/total de equipos.
- `/facturacion`: Visualización de cuentas por cobrar.

## Components (`src/app/components/` & `src/components/`)
- `bodega/EditarEquipoModal.tsx`: Control de Stock UI con motivo de ajuste obligatorio (Delta).
- `cartera/RegistrarPagoModal.tsx`: Calculadora de Vueltas para pagos en EFECTIVO.
- `devoluciones/NeuDevolucionWizard.tsx`: Wizard paso a paso para devolver items.
- `forms/AlquilerForm.tsx` & `BodegaForm.tsx`: Formularios base.

## State Management (`src/infrastructure/state/`)
- `alquilerStore.ts`: Estado local de contratos.
- `bodegaStore.ts`: Estado local de equipos.
- `ledgerStore.ts`: Estado global para transacciones (pagos).
