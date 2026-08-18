# Documento de Requerimientos del Producto (PRD) — `alquileres_app`

**Módulo Core:** `alquileres_app`  
**Proyecto:** FerreOn ERP  
**Versión:** 1.0.0  
**Estándar:** Spec-Driven Development (RFC 2119 & Gherkin BDD)  
**Fecha:** 2026-08-18  

---

## 1. Introducción y Matriz de Actores

### 1.1 Propósito
Este documento define los Requerimientos Funcionales (RF) y No Funcionales (RNF) oficiales para la aplicación `alquileres_app`. Cada requerimiento incluye criterios de aceptación ejecutables en formato **Gherkin (Given-When-Then)** para su verificación automática mediante pruebas de integración y End-to-End (E2E).

### 1.2 Matriz de Actores y Roles de Usuario
| Rol / Actor | Identificador | Descripción de Permisos |
|---|---|---|
| Administrador | `ADMIN` | Acceso total a creación, edición, anulación, liquidación y auditoría de alquileres. |
| Operador de Bodega | `OPERADOR` | Registro de cotizaciones, despachos, devoluciones parciales/totales e inspección de daños. |
| Lector / Auditor | `LECTOR` | Consulta de contratos, inventario y estados de cartera sin permisos de mutación. |

---

## 2. Requerimientos Funcionales (RF)

### 2.1 Módulo de Gestión de Contratos y Despachos

#### RF-ALQ-001: Creación y Despacho de Contrato de Alquiler
* **Definición:** El sistema MUST permitir a los usuarios con rol `OPERADOR` o `ADMIN` registrar un nuevo alquiler asignando un cliente, depósito en efectivo, tipo/monto de garantía y lista de items del catálogo.
* **Criterios de Aceptación (Gherkin):**
```gherkin
Scenario: Creación exitosa de un contrato de alquiler activo
  Given que el usuario "operador@ferreon.com" está autenticado con rol "OPERADOR"
  And el cliente "900123456-1" está registrado y en estado "activo"
  And el item "Mezcladora de Concreto" tiene "10" unidades en stock disponible
  When envía una petición POST a "/api/alquileres" con:
    | cliente_id     | deposito | garantia_monto | garantia_tipo | cantidad | dias |
    | CLI-UUID-001   | 100000   | 500000         | Efectivo      | 2        | 5    |
  Then la respuesta del servidor MUST ser HTTP 201 Created
  And el estado del contrato MUST ser "ACTIVO"
  And el stock disponible de "Mezcladora de Concreto" MUST actualizarse a "8"
  And se MUST registrar un evento en "logs_sistema" con la acción "CREAR_ALQUILER"
```

---

#### RF-ALQ-002: Control de Stock y Prevención de Sobrereserva
* **Definición:** El sistema MUST rechazar cualquier solicitud de alquiler si la cantidad de un ítem excede el `stock_disponible` en bodega.
* **Criterios de Aceptación (Gherkin):**
```gherkin
Scenario: Intento de alquilar cantidad superior al stock disponible
  Given que el item "Demoledor Eléctrico" tiene "2" unidades disponibles
  When el usuario intenta crear un alquiler solicitando "5" unidades
  Then el sistema MUST retornar una respuesta HTTP 400 Bad Request
  And el mensaje de error MUST ser "Stock insuficiente para el item Demoledor Eléctrico. Disponible: 2, Solicitado: 5."
  And no MUST realizarse ninguna modificación en la base de datos
```

---

### 2.2 Módulo de Devoluciones y Registro de Daños

#### RF-DEV-001: Recepción de Equipos y Registro de Daños
* **Definición:** El sistema MUST registrar la devolución de ítems individualmente, incrementando el `stock_disponible` y aplicando el recargo `costo_dano` si el equipo presenta averías.
* **Criterios de Aceptación (Gherkin):**
```gherkin
Scenario: Devolución parcial de equipos con reporte de daños
  Given un contrato de alquiler "ACTIVO" con "2" unidades de "Vibrador de Concreto"
  When el operador registra la devolución de "1" unidad con un "costo_dano" de "35000.00"
  Then el estado de devolución de la línea MUST actualizarse a "DEVUELTO_PARCIAL"
  And el stock disponible de "Vibrador de Concreto" MUST incrementarse en "1" unidad
  And el renglón de detalle MUST almacenar "costo_dano = 35000.00"
```

---

### 2.3 Módulo de Facturación y Cuentas de Cobro

#### RF-FAC-001: Emisión de Cuenta de Cobro / Factura PDF
* **Definición:** El sistema MUST generar un documento PDF oficial para la cuenta de cobro. **Regla Obligatoria:** El PDF MUST incluir la totalidad de los ítems contratados originalmente, sin filtrar o descartar aquellos con estado devuelto.
* **Criterios de Aceptación (Gherkin):**
```gherkin
Scenario: Generación de PDF de cuenta de cobro con ítems devueltos
  Given un contrato de alquiler con "3" ítems contratados donde "1" ítem ya fue devuelto
  When el sistema genera la cuenta de cobro en PDF vía "/api/facturas/[id]/pdf"
  Then el archivo PDF generado MUST contener "3" renglones en la tabla de detalle
  And el PDF MUST mostrar el subtotal bruto, el descuento por depósito y el saldo pendiente
  And el binario PDF MUST guardarse en el bucket "documentos-pdf" de Supabase Storage
```

---

## 3. Requerimientos No Funcionales (RNF)

### RNF-001: Límite de Costo $0 USD en Infraestructura Serverless
* El sistema MUST ejecutarse 100% dentro de los Tiers Gratuitos de **Vercel Hobby** (Serverless Functions <= 10s execution limit) y **Supabase Free Tier** (500 MB DB PostgreSQL, 1 GB Storage, 50,000 MAU Auth).

### RNF-002: Concurrencia sin Colisiones ni Bloqueos
* El sistema MUST procesar peticiones HTTP concurrentes utilizando transacciones aisladas **ACID en PostgreSQL**, garantizando un tiempo de respuesta de API menor a `500 ms` sin timeouts de script lock.

### RNF-003: Seguridad RLS y Principio de Menor Privilegio
* Todas las tablas de la base de datos MUST tener habilitado **Row Level Security (RLS)**. Ninguna solicitud no autenticada o con rol `LECTOR` MAY ejecutar operaciones de inserción, actualización o borrado.
