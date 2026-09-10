<!-- Generated: 2026-09-10 | Files scanned: ~35 | Token estimate: ~680 -->
# Backend Architecture (Server Actions & API Routes)

## Core Actions (`src/app/actions/`)
- `compras.ts`: Aprovisionamiento de maquinaria e inventario (`crearCompraAction`, `obtenerComprasAction`). Incorpora `calcularLiquidacionCompra` (IVA 19%, ReteFuente 2.5%/3.5%, ReteICA 9.66‰), asientos balanceados multilínea en `journal_entries` (Activo `1520`, IVA `2408`, ReteFuente `2365`, ReteICA `2368`, Contrapartida `1105`/`1110`/`2205`), incremento atómico de stock en `equipos` y trazabilidad inmutable en `kardex_inventario` (`INGRESO_COMPRA`).
- `proveedores.ts`: Catálogo maestro de proveedores (`obtenerProveedoresAction`, `crearProveedorAction`, `actualizarProveedorAction`). Valida datos con Zod, resuelve `tenant_id` y administra caché distribuida en Redis (`cacheKey: proveedores:${tenantId}`).
- `cotizaciones.ts`: Emisión y ciclo de vida de cotizaciones de obra (`crearCotizacionAction`, `obtenerCotizacionesAction`, `convertirCotizacionAContratoAction`). Soporta casillas tributarias interactivas y conversión 1-clic con bloqueo pesimista contra sobreventa.
- `facturacion.ts`: Emisión de facturas comerciales formales (`emitirFacturaLedgerAction`) con asientos contables de venta (`1305 Clientes`, `1355 Anticipos`, `2408 IVA Generado`, `4155 Ingresos por Alquileres`).
- `alquileres.ts`: Contratos de alquiler y devoluciones (`crearAlquilerAction`, `editarAlquilerAction`, `procesarDevolucionAction`). Bloquea edición si el contrato está FINALIZADO o cuenta con devoluciones.
- `equipos.ts`: Inventario (Kardex) y ajustes Poka-Yoke con RPC `ajustar_stock_equipo` y `reducir_stock_seguro`.
- `pagos.ts`: Abonos e ingresos con validación contra sesiones de caja ABIERTAS.
- `ultraadmin.ts`: Supervisión global multi-tenant protegida por `is_ultra_admin()`.

## API Endpoints (`src/app/api/`)
- `/api/alquileres`: Catálogo de contratos con lectura read-through en Upstash Redis y fallback a Supabase PostgreSQL.
- `/api/clientes`: Directorio de clientes autenticado con validación Zod.
- `/api/equipos`: Inventario de maquinaria con tarifas y stock disponible en tiempo real.
- `/api/auditoria`: Consulta de logs de auditoría inmutables (`audit_logs`) con paginación y filtros por módulo/acción.
- Cabeceras estándar: `Cache-Control: no-store, no-cache, must-revalidate`.

## Key Files
- `src/core/services/calculo-compras-tributario.ts` (Servicio puro de liquidación tributaria y partida doble contable)
- `src/core/services/pdf-factura-generator.service.ts` (Generador de plantillas HTML corporativas para Facturas y Cotizaciones)
- `src/lib/security/validation.ts` (Validación dual-layer con esquemas Zod en API Routes y Actions)
- `src/lib/security/audit-logger.ts` (Servicio no bloqueante de auditoría inmutable en `audit_logs`)
- `src/infrastructure/persistence/supabase/server.ts` (Clientes Supabase SSR seguros con cookies)

## Patterns
- **Partida Doble Balanceada**: Validación matemática obligatoria $\sum D + \sum C = 0$ antes de persistir en `journal_entries`.
- **Poka-Yoke**: Restricciones previas a la mutación (stock disponible pesimista, sesión de caja abierta, contrato no finalizado).
- **Idempotencia**: Llaves únicas criptográficas (`compra_OC-XXXX_timestamp`) en mutaciones transaccionales.
- **Cache Invalidation**: Invalidación proactiva en Upstash Redis (`cache:compras`, `cache:proveedores`, `cache:equipos`, `cache:cotizaciones`).
