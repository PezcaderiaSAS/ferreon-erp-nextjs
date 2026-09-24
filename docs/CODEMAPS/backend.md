<!-- Generated: 2026-09-23 | Files scanned: ~56 | Token estimate: ~880 -->
# Alquileres System - Arquitectura Backend (Server Actions & API Routes)

## Acciones del Servidor (`src/app/actions/`)
- `alquileres.ts`: Contratos de alquiler y devoluciones (`crearAlquilerAction`, `editarAlquilerAction`, `procesarDevolucionAction`, `aprobarCotizacionAction`). Guardia de idempotencia con `idempotency_key` (UUID v4), retorno `{ success: true, data, idempotent: true }` ante repeticiones, y ejecución atómica con bloqueo `FOR UPDATE` en Postgres.
- `caja.ts`: Tesorería y turnos (`abrirCajaAction`, `cerrarCajaAction`, `registrarMovimientoCajaAction`, `obtenerSesionCajaActivaAction`). Control de saldos base, recaudos, egresos, arqueo ciego y emisión de comprobantes contables.
- `compras.ts`: Aprovisionamiento de maquinaria e inventario (`crearCompraAction`, `obtenerComprasAction`). Liquidación tributaria (IVA 19%, ReteFuente, ReteICA), asientos balanceados en `journal_entries`, stock en `equipos` y Kardex (`INGRESO_COMPRA`).
- `proveedores.ts`: Catálogo de proveedores (`obtenerProveedoresAction`, `crearProveedorAction`, `actualizarProveedorAction`). Validación Zod, resolución de `tenant_id` y caché en Redis (`cacheKey: proveedores:${tenantId}`).
- `cotizaciones.ts`: Emisión y formalización (`crearCotizacionAction`, `obtenerCotizacionesAction`, `convertirCotizacionAContratoAction`). Liquidación tributaria y conversión 1-clic con bloqueo pesimista ordenado (`ORDER BY id ASC FOR UPDATE`) contra sobreventa y deadlocks.
- `facturacion.ts`: Facturas comerciales formales (`emitirFacturaLedgerAction`) con asientos contables de venta (`1305`, `1355`, `2408`, `4155`).
- `devoluciones.ts`: Recepción técnica de maquinaria (`procesarDevolucionAvanzadaAction`). Validación Zod perimetral, idempotencia UUID v4, RPC `procesar_devolucion_avanzada` con Split-Line inmutable y movimientos de caja automáticos.
- `subcontrataciones.ts`: Maquinaria de aliados (`crearSubcontratacionAction`, `cambiarEstadoSubcontratacionAction`, `liquidarSubcontratacionAction`). Cómputo de costos a dos tiempos, retenciones DIAN y asientos en el Ledger (`6135` vs `2365`, `2368`, `2205`).
- `equipos.ts`: Inventario y ajustes Poka-Yoke con RPCs `ajustar_stock_equipo` y `reducir_stock_seguro`.
- `pagos.ts`: Recaudos y pagos mixtos multilínea (`registrarPagoAction`, `registrarPagoMixtoAction`). División entre Efectivo, Bancos, Billeteras y Saldo a Favor, actualizando saldo del cliente, caja y Ledger.
- `ultraadmin.ts`: Gobernanza multi-tenant (`obtenerEmpresasParaSelectorAction`, `obtenerDirectorioEmpresasAction`, `toggleModuloEmpresaAction`, `extenderLicenciaEmpresaAction`, `cambiarEstadoUsuarioAction`). Protegido por `is_ultra_admin()` con invalidación atómica de sesiones en Upstash Redis (`session:user:{id}`) en $<1$s.

## Rutas API (`src/app/api/`)
- `/api/auth/callback`: Intercambio de código de autenticación de Supabase Auth y redirección a `/dashboard`.
- `/api/auth/signout`: Cierre seguro de sesión con invalidación de cookies de autenticación.
- `/api/cron/check-licenses`: Cron Job protegido con `CRON_SECRET` para evaluación periódica de estados de licencias empresariales.
- `/api/facturas/[id]/pdf`: Endpoint para generación y entrega de facturas comerciales en formato PDF.
- `/api/empresa/logo`: Carga, validación y entrega optimizada de isotipos y logos corporativos.
- `/api/health`: Health check de disponibilidad de base de datos Supabase y caché Redis.

## Servicios Puros de Dominio (`src/core/services/` & `src/core/utils/`)
- `licencias-modulos.service.ts`: Cálculo determinístico de vigencia, semáforo de 4 estados (`ACTIVA`, `POR_VENCER`, `EN_GRACIA`, `VENCIDA`), períodos de gracia y resolución de módulos activos.
- `costo-promedio.service.ts`: Recálculo matemático de Costo Promedio Ponderado (PMP) y valuación de inventario.
- `cartera-proveedores.service.ts`: Gestión de Cuentas por Pagar (CXP), semáforo de morosidad y comprobantes de egreso.
- `cotizacion-tributaria.service.ts`: Liquidación de cotizaciones (IVA 19%, Retefuente 2.5%, ReteICA 9.66‰) y fletes.
- `pago-mixto.service.ts`: Liquidación multilínea de pagos y balance en partida doble.
- `arqueo-caja.service.ts`: Arqueo ciego por denominaciones COP y balance de diferencias.
- `liquidacion-devolucion.service.ts`: Cálculo de split-line, deducción de averías y balance de depósito en garantía.
- `liquidacion-subcontratacion.service.ts`: Liquidación a dos tiempos con retenciones DIAN y partida doble.
- `calculo-compras-tributario.ts`: Liquidación tributaria y generación de asientos contables.
- `fechas.ts`: Neutralizador canónico de fechas con fijación de mediodía (`12:00:00`) para invarianza en UTC-5.
- `audit-logger.ts`: Registro inmutable asíncrono en `audit_logs`.
- `validation.ts`: Validación perimetral con esquemas Zod.

## Infraestructura de Seguridad (HOC & Prisma)
- `withTenantContext.ts` (`src/infrastructure/security/`): HOC (Middleware) obligatorio para todas las Server Actions. Extrae y certifica el token JWT vía `zod`, capturando la claim `app_metadata.empresa_id` e inyectando un Prisma Client contextualizado (`TenantPrismaClient`). Arroja `AuthorizationError` en caso de brechas.
- `client.ts` (`src/infrastructure/persistence/prisma/`): Extensión Prisma Multi-Tenant con Validación Post-Query obligatoria en `findUnique`, bloqueando intentos de lectura trans-inquilino.

## Scripts de Soporte y Operación (`scripts/`)
- `scripts/setup_demo_user.mjs`: Creación y vinculación de usuario demo de prueba (`demo@alquileres-system.com`) con la empresa principal `ac8719ea-f16a-4538-b308-40d9511a14cb` en `empresa_usuarios`.
- `scripts/diagnosticar_duplicados.mjs`: Diagnóstico forense de integridad referencial y detección de registros duplicados en PostgreSQL.
