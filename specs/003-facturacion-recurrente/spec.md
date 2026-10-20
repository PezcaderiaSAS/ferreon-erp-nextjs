# Especificación EARS: SPEC-003 Módulo de Facturación Recurrente y Cuentas de Cobro Periódicas

## 1. Metadatos de la Especificación
- **ID de Especificación**: SPEC-003
- **Título**: Módulo de Facturación Recurrente, Cortes de Obra y Cuentas de Cobro Periódicas Pro-Rata
- **Módulo**: Financiero / Facturación, Cartera & Cuentas de Cobro (`Alquileres System`)
- **Autor / Rol**: `@planner` (Software Architect + Data Engineer inyectado desde Agency Agents)
- **Revisor / QA**: `@reviewer` (UI Finish-Gate Reviewer + QA Specialist)
- **Estado**: AUDITADA_FASE_1_PROPUESTA (Pendiente de Aprobación de Quality Gate Fase 2)
- **Fecha de Creación**: 2026-10-03
- **Versión de Especificación**: 1.0.0

---

## 2. Contexto del Negocio y Diagnóstico de la Operación

En los contratos de alquiler de maquinaria para obras civiles y construcción (que típicamente duran entre 15 días, 3 meses o más de 1 año):
1. **Punto de Dolor Actual**:
   - El sistema actual mapea el contrato de alquiler como una única factura global con el total pactado inicialmente.
   - En la práctica operativa de obra en Colombia, las constructoras exigen **Cortes Periódicos Quincenales o Mensuales** (o Cuentas de Cobro por periodo de permanencia) para autorizar pagos parciales según el avance de obra y los días efectivamente utilizados.
   - Si no se cuenta con un corte recurrente pro-rata, el cobro de contratos de larga duración se retrasa hasta el fin del contrato, asfixiando el flujo de caja del negocio de alquileres.
2. **Oportunidad y Valor de Negocio**:
   - Automatizar el cálculo de **Días Facturables Pro-Rata** dentro de una ventana de corte (`[fecha_corte_inicio, fecha_corte_fin]`).
   - Permitir emitir tanto **Cuentas de Cobro Oficiales** (para régimen simple / personas naturales) como **Facturas Comerciales con IVA 19% y Retenciones** con numeración consecutiva correlativa (`CC-XXXX` / `FAC-REC-XXXX`).
   - Generación de PDF oficial corporativo con desglose de días en obra, envío directo por WhatsApp y registro del devengo contable en el Ledger y en el saldo de Cartera CXC.

---

## 3. Requisitos Funcionales en Sintaxis Formal EARS

### 3.1. Requisitos Ubicuos (Ubiquitous - Comportamiento Fundamental)
- **EARS-UBI-01**: El sistema DEBERÁ permitir definir periodos de corte periódico (`QUINCENAL`, `MENSUAL`, o `PERSONALIZADO`) para contratos en estado `ACTIVO` o `ACTIVO_EN_OBRA`.
- **EARS-UBI-02**: El sistema DEBERÁ calcular los días facturables del periodo mediante intersección cronológica estricta: $\text{Días Facturables} = \max(0, \min(\text{finCorte}, \text{finContrato}) - \max(\text{inicioCorte}, \text{inicioContrato}) + 1)$.
- **EARS-UBI-03**: El sistema DEBERÁ calcular todos los importes monetarios (subtotales de días, tarifas de equipos, IVA 19%, retenciones y saldos) bajo formato Integer Math (enteros de COP sin errores de punto flotante).
- **EARS-UBI-04**: El sistema DEBERÁ representar las cifras de dinero, días facturables y contadores de cuentas de cobro con tipografía tabular `font-mono tabular-nums`.

