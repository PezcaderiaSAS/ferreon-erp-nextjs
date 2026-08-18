# Diccionario de Estándares Técnicos y Formatos (alquileres_app)

**Aplicación / Módulo Core:** `alquileres_app`  
**Proyecto:** FerreOn ERP  
**Fecha:** 2026-08-18  

---

## 1. Funcionamiento General de `alquileres_app`

`alquileres_app` es el núcleo operativo de FerreOn ERP encargado de gestionar el ciclo de vida completo del alquiler de maquinaria y equipos de construcción. 

### Flujo Operativo del Ciclo de Vida:
```text
[1. Cotización] ──> [2. Activación / Despacho] ──> [3. Devolución Parcial/Total] ──> [4. Facturación / CC] ──> [5. Cierre]
```

1. **Cotización (`COTIZACION`):** Se seleccionan el cliente y los equipos contratados con sus tarifas diarias, cantidad y fechas estimadas. No descuenta stock disponible de la bodega.
2. **Activación / Despacho (`ACTIVO`):** El cliente firma el contrato, deja el depósito y la garantía (`garantia_tipo`, `garantia_monto`). En este momento se descuenta el stock de los equipos contratados.
3. **Devolución Parcial o Total (`alquileres_detalle`):** A medida que los equipos regresan a la bodega, se verifica el estado físico. Si hay averías o pérdidas se registra `costo_dano`. Los equipos devueltos reingresan de inmediato al stock disponible.
4. **Facturación / Cuenta de Cobro (`facturas_header`):** Se liquida el valor exacto según los días reales de uso. Se descuenta el depósito inicial. Se genera el documento PDF oficial.
5. **Cierre de Contrato (`FINALIZADO`):** Se verifica el saldo cero y se libera el estado de la garantía (`garantia_estado = 'Liberada'`).

---

## 2. Diccionario de Estándares Técnicos Obligatorios

### 2.1 Formato y Estándar de Pesos y Medidas (Cero Mezclas)
- **Base de Datos (Supabase PostgreSQL):** El peso se almacena exclusivamente en la columna `peso_gramos` usando el tipo `BIGINT` (gramos enteros sin decimales).
  - *Invariante:* `1 Kg = 1000 gramos`.
- **API y Capa de Dominio (TypeScript):** Se utiliza el Value Object `PesoGramos`. Está estrictamente prohibido usar flotantes directos para operaciones de peso.
- **Formato en Interfaz de Usuario (UI):** Se muestra en Kilos formateados con **3 decimales de precisión** usando separador decimal por punto o coma local (`24.575 Kg`).

---

### 2.2 Formato de Fechas y Agendas (`America/Bogota`)
- **Zona Horaria del Sistema:** `America/Bogota` (UTC-5).
- **Formato de Almacenamiento en DB:** `TIMESTAMPTZ` (ISO 8601 con zona horaria UTC). Ejemplo: `2026-08-18T07:00:00.000Z`.
- **Formato de Fechas de Calendario (Sin hora):** `YYYY-MM-DD` (ej. `2026-08-18`).
- **Formato Visual UI:** `DD/MM/YYYY hh:mm a` (ej. `18/08/2026 05:00 pm`).
- **Regla de Agenda y Cálculo de Días:**
  - El tiempo mínimo facturable de alquiler es de **1 día (24 horas)**.
  - La hora de corte para devolución de equipos sin recargo por día adicional son las **5:00 PM (17:00:00)** del día estipulado en la agenda.

---

### 2.3 Formato de Moneda y Decimales Financieros
- **Base de Datos (PostgreSQL):** Columna `NUMERIC(12, 2)` para todo valor monetario (`subtotal`, `total`, `deposito`, `tarifa_aplicada`, `costo_dano`, `saldo_pendiente`).
- **Moneda Oficial:** Pesos Colombianos (`COP`).
- **Formato Visual UI:** `$ 1.500.000,00` (Punto para separador de miles, Coma para los 2 decimales explícitos).
- **Regla de Redondeo:** Redondeo bancario estándar a 2 decimales (`Math.round(val * 100) / 100`).

---

### 2.4 Formato de Nomenclaturas y Código
| Elemento | Convención | Ejemplo |
|---|---|---|
| Tablas y Columnas SQL | `snake_case` | `alquileres_detalle`, `peso_gramos` |
| Entidades y Clases TS | `PascalCase` | `AlquilerEntity`, `PesoGramos` |
| Variables y Funciones | `camelCase` | `crearAlquiler`, `calcularTotales` |
| Endpoints y Rutas UI | `kebab-case` | `/api/alquileres`, `/alquileres-app` |
| Constantes Globales | `UPPER_SNAKE_CASE` | `MAX_LOCK_TIMEOUT_MS` |

---

### 2.5 Formato de Clientes, Proveedores e Identificaciones
- **Nombres y Razones Sociales:** Texto sanitizado en **MAYÚSCULAS LIMPIAS** (`UPPERCASE.trim()`), sin caracteres especiales ni espacios dobles.
- **Identificación Fiscal (NIT / Cédula):**
  - Cédula de Ciudadanía: 6 a 10 dígitos numéricos sin puntos ni espacios (ej. `1018456789`).
  - NIT de Proveedores / Clientes Empresa: Dígitos numéricos con dígito de verificación separado por guion (ej. `900123456-1`).
- **Teléfonos Móviles:** 10 dígitos prefijados con código de país opcional (ej. `3001234567` o `+57 300 123 4567`).
