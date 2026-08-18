# Diccionario de Funciones y Mapeo Arquitectónico (Legacy GAS ➔ Next.js + Supabase)

**Proyecto:** FerreOn ERP  
**Fecha de Generación:** 2026-08-18  
**Propósito:** Servir como especificación técnica canónica y diccionario de equivalencias entre las funciones en Google Apps Script (V8 Engine) y los componentes de la Arquitectura Hexagonal en Next.js (App Router) + Supabase PostgreSQL.

---

## 1. Mapeo de Puntos de Entrada HTTP y Enrutamiento (Router)

| Archivo / Función Legacy (GAS) | Función / Módulo | Destino en Nueva Arquitectura (Next.js / Supabase) | Ubicación / Ruta en Nuevo Repo | Descripción del Cambio / Mejora |
|---|---|---|---|---|
| `backend/nucleo/app.js` | `doGet(e)` | `Next.js App Router Middleware` + Routing Nativo | `src/presentation/app/api/` | Reemplaza el dispatcher monolítico de Apps Script por rutas serverless independientes en Next.js. |
| `backend/nucleo/app.js` | `doGetApi_(e)` | `GET /api/alquileres`, `GET /api/facturas`, etc. | `src/presentation/app/api/[recurso]/route.ts` | Handlers síncronos GET tokenizados con Supabase SSR. |
| `backend/nucleo/app.js` | `doPostApi_(e)` | `POST /api/alquileres`, `POST /api/facturas`, etc. | `src/presentation/app/api/[recurso]/route.ts` | Handlers síncronos POST/PUT con validación de Zod DTOs. |
| `backend/api/api_Router.js` | `doGetSpa_(e)` | Next.js Server & Client Components (`App Router`) | `src/presentation/app/(dashboard)/page.tsx` | La SPA embebida en `HTMLService` evoluciona a un dashboard React optimizado con renderizado server-side (SSR). |
| `backend/api/api_REST.js` | `handleApiRequest_` | API Routes Controllers | `src/presentation/app/api/` | Descomposición de condicionales masivos (`switch action`) en Handlers desacoplados por entidad. |

---

## 2. Mapeo de Módulos de Servicio y Negocio (Service Layer ➔ Domain Use Cases)

### 2.1 Módulo de Alquileres (`server_alquileres.js`)

| Función Legacy (GAS) | Entradas / Parámetros | Caso de Uso / Adaptador Destino (TypeScript) | Ubicación / Ruta en Nuevo Repo | Cambio / Regla de Negocio Aplicada |
|---|---|---|---|---|
| `crearNuevoAlquiler()` | `(clienteId, itemsArray, deposito, garantia)` | `CrearAlquilerUseCase.execute(dto)` | `src/core/application/use-cases/crear-alquiler.use-case.ts` | Transacción ACID nativa en Supabase (`INSERT` cabecera y renglones de detalle en un solo `db.rpc` o `supabase.transaction`). |
| `actualizarEstadoAlquiler()` | `(alquilerId, nuevoEstado)` | `ActualizarEstadoAlquilerUseCase.execute(id, estado)` | `src/core/application/use-cases/actualizar-estado-alquiler.use-case.ts` | Validación de máquina de estados (`COTIZACION` ➔ `ACTIVO` ➔ `FINALIZADO`). |
| `devolverItemsAlquiler()` | `(alquilerId, renglonesDevueltos)` | `DevolverItemsUseCase.execute(dto)` | `src/core/application/use-cases/devolver-items.use-case.ts` | Recálculo de días reales contratados, registro de `costo_dano` y retorno automático de stock a `items`. |
| `obtenerAlquileresActivos()` | `(filtros)` | `SupabaseAlquilerRepository.findActivos(filtros)` | `src/infrastructure/persistence/supabase/supabase-alquiler.repository.ts` | Consulta directa optimizada con Supabase Client y paginación `range(start, end)`. |

---

### 2.2 Módulo de Facturación y Cuentas de Cobro (`server_facturación.js`)

