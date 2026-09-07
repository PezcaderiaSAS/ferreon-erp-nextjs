<!-- Generated: 2026-09-07 | Files scanned: ~10 | Token estimate: ~400 -->
# Backend Architecture (Server Actions)

## Core Actions (`src/app/actions/`)
- `alquileres.ts`: Maneja la lógica de contratos de alquiler y devoluciones.
- `equipos.ts`: Gestión de inventario (Kardex) y ajustes Poka-Yoke. Usa RPC `ajustar_stock_equipo` para evitar overbooking.
- `pagos.ts`: Registro de ingresos. Tiene dependencias de validación contra `sesiones_caja` (estado ABIERTA).

## Key Files
- `src/infrastructure/persistence/supabase/server.ts` (Instanciación de clientes Supabase SSR)
- `src/app/actions/pagos.ts` (Validación de Caja Poka-Yoke)
- `src/app/actions/equipos.ts` (Manejo del Kardex Inmutable)

## Patterns
- **Poka-Yoke**: Validaciones restrictivas a nivel de backend antes de la mutación (ej: Caja abierta, stock disponible).
- **Idempotencia**: Se prevé el uso de `idempotency_key` en acciones críticas para evitar inserciones duplicadas (ej: doble click en pagos).
