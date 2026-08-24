<!-- Generated: 2026-08-21 | Files scanned: 28 | Token estimate: ~750 -->
# Frontend Architecture & Codemap

## Route Hierarchy (Next.js App Router)
- `/` → Redirección / Dashboard
- `/alquileres` → `src/app/alquileres/page.tsx` (Gestión de Contratos, Filtros, Click a `DetalleAlquilerModal 360°`, Wizard Form)
- `/bodega` → `src/app/bodega/page.tsx` (Inventario, Stock Disponible/En Obra/Total, Click a `EditarEquipoModal` con panel +/-)
- `/devoluciones` → `src/app/devoluciones/page.tsx` (Retornos, Daños, Sincronización automática de stock devuelto a Bodega)
- `/clientes` → `src/app/clientes/page.tsx` (Directorio, KPIs de riesgo, Click a `DetalleClienteModal 360°` en 3 pestañas)
- `/facturacion` → `src/app/facturacion/page.tsx` (Cartera, Liquidación, Recaudos)
- `/configuracion` → `src/app/configuracion/page.tsx` (Tabs: Datos de Empresa y Usuarios)
- `/auth/login` → `src/app/auth/login/page.tsx` (Pantalla de Google OAuth)
- `/unauthorized` → `src/app/unauthorized/page.tsx` (Mensaje de error por falta de privilegios)

## Modals & Specialized Components
- `src/app/components/alquileres/DetalleAlquilerModal.tsx` (Inspección 360° de contrato, liquidación y botón de transición a edición)
- `src/app/components/bodega/EditarEquipoModal.tsx` (Edición de equipo y panel de Ajuste Rápido de Stock con motivos)
- `src/app/components/clientes/DetalleClienteModal.tsx` (Ficha 360°: 1. Info/Edición, 2. Historial de Alquileres, 3. Cartera/Saldos)
- `src/app/components/devoluciones/RegistrarDevolucionModal.tsx` (Recepción con reintegro de inventario)
- `src/components/ui/Modal.tsx` (Modal responsivo con props `maxWidth: sm | md | lg | xl | 2xl | 3xl | 4xl | 5xl | full`)
- `src/components/ui/Button.tsx` (Botón con soporte de `isLoading` y bloqueo anti-doble submit)
- `src/components/forms/AlquilerForm.tsx` (Wizard responsivo de 3 pasos)
- `src/components/forms/BodegaForm.tsx` (Formulario con SKU autoincremental `EQ-XXX` y stock inicial)
- `src/components/forms/ClienteForm.tsx` (Formulario de gestión de clientes)
- `src/app/configuracion/UsuariosTab.tsx` (Listado y creación de usuarios con RBAC y Avatares)

## State Stores (Zustand + Persist)
- `src/infrastructure/state/alquilerStore.ts` (Contratos, Idempotency, Snapshots)
- `src/infrastructure/state/bodegaStore.ts` (Equipos, `generarSiguienteSKU`, `ajustarStock`, `descontarStock`, `incrementarStock`)
- `src/infrastructure/state/clienteStore.ts` (Clientes con persistencia `cliente-storage`, `updateCliente`)
- `src/infrastructure/state/realtimeSync.ts` (WebSockets Supabase Realtime)

