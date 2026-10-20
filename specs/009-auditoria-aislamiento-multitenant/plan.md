# Plan Técnico y Arquitectura de Blindaje: SPEC-009
## Auditoría Integral y Certificación de Aislamiento Multi-Tenant

### 1. Arquitectura de Seguridad (Three-Tier Defense-in-Depth)

```
┌─────────────────────────────────────────────────────────────┐
│ NIVEL 3: FRONTEND (React 18 / Zustand / Poka-Yoke UI)      │
│ - Filtro reactivo en Comboboxes y Tablas por empresaId      │
│ - Purga obligatoria in-memory en unifiedLogout()            │
│ - Bloqueo Poka-Yoke antes de invocar Server Actions         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Payload Sanitizado con Zod
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ NIVEL 2: BACKEND (Next.js Server Actions / Redis Cache)     │
│ - Autenticación estricta: getUser()                         │
│ - Resolución de tenant determinista: resolveEmpresaId()     │
│ - Filtrado explícito: .eq('empresa_id', empresaId)          │
│ - Claves de Caché Aisladas: tenant:{empresaId}:{resource}   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Service / User Token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ NIVEL 1: BASE DE DATOS (Supabase PostgreSQL 17 / RLS / RPCs)│
│ - Row-Level Security habilitado en 100% de tablas           │
│ - Validaciones pesimistas WHERE empresa_id = v_tenant_id    │
│ - Kardex inmutable y auditoría de accesos                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Matriz de Auditoría de las 21 Server Actions

| Archivo de Server Action | Función Auditada | Estado de Filtrado `empresa_id` | Corrección Requerida |
|---|---|:---:|---|
| `alquileres.ts` | `aprobarCotizacionAction` | ⚠️ Incompleto | Agregar `.eq('empresa_id', empresaId)` en select y update. Cambiar `user?.id` por `empresaId` en caché. |
| `alquileres.ts` | `registrarAbonoAction` | ⚠️ Incompleto | Agregar `.eq('empresa_id', empresaId)` en consulta y actualización de saldo. |
| `alquileres.ts` | `updateRentalClientAction` | ⚠️ Parcial | Corregir `invalidateTenantCache(user?.id, ...)` por `empresaId`. |
| `alquileres.ts` | `obtenerAlquileresAction` | ✅ Conforme | Filtra `.eq('empresa_id', empresaId)`. |
| `alquiler-segmentado.ts`| `crearAlquilerSegmentadoAction` | ✅ Conforme | RPC pesimista valida `v_tenant_id` y caché usa `empresaId`. |
| `equipos.ts` | `crearEquipoAction`, `editarEquipoAction`, `liberarMantenimientoAction` | ✅ Conforme | Actualizado en SPEC-008 con `empresaId` en BD y caché. |
| `clientes.ts` | `crearClienteAction`, `editarClienteAction`, `obtenerClientesAction` | ✅ Conforme | Actualizado en SPEC-008 con `empresaId` en BD y caché. |
| `facturacion-recurrente.ts`| `emitirCuentaCobroPeriodicaAction` | ✅ Conforme | Actualizado en SPEC-008 con `empresaId` en BD y caché. |
| `cotizaciones.ts` | `crearCotizacionAction`, `convertirCotizacionAContratoAction` | 🔍 A Auditar | Verificar que cada query tenga `.eq('empresa_id', empresaId)`. |
| `compras.ts` | `crearOrdenCompraAction`, `cambiarEstadoCompraAction` | 🔍 A Auditar | Verificar aislamiento por tenant en compras y recepción kardex. |
| `caja.ts` | `abrirSesionCajaAction`, `cerrarSesionCajaAction`, `registrarMovimientoCajaAction` | 🔍 A Auditar | Verificar que sesión activa y movimientos pertenezcan a `empresaId`. |
| `devoluciones.ts` | `procesarDevolucionAvanzadaAction` | 🔍 A Auditar | Verificar que el contrato a devolver pertenezca a la empresa en sesión. |
| `cuentas-por-pagar.ts` | `registrarAbonoProveedorAction` | 🔍 A Auditar | Verificar que la cuenta por pagar pertenezca a la empresa en sesión. |
| `proveedores.ts` | `crearProveedorAction`, `editarProveedorAction` | 🔍 A Auditar | Verificar que los proveedores queden aislados por `empresa_id`. |
| `subcontrataciones.ts` | `crearSubcontratacionAction`, `liquidarSubcontratacionAction` | 🔍 A Auditar | Verificar que contrato y maquinaria subcontratada pertenezcan al tenant. |
| `dashboard.ts` | `obtenerDashboardDataAction` | ✅ Conforme | Todas las consultas concurrentes filtran estrictamente `.eq('empresa_id', empresaId)`. |
| `ultraadmin.ts` | Operaciones administrativas de plataforma | 🛡️ Exclusivo UltraAdmin | Valida rol `ULTRAADMIN` con sesión global supervisada. |

---

### 3. Modelo de Amenazas (STRIDE)

1. **Spoofing / Suplantación de Tenant**:
   - *Amenaza*: Un usuario de la Empresa A manipula un `clienteId` o `equipoId` de la Empresa B en el payload HTTP.
   - *Mitigación*: Validación Zod + `resolveEmpresaId(user.id)` en backend; toda consulta valida `eq('empresa_id', empresaId)`.
2. **Tampering / Manipulación Cruzada**:
   - *Amenaza*: Invocación directa de `registrarAbonoAction` enviando el ID de un contrato de otra empresa.
   - *Mitigación*: Cláusula estricta `.eq('empresa_id', empresaId)` en el `update` abortando la transacción si el registro no coincide.
3. **Information Disclosure / Fuga de Datos en Caché**:
   - *Amenaza*: Un tenant consulta recursos cacheados bajo claves compartidas o de usuario huérfanas.
   - *Mitigación*: Claves en Redis con prefijo estricto `tenant:{empresaId}:{resource}`.

---

### 4. Plan de Pruebas Adversariales Automatizadas (Vitest)
Se creará la suite `tests/integration/security/cross-tenant-isolation.test.ts` con los siguientes casos hostiles:
1. **Intento de Aprobación Cruzada**: Usuario de Tenant A intenta ejecutar `aprobarCotizacionAction` sobre contrato de Tenant B -> Bloqueado con error / 0 filas afectadas.
2. **Intento de Abono Cruzado**: Usuario de Tenant A intenta registrar abono en contrato de Tenant B -> Bloqueado con error.
3. **Intento de Edición de Catálogo Cruzado**: Usuario de Tenant A intenta editar un equipo de Tenant B -> Bloqueado con error.
4. **Intento de Acceso a Clientes Cruzado**: Usuario de Tenant A intenta actualizar cliente de Tenant B -> Bloqueado con error.
5. **Intento de Devolución Cruzada**: Usuario de Tenant A intenta devolver contrato de Tenant B -> Bloqueado con error.
6. **Aislamiento de Caché Redis**: Comprobar que invalidar caché en Tenant A no afecte ni purgue las claves de Tenant B.
