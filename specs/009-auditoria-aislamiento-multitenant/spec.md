# Especificación de Requerimientos del Sistema (SRS): SPEC-009
## Auditoría Integral y Certificación de Aislamiento Multi-Tenant (Three-Tier Immunity)

### 1. Resumen Ejecutivo
Alquileres System es una plataforma SaaS de misión crítica que aloja múltiples empresas arrendadoras de maquinaria y andamios. Para garantizar la confidencialidad, integridad y separación absoluta de la información corporativa, contable y de inventario, esta especificación establece la auditoría, remediación quirúrgica y certificación automatizada del 100% de los puntos de acceso a datos en 4 capas: Base de Datos (PostgreSQL RLS), Backend (Server Actions y API Routes), Caché (Upstash Redis) y Frontend (Zustand Stores y Componentes React).

---

### 2. Requerimientos del Sistema en Notación EARS (Easy Approach to Requirements Syntax)

#### 2.1 Capa de Base de Datos (Row-Level Security y RPCs)
- **REQ-DB-001 (Ubiquitous):** La base de datos siempre deberá habilitar Row-Level Security (RLS) en todas las tablas operativas (`alquileres`, `alquiler_detalles`, `equipos`, `clientes`, `compras`, `cotizaciones`, `devoluciones`, `facturas`, `kardex_inventario`, `sesiones_caja`, `movimientos_caja`, `proveedor_cuentas_pagar`, `subcontrataciones`).
- **REQ-DB-002 (Event-Driven):** CUANDO un usuario no autenticado o perteneciente a otra empresa intente ejecutar una consulta directa o invocar una función RPC, el motor PostgreSQL deberá denegar el acceso o aislar el resultado devolviendo cero registros o disparando una excepción transaccional.
- **REQ-DB-003 (State-Driven):** MIENTRAS se ejecute cualquier procedimiento almacenado transaccional (`alquiler_despachar_segmentado_concurrente_v1`, `procesar_devolucion_avanzada`, `formalizar_alquiler_cotizacion_transaccional`), el sistema deberá exigir y validar estrictamente que el `empresa_id` de la sesión coincida con el `empresa_id` de cada equipo y documento involucrado.

#### 2.2 Capa de Backend (Next.js Server Actions y Endpoints API)
- **REQ-BE-001 (Ubiquitous):** Todas las Server Actions en `src/app/actions/` deberán resolver el `empresaId` del usuario autenticado mediante `resolveEmpresaId(user.id)` y aplicar la cláusula explícita `.eq('empresa_id', empresaId)` en cada operación de lectura, actualización o eliminación (Defensa en Profundidad dual-layer).
- **REQ-BE-002 (Unwanted Behavior):** SI un payload de entrada contiene un `id` o clave foránea perteneciente a otra empresa o tenant, EL SISTEMA DEBERÁ abortar inmediatamente la operación con un error de acceso no autorizado o `NOT_FOUND`, sin modificar ningún registro en base de datos.
- **REQ-BE-003 (Event-Driven):** CUANDO una Server Action mute datos (`INSERT`, `UPDATE`, `DELETE`), la invalidación de caché Redis deberá utilizar obligatoriamente `empresaId` como clave de tenant (`invalidateTenantCache(empresaId, [...])`), impidiendo el uso de `user.id` o identificadores genéricos.

#### 2.3 Capa de Caché Distribuido (Upstash Redis)
- **REQ-CACHE-001 (Ubiquitous):** Toda clave de caché en Redis deberá seguir el formato determinista `tenant:{empresaId}:{resource}` o `tenant:{empresaId}:{resource}:{id}`.
- **REQ-CACHE-002 (Unwanted Behavior):** SI una consulta solicita recursos sin un tenant explícito o válido, EL SISTEMA DEBERÁ rechazar el uso de caché global y consultar la base de datos bajo el contexto estricto de seguridad de sesión.

#### 2.4 Capa de Frontend (Zustand Stores, Comboboxes y Poka-Yoke UI)
- **REQ-FE-001 (Event-Driven):** CUANDO el usuario invoque el cierre de sesión (`unifiedLogout`) o se detecte un cambio de empresa activa, el sistema deberá resetear y purgar completamente la memoria RAM de todos los stores de Zustand (`useBodegaStore`, `useClienteStore`, `useAlquilerStore`, `useEmpresaStore`, `useTenantStore`).
- **REQ-FE-002 (State-Driven):** MIENTRAS un operador interactúe con cualquier selector, tabla, Combobox o formulario, la interfaz reactiva únicamente presentará opciones filtradas por el `empresaId` de la empresa en sesión.
- **REQ-FE-003 (Unwanted Behavior):** SI se detecta en el estado local de un formulario un ítem o entidad asociada a un `empresaId` diferente, LA INTERFAZ DEBERÁ bloquear el avance al siguiente paso (Poka-Yoke) e informar al usuario de manera clara.

---

### 3. Criterios de Aceptación y Certificación (Definition of Done)
1. **0 Fugas de Datos Inter-Tenant**: 100% de las 21 Server Actions cuentan con filtro dual `empresa_id`.
2. **0 Claves de Caché Huérfanas**: No existen llamadas a `invalidateTenantCache` pasando `user.id`.
3. **Suite de Pruebas de Penetración Multi-Tenant**: Mínimo 6 pruebas adversariales automatizadas en Vitest simulando ataques cruzados inter-tenant (Tenant A intentando leer/modificar/abonar/activar recursos de Tenant B).
4. **Verificación Estática y TypeScript**: `tsc --noEmit` completado con 0 errores en todo el proyecto.
