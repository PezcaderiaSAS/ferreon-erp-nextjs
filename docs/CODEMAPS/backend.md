<!-- Generated: 2026-09-17 | Files scanned: ~52 | Token estimate: ~860 -->
# Backend Architecture (Server Actions & API Routes)

## Core Actions (`src/app/actions/`)
- `alquileres.ts`: Contratos de alquiler y devoluciones (`crearAlquilerAction`, `editarAlquilerAction`, `procesarDevolucionAction`, `aprobarCotizacionAction`). Incorpora guardia de idempotencia perimetral con `idempotency_key` (UUID v4), detección de transacciones repetidas con retorno inmediato `{ success: true, data, idempotent: true }`, ejecución atómica de `crear_alquiler_transaccional` con bloqueo `FOR UPDATE` de inventario, y restitución de stock al devolver ítems.
- `caja.ts`: Gestión de turnos y tesorería (`abrirCajaAction`, `cerrarCajaAction`, `registrarMovimientoCajaAction`, `obtenerSesionCajaActivaAction`). Control de saldos base, recaudos en efectivo, egresos operacionales, arqueo ciego, determinación de faltantes/sobrantes y emisión de comprobantes contables.
- `compras.ts`: Aprovisionamiento de maquinaria e inventario (`crearCompraAction`, `obtenerComprasAction`). Incorpora `calcularLiquidacionCompra` (IVA 19%, ReteFuente 2.5%/3.5%, ReteICA 9.66‰), asientos balanceados multilínea en `journal_entries` (Activo `1520`, IVA `2408`, ReteFuente `2365`, ReteICA `2368`, Contrapartida `1105`/`1110`/`2205`), incremento atómico de stock en `equipos` y trazabilidad inmutable en `kardex_inventario` (`INGRESO_COMPRA`).
- `proveedores.ts`: Catálogo maestro de proveedores (`obtenerProveedoresAction`, `crearProveedorAction`, `actualizarProveedorAction`). Valida datos con Zod, resuelve `tenant_id` y administra caché distribuida en Redis (`cacheKey: proveedores:${tenantId}`).
- `cotizaciones.ts`: Emisión y ciclo de vida de cotizaciones de obra (`crearCotizacionAction`, `obtenerCotizacionesAction`, `convertirCotizacionAContratoAction`). Soporta cálculo tributario (IVA 19%, Retefuente 2.5%, ReteICA 9.66‰) y conversión atómica 1-clic con bloqueo pesimista ordenado (`ORDER BY id ASC FOR UPDATE`) contra sobreventa y deadlocks concurrentes.
- `facturacion.ts`: Emisión de facturas comerciales formales (`emitirFacturaLedgerAction`) con asientos contables de venta (`1305 Clientes`, `1355 Anticipos`, `2408 IVA Generado`, `4155 Ingresos por Alquileres`).
- `devoluciones.ts`: Recepción técnica de maquinaria y compensación neta de depósitos (`procesarDevolucionAvanzadaAction`, `obtenerHistorialDevolucionesAction`). Implementa validación Zod perimetral, idempotencia con UUID v4, invocación de RPC `procesar_devolucion_avanzada` con Split-Line inmutable, registro automático de movimientos en `movimientos_caja` (si hay devolución en efectivo y sesión de caja activa), auditoría forense e invalidación de caché Redis.
- `subcontrataciones.ts`: Gestión de maquinaria de proveedores aliados (`crearSubcontratacionAction`, `obtenerSubcontratacionesAction`, `cambiarEstadoSubcontratacionAction`, `registrarRetornoAProveedorAction`, `liquidarSubcontratacionAction`). Implementa cómputo de costos a dos tiempos (cliente vs aliado), cálculo de márgenes operativos, aplicación de retenciones tributarias (ReteFuente 2.5%, ReteICA 9.66‰) y generación de asientos contables balanceados en el Ledger (Cuentas `6135` vs `2365`, `2368`, `2205`).
- `equipos.ts`: Inventario (Kardex) y ajustes Poka-Yoke con RPC `ajustar_stock_equipo` y `reducir_stock_seguro`.
- `pagos.ts`: Recaudos, abonos simples y recaudos mixtos multilínea (`registrarPagoAction`, `registrarPagoMixtoAction`). Admite división entre Efectivo, Bancos (Bancolombia, Davivienda), Billeteras (Nequi, Daviplata) y Saldo a Favor del Cliente, actualizando `cliente_movimientos_saldo`, `pago_metodos_detalle`, caja activa y asiento en partida doble en Ledger.
- `ultraadmin.ts`: Supervisión global multi-tenant protegida por `is_ultra_admin()` y `verificarPermisoUltraAdmin()`. Acciones críticas: `obtenerEmpresasParaSelectorAction` (alimentación del selector universal de tenants), `obtenerDirectorioEmpresasAction` (cálculo de semáforo de licencias y días restantes), `obtenerUsuariosPorEmpresaAction` (auditoría cross-tenant de cuentas), `toggleModuloEmpresaAction` (activación/desactivación perimetral de módulos con purga en Redis), `extenderLicenciaEmpresaAction` (días de cortesía de 1-clic y fechas contractuales) y `cambiarEstadoUsuarioAction` / `actualizarPermisosUsuarioAction` con invalidación inmediata de sesiones activas en Redis (`session:user:{id}`) en $<1$s.