### 3.2. Requisitos Guiados por Eventos (Event-driven - Disparadores)
- **EARS-EVE-01**: CUANDO el usuario presione 'Generar Corte Periódico', el sistema DEBERÁ previsualizar en tiempo real todos los contratos activos con maquinaria en obra que tengan días pendientes por facturar en la ventana seleccionada.
- **EARS-EVE-02**: CUANDO el usuario confirme la emisión de una Cuenta de Cobro o Factura Recurrente, el sistema DEBERÁ persistir el registro con consecutivo correlativo único, asociarlo al contrato de alquiler y actualizar el saldo acumulado de cartera.
- **EARS-EVE-03**: CUANDO el usuario presione 'Compartir Cuenta de Cobro por WhatsApp', el sistema DEBERÁ generar un mensaje con el periodo facturado, días en obra, valor a transferir y enlace al PDF oficial.
- **EARS-EVE-04**: CUANDO se registre un abono o pago a una Cuenta de Cobro periódica, el sistema DEBERÁ registrar el ingreso en Caja (POS) y reflejar la reducción del saldo en el módulo de facturación.

### 3.3. Requisitos Basados en Estados (State-driven - Comportamiento Continuo)
- **EARS-STA-01**: MIENTRAS un contrato de alquiler se encuentre en estado `ACTIVO` o `ACTIVO_EN_OBRA`, el sistema DEBERÁ mantener visible el acumulado de días ya facturados y los días devengados pendientes por cortar.
- **EARS-STA-02**: MIENTRAS una Cuenta de Cobro periódica figure con saldo pendiente mayor a cero, el sistema DEBERÁ clasificar su estado como `Pendiente` (o `Vencida` si sobrepasó la fecha de pago pactada).
- **EARS-STA-03**: MIENTRAS se procese la generación masiva de cortes periódicos, el sistema DEBERÁ mostrar una barra de progreso accesible y deshabilitar reintentos concurrentes para prevenir duplicación de cobros.

### 3.4. Requisitos de Comportamiento No Deseado (Unwanted Behavior - Casos Borde)
- **EARS-UNW-01**: SI el rango de fechas seleccionado no tiene intersección con el periodo de vigencia del contrato de alquiler en obra, ENTONCES el sistema NO DEBERÁ generar cuentas de cobro vacías con cero días.
- **EARS-UNW-02**: SI un contrato ya fue liquidado en un periodo anterior (días ya facturados en otra cuenta de cobro previa), ENTONCES el sistema DEBERÁ excluir dichos días para evitar sobrecobros o cobros dobles al cliente.
- **EARS-UNW-03**: SI la fecha final de corte es anterior a la fecha inicial, ENTONCES el sistema DEBERÁ abortar la operación con un mensaje de validación accesible en el selector de fechas.

### 3.5. Requisitos Opcionales y Adaptativos (Optional Features)
- **EARS-OPT-01**: DONDE el usuario visualice la plataforma desde un dispositivo móvil (<768px), el sistema DEBERÁ renderizar el resumen del corte en tarjetas apiladas interactivas con botones rápidos de PDF y WhatsApp.
- **EARS-OPT-02**: DONDE el cliente requiera factura electrónica en lugar de cuenta de cobro simple, el sistema DEBERÁ permitir alternar el tipo de documento con desglose discriminado de IVA 19% y retenciones tributarias.

---

## 4. Requisitos No Funcionales (RNF) y Criterios de Aceptación (QA)
- **RNF-01 (Seguridad y Multitenant)**: Toda la consulta y emisión de cortes periódicos debe aplicar RLS por `empresa_id` (`tenant_id`).
- **RNF-02 (Cero Regresiones)**: Mantener el 100% de las 428 pruebas de Vitest aprobadas y añadir la nueva suite de pruebas unitarias para el motor de cortes pro-rata.
- **RNF-03 (Performance)**: El cálculo del corte periódico para hasta 100 contratos simultáneos debe resolverse en < 50ms (complejidad $O(N)$).
- **RNF-04 (Gobernanza de Marca)**: Respetar rigurosamente el nombre **"Alquileres System"** en todos los encabezados y documentos generados.
