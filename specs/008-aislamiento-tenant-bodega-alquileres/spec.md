# Especificación EARS: SPEC-008 Aislamiento Multi-Tenant de Catálogo y Purga Reactiva de Almacenes en Alquileres System

## 1. Metadatos
- **ID de Especificación**: SPEC-008
- **Título**: Aislamiento Estricto de Catálogo de Bodega, Purga In-Memory de Zustand Stores y Prevención Poka-Yoke de Errores Inter-Tenant en Contratos de Alquiler
- **Módulo**: Bodega / Alquileres / Autenticación Multi-Tenant
- **Autor**: @planner (Software Architect + Data Engineer)
- **Revisor**: @reviewer (UI Finish-Gate + QA Specialist)
- **Estado**: APROBADA_USUARIO

---

## 2. Contexto y Objetivos del Negocio
En entornos multi-tenant (SaaS), los usuarios pueden operar con distintas empresas en la misma terminal o cambiar de sesión. Se identificó un fallo crítico en producción donde un usuario de FERREON intentó formalizar un alquiler con un equipo perteneciente a otra empresa (Ferretería Josase, ID 106), disparando la excepción `ERR_ITEM_NOT_FOUND (P0002)` en la RPC de PostgreSQL y bloqueando el guardado de nuevos registros.

El objetivo de esta especificación es:
1. Blindar el Combobox y Store de Bodega para que filtre de forma reactiva e infalible solo los equipos del tenant activo.
2. Purgar exhaustivamente todos los almacenes de Zustand en memoria (`bodegaStore`, `clienteStore`, `alquilerStore`, `tenantStore`, `empresaStore`) durante el cierre de sesión (`unifiedLogout`) y ante discrepancias de tenant.
3. Incorporar validación defensiva Poka-Yoke en el formulario y Server Action de Alquileres antes de invocar la RPC, garantizando mensajes claros sin fallos 500 no controlados.

---

## 3. Requisitos Funcionales en Sintaxis Formal EARS

### 3.1. Requisitos Ubicuos (Ubiquitous - Comportamiento Fundamental)
- **RF-01**: El sistema DEBERÁ etiquetar cada entidad `EquipoUI` con su correspondiente `empresaId` proveniente de la base de datos Supabase.
- **RF-02**: El sistema DEBERÁ invalidar las claves de caché de Redis utilizando exclusivamente el `empresaId` canónico y no el `userId` en las acciones de Bodega y Equipos.

### 3.2. Requisitos Guiados por Eventos (Event-driven - Disparadores)
- **RF-03**: CUANDO [se ejecute la función `unifiedLogout`], el sistema DEBERÁ vaciar de forma inmediata tanto las claves en `localStorage` como el estado en memoria de `useBodegaStore`, `useClienteStore`, `useAlquilerStore`, `useTenantStore` y `useEmpresaStore`.
- **RF-04**: CUANDO [se monte el formulario `AlquilerForm` o se invoque `fetchCatalogsBackground`], el sistema DEBERÁ reemplazar en su totalidad la colección de equipos en `useBodegaStore` con los datos autenticados del tenant activo.

### 3.3. Requisitos Basados en Estados (State-driven - Comportamiento Continuo)
- **RF-05**: MIENTRAS [el usuario interactúe con el `EquipoCombobox` en cualquier paso del formulario de alquiler], el componente DEBERÁ listar únicamente los equipos activos cuyo `empresaId` coincida con la empresa activa de la sesión.

### 3.4. Requisitos de Comportamiento No Deseado (Unwanted Behavior - Errores y Excepciones)
- **RF-06**: SI [un ítem seleccionado en el formulario de alquiler no existe en el catálogo activo de la empresa o pertenece a otro tenant], ENTONCES el sistema DEBERÁ detener el avance al resumen o formalización, mostrando un mensaje informativo: *"El equipo seleccionado no pertenece al catálogo de su empresa o no está disponible"*, impidiendo invocar la RPC transaccional con datos inválidos.
- **RF-07**: SI [la RPC de base de datos retorna el error `ERR_ITEM_NOT_FOUND (P0002)`], ENTONCES la Server Action `crearAlquilerSegmentadoAction` DEBERÁ interceptar el fallo y retornar un error estructurado legible: *"Uno o más equipos seleccionados no existen en el inventario de su empresa"*.

---

## 4. Requisitos No Funcionales (RNF)
- **RNF-01 (Seguridad)**: Aislamiento lógico multi-tenant con política de Zero Data Leakage entre organizaciones.
- **RNF-02 (Rendimiento)**: Filtrado reactivo en memoria con latencia menor a 5ms en la apertura del Combobox.
- **RNF-03 (Calidad & Estabilidad)**: Cobertura total de pruebas en `alquiler-registro-fallo.test.tsx` y 0 errores en TypeScript (`tsc --noEmit`).
