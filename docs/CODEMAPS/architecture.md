<!-- Generated: 2026-08-26 | Files scanned: ~50 | Token estimate: ~300 -->
# High-Level Architecture

## Overview
FerreOn-ERP is built using Next.js (App Router) combined with a Hexagonal Architecture pattern to decouple business rules from framework details.

## High-Level Boundaries
- **Domain Layer (`src/core/domain`)**: Core business logic and entities (`AlquilerEntity`, `Cliente`, `Equipo`, `EmpresaConfig`). Enforces critical rules like the *Split Line* technique for partial returns.
- **Application Layer (`src/core/application`)**: Use cases orchestrating domain entities (e.g., `CrearEquipo`).
- **Infrastructure Layer (`src/infrastructure`)**: Zustand state stores (`alquilerStore`, `clienteStore`, `bodegaStore`) and Adapters (e.g., Supabase repositories).
- **Presentation Layer (`src/app`, `src/components`)**: Next.js App Router for views, modular React components for forms and nested modals (On-the-fly creation).

## Data Flow
`User Action (UI)` → `Store (Zustand)` → `Entity (Domain math/rules)` → `Store (Update global state)` → `Adapter (Persistence)`
