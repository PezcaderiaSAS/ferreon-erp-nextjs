<!-- Generated: 2026-08-21 | Files scanned: 36 | Token estimate: ~850 -->
# High-Level Architecture Codemap — FerreOn ERP

```mermaid
graph TD
    Client[Next.js App Router Frontend] -->|JWT Session (Middleware)| Middleware[Edge Middleware]
    Middleware -->|Rewrite on fail| AuthErr[Unauthorized View]
    Client -->|Zustand State & Optimistic UI| Store[Local Persistent Stores]
    Store -->|Background Sync| Supabase[(Supabase PostgreSQL)]
    Supabase -->|postgres_changes WebSockets| Realtime[RealtimeProvider]
    Realtime -->|Event Dispatches| Store
    Client -->|Google OAuth| SupabaseAuth[Supabase Auth]
```

## Service Boundaries & Layer Mapping
- **Presentation Layer (`src/app/`, `src/components/`)**:
  - `src/app/alquileres/`: Contratos de alquiler, vista 360° (`DetalleAlquilerModal.tsx`), Wizard Form (`AlquilerForm.tsx`)
  - `src/app/bodega/`: Control de inventario, stock disponible y ajuste rápido (`EditarEquipoModal.tsx`, `BodegaForm.tsx`)
  - `src/app/devoluciones/`: Recepción, retornos, averías e incremento de stock automático (`RegistrarDevolucionModal.tsx`)
  - `src/app/clientes/`: Directorio, historial y cartera 360° (`DetalleClienteModal.tsx`, `ClienteForm.tsx`)
  - `src/components/ui/`: `Button.tsx`, `Modal.tsx`, `Sidebar.tsx`, `TopNav.tsx`

- **Domain Layer (`src/core/domain/`)**:
  - `entities/`: `AlquilerEntity`, `EquipoEntity`, `ClienteEntity`, `PagoEntity`
  - `value-objects/`: `Garantia`, `MonedaCOP`

- **Application Layer (`src/core/application/use-cases/`)**:
  - `CrearAlquilerUseCase`, `EditarAlquilerUseCase`, `CrearEquipoUseCase`, `ProcesarDevolucionUseCase`

- **Infrastructure & State (`src/infrastructure/`)**:
  - `state/`: `alquilerStore.ts`, `bodegaStore.ts`, `clienteStore.ts`, `realtimeSync.ts`, `empresaStore.ts`
  - `persistence/supabase/`: `client.ts` (Browser SSR Client)
  - `adapters/`: `ZustandAlquilerRepository.ts`, `SupabaseEquipoRepository.ts`

- **Auth & API Layer (`src/app/api/`, `src/middleware.ts`)**:
  - `middleware.ts`: Verificación JWT SSR, `NextResponse.rewrite('/unauthorized')`
  - `api/usuarios/route.ts`: Uso de `SUPABASE_SERVICE_ROLE_KEY` para creación (`supabase.auth.admin.createUser`)
  - `api/auth/callback/route.ts`: Intercambio de código OAuth de Google
  - `app/auth/login/page.tsx`: Punto de entrada OAuth
