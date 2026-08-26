<!-- Generated: 2026-08-26 | Files scanned: ~50 | Token estimate: ~400 -->
# Frontend Architecture

## Pages (App Router)
- `src/app/alquileres/page.tsx`: Orchestrates rental contracts and return payments.
- `src/app/devoluciones/page.tsx`: Specialized view for returns and history.

## Key Components
- `src/components/forms/AlquilerForm.tsx`: Complex form managing nested creation (On-the-fly) of Clients and Inventory items without losing state.
- `src/components/forms/ClienteForm.tsx`: Client creation form.
- `src/components/forms/BodegaForm.tsx`: Inventory item creation form.
- `src/components/ui/Modal.tsx`: Reusable modal wrapper allowing nested layers.

## State Management
- Zustand is used for global client-side state.
- `src/infrastructure/state/alquilerStore.ts`: Manages rental contracts array.
- `src/infrastructure/state/clienteStore.ts`: Manages clients array.
- `src/infrastructure/state/bodegaStore.ts`: Manages inventory array.