| Función Legacy (GAS) | Entradas / Parámetros | Caso de Uso / Adaptador Destino (TypeScript) | Ubicación / Ruta en Nuevo Repo | Cambio / Regla de Negocio Aplicada |
|---|---|---|---|---|
| `generarFacturaHeader()` | `(alquilerId, total, saldo)` | `GenerarFacturaUseCase.execute(dto)` | `src/core/application/use-cases/generar-factura.use-case.ts` | Asignación de consecutivo unívoco `numero_cc` con secuencia PostgreSQL (`SERIAL`). |
| `registrarPagoAlquiler()` | `(facturaId, monto, fecha)` | `RegistrarPagoUseCase.execute(dto)` | `src/core/application/use-cases/registrar-pago.use-case.ts` | Actualización atómica de `saldo_pendiente` en `facturas_header` con verificación de sobrepago. |

---

### 2.3 Módulo de Generación de Documentos y PDFs (`server_pdf.js`)

| Función Legacy (GAS) | Entradas / Parámetros | Caso de Uso / Adaptador Destino (TypeScript) | Ubicación / Ruta en Nuevo Repo | Cambio / Regla de Negocio Aplicada |
|---|---|---|---|---|
| `generarPdfAlquiler()` | `(alquilerId, tipoDoc)` | `GenerarPDFDocumentoAdapter.generate(alquiler, items)` | `src/infrastructure/pdf/react-pdf-generator.adapter.ts` | Reemplaza `HTMLService.createTemplateFromFile()` por `@react-pdf/renderer` ejecutado en memoria serverless. |
| `guardarPdfEnDrive()` | `(blobPdf, nombreArchivo)` | `SupabaseStorageAdapter.uploadPdf(buffer, path)` | `src/infrastructure/storage/supabase-storage.adapter.ts` | Almacena el PDF binario en el bucket `documentos-pdf` de Supabase Storage y retorna URL firmada. |
| `debugGarantia145()` / `debugColumnMapping()` | `()` | Test de Integración PDF | `tests/integration/pdf-generation.test.ts` | Garantiza que el PDF incluya el 100% de los ítems contratados sin omitir devueltos y muestre depósitos/garantías correctamente. |

---

### 2.4 Módulo de Diagnóstico, Limpieza y Mantenimiento (`server_diagnostico.js` / `service_LogsRotation.js`)

| Función Legacy (GAS) | Entradas / Parámetros | Caso de Uso / Adaptador Destino (TypeScript) | Ubicación / Ruta en Nuevo Repo | Cambio / Regla de Negocio Aplicada |
|---|---|---|---|---|
| `ejecutarDiagnosticoBasura()` | `()` | `DiagnosticarConsistenciaDatosUseCase` | `src/core/application/use-cases/diagnosticar-consistencia.use-case.ts` | Consulta SQL de auditoría buscando huérfanos entre `alquileres` y `alquileres_detalle`. |
| `ejecutarLimpiezaDatos()` | `()` | `PurgarRegistrosAuditadosUseCase` | `src/core/application/use-cases/purgar-registros.use-case.ts` | Transacción atómica de traslado a `papelera_auditoria` sin necesidad de borrado en orden inverso de filas. |
| `rotarLogsAntiguos()` | `()` | Endpoint `/api/cron/rotar-logs` | `src/presentation/app/api/cron/rotar-logs/route.ts` | Invocación automática vía **Vercel Cron Jobs** o `pg_cron` de Supabase. |

---

## 3. Mapeo de Utilidades, Bloqueos y Esquemas (`utils.js` / `Schema.js`)

| Función / Constante Legacy (GAS) | Utilidad / Módulo Destino (TypeScript) | Equivalente en la Nueva Arquitectura |
|---|---|---|
| `withLock(lockName, fn)` | Transacciones Nativas PostgreSQL | Eliminado. PostgreSQL administra la concurrencia aislada mediante transacciones ACID (`BEGIN ... COMMIT`) sin bloqueos en aplicación. |
| `H` (Constantes de Cabecera) | DTOs de Entidad TypeScript & Zod Schemas | Reemplazado por `src/core/domain/entities/alquiler.ts` y tipos de la DB generados por Supabase CLI. |
| `D` (Constantes de Detalle) | DTOs de Detalle TypeScript | Reemplazado por `src/core/domain/entities/alquiler-detalle.ts`. |
| `PESO_KG * 1000` | Value Object `PesoGramos` | Encapsulado en `src/core/domain/value-objects/peso-gramos.ts` (`BigInt` en DB PostgreSQL `peso_gramos BIGINT`). |