## Core Domain Services
- `src/core/services/licencias-modulos.service.ts` (Servicio determinístico puro: cálculo de vigencia sobre Epoch de 86.400.000 ms, semáforo de 4 estados ACTIVA/POR_VENCER/EN_GRACIA/VENCIDA, períodos de gracia configurables, feature flags de 9 módulos canónicos y resolución de permisos granulares con sobreescrituras)
- `src/core/services/costo-promedio.service.ts` (Servicio puro de recálculo matemático de Costo Promedio Ponderado PMP, prorrateo de fletes y valuación de inventario)
- `src/core/services/cartera-proveedores.service.ts` (Servicio puro de Cuentas por Pagar CXP, semáforo de morosidad, liquidación de abonos y balance en Ledger)
- `src/app/actions/cuentas-por-pagar.ts` (Server Actions para gestión de pasivos con proveedores, semáforo de vencimiento y abonos con Comprobantes de Egreso)
- `src/app/actions/compras.ts` (Server Actions para órdenes de compra y recepción transaccional en bodega con actualización de PMP en Kardex)
- `src/core/services/cotizacion-tributaria.service.ts` (Servicio puro de liquidación tributaria de cotizaciones: IVA 19%, Retefuente 2.5%, ReteICA 9.66‰ y fletes)
- `src/core/services/pago-mixto.service.ts` (Servicio puro de liquidación multilínea de pagos, validación de saldo a favor y balance en partida doble)
- `src/core/services/arqueo-caja.service.ts` (Servicio puro de arqueo ciego por denominaciones colombianas y ajuste en Ledger)
- `src/core/services/liquidacion-devolucion.service.ts` (Servicio puro de liquidación de devoluciones, Split-Line, prorrateo diario y compensación de garantía)
- `src/core/services/liquidacion-subcontratacion.service.ts` (Servicio puro de liquidación de maquinaria aliada a dos tiempos, retenciones DIAN y partida doble en Ledger)
- `src/core/services/calculo-compras-tributario.ts` (Servicio puro de liquidación tributaria y partida doble contable)
- `src/core/services/pdf-factura-generator.service.ts` (Generador de plantillas HTML corporativas para Facturas y Cotizaciones)
- `src/lib/security/validation.ts` (Validación dual-layer con esquemas Zod en API Routes y Actions)
- `src/lib/security/audit-logger.ts` (Servicio no bloqueante de auditoría inmutable en `audit_logs`)
- `src/infrastructure/persistence/supabase/server.ts` (Clientes Supabase SSR seguros con cookies)
- `scripts/diagnosticar_duplicados.mjs` (Script forense de auditoría para detección y trazabilidad de duplicados en base de datos)

## Patterns
- **Idempotencia End-to-End**: Clave criptográfica única (UUID v4) generada en frontend, transmitida por Server Action, y blindada a nivel de base de datos con índice UNIQUE y RPC atómico que ignora repeticiones.
- **Partida Doble Balanceada**: Validación matemática obligatoria $\sum D + \sum C = 0$ antes de persistir en `journal_entries`.
- **Poka-Yoke**: Restricciones previas a la mutación (stock disponible pesimista, sesión de caja abierta, contrato no finalizado).
- **Cache Invalidation**: Invalidación proactiva en Upstash Redis (`cache:compras`, `cache:proveedores`, `cache:equipos`, `cache:cotizaciones`).
