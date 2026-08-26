<!-- Generated: 2026-08-26 | Files scanned: ~20 | Token estimate: ~300 -->
# Data Architecture

## Key Entities (Domain)
- **AlquilerEntity**:
  - Properties: `estado`, `totalReal`, `subtotalEquiposReal`, `detalles` (Items).
  - Methods: `registrarDevolucion` (Split Line logic for cloning fractional returns), `liquidarDevolucion`.
- **ItemAlquilerDetalle**:
  - Properties: `cantidad`, `cantidadDevuelta`, `subtotalLineaReal`, `diasReales`, `costoDano`.
- **Cliente**:
  - Properties: `nit`, `nombre`, `contacto`, `nivelRiesgo`.
- **Equipo**:
  - Properties: `sku`, `nombre`, `categoria`, `stockInicial`.

## Persistence Strategy
- **Current (Prototyping)**: In-memory Zustand stores (`alquilerStore`, `clienteStore`).
- **Future (Production)**: Supabase PostgreSQL using Domain Adapters (e.g. `SupabaseEquipoRepository`).
