# Especificación de Reglas de Negocio (BRD) — `alquileres_app`

**Módulo Core:** `alquileres_app`  
**Proyecto:** FerreOn ERP  
**Versión:** 1.0.0  
**Estándar:** Spec-Driven Development (RFC 2119)  
**Fecha:** 2026-08-18  

---

## 1. Reglas Financieras y de Cálculo Tarifario

### RN-FIN-001: Formato Monetario y Decimales
* Los montos monetarios MUST ser representados en Pesos Colombianos (`COP`).
* En base de datos PostgreSQL, los campos de moneda MUST usar la especificación `NUMERIC(12, 2)`.
* La fórmula de cálculo del valor total de un renglón es:
  $$\text{subtotal\_linea} = \text{cantidad} \times \text{tarifa\_aplicada} \times \text{días\_efectivos}$$
* Todo redondeo MUST aplicar la regla de redondeo bancario estándar a 2 decimales (`Math.round(valor * 100) / 100`).

---

### RN-FIN-002: Manejo de Depósitos e Imputación de Saldos
* El depósito abonado (`deposito`) es un dinero recibido en custodia como anticipo de pago.
* La fórmula para calcular el saldo pendiente en la cuenta de cobro es:
  $$\text{saldo\_pendiente} = \max(0, (\text{subtotal\_alquiler} + \text{costo\_dano\_total}) - \text{deposito})$$
* Si el depósito supera el costo total del alquiler, el saldo pendiente es `$ 0,00` y la diferencia se registra como saldo a favor del cliente.

---

## 2. Reglas de Pesos y Unidades de Medida (Estándar Invariable)

### RN-DAT-001: Almacenamiento Estricto de Pesos en Gramos
* Para evitar distorsiones aritméticas de coma flotante, la masa de los equipos MUST almacenarse en la columna `peso_gramos` como un entero de 64 bits (`BIGINT`).
* **Factor de Conversión:**
  $$\text{peso\_gramos} = \text{Math.round}(\text{peso\_kilos} \times 1000)$$
  $$\text{peso\_kilos} = \frac{\text{peso\_gramos}}{1000.0}$$
* Queda estrictamente PROHIBIDO almacenar pesos en flotante o mezclar unidades en diferentes tablas.

---

## 3. Reglas de Agenda, Tiempos y Cobro de Días

### RN-AGD-001: Tiempo Mínimo de Alquiler y Cálculo de Días
* El tiempo mínimo facturable de un contrato es de **1 día (24 horas)**.
* Si el equipo se devuelve el mismo día del despacho, el número de días facturados MUST ser `1`.

### RN-AGD-002: Hora de Corte para Devolución sin Recargo
* La hora de corte estándar para la recepción de equipos devueltos son las **5:00 PM (17:00:00)** hora de Colombia (`America/Bogota`).
* Si un equipo es devuelto posterior a las **5:00 PM**, el sistema MUST registrar `1` día adicional de alquiler en el cálculo automático.

---

## 4. Reglas de Garantías e Inventario de Bodega

### RN-GAR-001: Custodia y Liberación de Garantías
* Todo contrato en estado `ACTIVO` MUST poseer una garantía registrada con su tipo (`garantia_tipo`: Efectivo, Pagaré, Voucher, etc.) y monto (`garantia_monto`).
* La garantía MUST mantenerse en estado `Garantia_Estado = 'Activa'` durante la vigencia del contrato.
* La garantía solo MAY ser marcada como `Garantia_Estado = 'Liberada'` cuando el contrato pase a estado `FINALIZADO` y el `saldo_pendiente` sea igual a `$ 0,00`.

### RN-INV-001: Invariante de Stock de Equipos
* En todo momento se MUST cumplir la siguiente restricción de inventario:
  $$0 \le \text{stock\_disponible} \le \text{stock\_total}$$
* Si un equipo es enviado a mantenimiento o baja por daño total, el `stock_total` MUST decrementarse mediante una transacción de auditoría.
