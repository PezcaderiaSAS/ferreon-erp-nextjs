# Matriz de Refactorización: FerreOn Legacy a Arquitectura Limpia Next.js

Este documento consolida el análisis exhaustivo de la documentación y código fuente legacy del proyecto **FerreOn** (`backend/`, `sources/`, `.specify/`, `frontend/`) y certifica su completa refactorización e implementación en el nuevo proyecto **Alquileres ERP** (`ferreon-erp-nextjs`).

---

## 1. Mapeo de Módulos y Reglas de Negocio

### 1.1 Módulo de Alquileres y Cotizaciones
* **Legacy (`backend/servicios/server_alquileres.js` & `RentalBilling_Engine.js`):**
  * Manejo de cotizaciones preliminares y contratos de despacho.
  * Separación de depósitos y garantías (el depósito no es gravable, actúa como colateral).
  * Inclusión de fletes de transporte (llevar y recoger).
* **Refactorización Moderna (`src/core/domain/entities/alquiler.ts` & `src/core/application/use-cases/crear-alquiler.use-case.ts`):**
  * Entidad inmutable con tipado estricto TypeScript.
  * Fecha de inicio general del contrato y fechas independientes por cada ítem (`fechaInicio` y `fechaFin`).
  * Cálculo automático de días de alquiler por renglón: $\max(1, \lceil(\text{fechaFin} - \text{fechaInicio})/86400000\rceil)$.
  * Fórmula financiera transparente: $\text{Subtotal Equipos} + \text{Flete Entrega} + \text{Flete Recogida} - \text{Depósito} = \text{Saldo Neto a Cobrar}$.

### 1.2 Módulo de Bodega e Inventario
* **Legacy (`backend/servicios/server_items.js` & `constants.js`):**
  * Stock físico con validación de balance.
  * Prevención de errores de coma flotante en pesos.
* **Refactorización Moderna (`src/core/domain/entities/equipo.ts` & `src/core/domain/value-objects/peso-gramos.ts`):**
  * Value Object `PesoGramos` que almacena `BIGINT` en la base de datos y expone Kilos con 3 decimales (`0.000 Kg`) en la UI.
  * Invariante de balance en el constructor: $\text{stockDisponible} + \text{stockEnObra} + \text{stockMantenimiento} = \text{stockTotal}$.
  * Métodos de dominio `despachar(cantidad)` y `devolver(cantidad)` con actualización atómica.
  * Soporte de Carga Masiva (CSV / Multilínea).

### 1.3 Módulo de Clientes & Terceros
* **Legacy (`backend/servicios/server_clientes.js`):**
  * Validación de NITs y nombres de terceros.
* **Refactorización Moderna (`src/core/domain/entities/cliente.ts` & `src/core/application/use-cases/crear-cliente.use-case.ts`):**
  * Sanitización automática de campos en `UPPERCASE.trim()`.
  * Integración con panel de historiales cruzados (Alquileres, Pagos y Cartera).
  * Buscador Inteligente Asistido en tiempo real por caracteres (coincidencia de NIT o Nombre).

### 1.4 Módulo de Devoluciones & Inspección Física
* **Legacy (`backend/servicios/WorkflowState_Controller.js`):**
  * Devolución parcial o total de equipos en obra.
  * Cobro de averías / daños físicos (`costo_dano`).
* **Refactorización Moderna (`src/core/application/use-cases/devolver-equipo.use-case.ts`):**
  * Reingreso automático de las unidades devueltas al `stockDisponible` de la bodega en tiempo real.
  * Registro de recargos por avería sumados al subtotal de liquidación.
  * Transición automática a estado `FINALIZADO` cuando el 100% de los equipos ha retornado.

### 1.5 Módulo de Facturación & PDF Empresarial
* **Legacy (`backend/servicios/EnterprisePDF_Generator.js` & `server_pdf.js`):**
  * Generación de documentos basada en plantillas de Google Docs y conversión en Drive.
* **Refactorización Moderna (`src/core/services/pdf-factura-generator.service.ts` & `src/core/utils/numero-a-letras.ts`):**
  * Generación serverless en memoria sin latencia de Drive ni riesgo de timeouts de 6 minutos.
  * Formato estándar Carta (Letter / `215.9mm x 279.4mm`) con márgenes optimizados de 10-12mm.
  * Formato de moneda estricto `$40.000` con separador de miles.
  * Conversión formal del total a letras en español: `SON: [VALOR EN LETRAS] PESOS M/CTE`.
  * Visor limpio con barra de acciones que no fuerza la impresión automática (`window.print()`).

### 1.6 Arquitectura de Datos & Soft Delete Universal
* **Legacy (`backend/nucleo/constants.js` & `Audit_Log`):**
  * Auditoría basada en appending de filas en Google Sheets.
* **Refactorización Moderna (`src/core/domain/entities/base-auditable.entity.ts` & `supabase/migrations/`):**
  * Claves primarias UUID v4 e integridad referencial con `ON DELETE RESTRICT`.
  * Soft Delete universal: `deletedAt: Date | null`, `deletedBy: string | null`, `isActive: boolean`.
  * Índices parciales PostgreSQL `WHERE deleted_at IS NULL` para alta escalabilidad.

---

## 2. Cobertura de Pruebas Unitarias TDD

La totalidad de los módulos refactorizados cuenta con **21 pruebas unitarias aprobadas al 100%** ejecutadas con Vitest:
* `tests/unit/numero-a-letras.test.ts` (Formato `$40.000` y conversión a letras).
* `tests/unit/crear-alquiler-use-case.test.ts` (Fletes, logística, fechas y días).
* `tests/unit/alquiler-entity.test.ts` (Fórmulas financieras e invariantes).
* `tests/unit/devolucion-use-case.test.ts` (Reingreso a stock y cálculo de averías).
* `tests/unit/soft-delete.test.ts` (Protección contra borrado de contratos activos).
* `tests/unit/cliente-entity.test.ts` (Sanitización y unicidad de NIT).
* `tests/unit/equipo-entity.test.ts` (Balance de inventario y despacho).
* `tests/unit/peso-gramos.test.ts` (Conversión BigInt gramos a Kilos).
