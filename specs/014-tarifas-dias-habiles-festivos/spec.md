# Especificación del Sistema (EARS): SPEC-014
## Motor de Tarifas Dinámicas por Días Hábiles vs Calendario con Exclusión de Domingos y Festivos de Colombia

---

### 1. Contexto y Objetivos del Negocio
- **Sistema Canónico**: **Alquileres System**.
- **Propósito**: Automatizar el cálculo de días cobrables y subtotales en los contratos de alquiler de maquinaria pesada, herramientas y andamios, permitiendo al operador o comercial seleccionar la modalidad de cobro pactada con el cliente (`CALENDARIO`, `HABILES_LUNES_VIERNES` o `HABILES_LUNES_SABADO`).
- **Marco Regulatorio y Estándar de la Industria**:
  - En Colombia, la Ley 51 de 1983 (Ley Emiliani) regula el traslado de días festivos al lunes siguiente.
  - La industria de construcción civil típicamente alquila bajo modalidad lunes a sábado (jornada laboral en obra), mientras que clientes corporativos e industriales alquilan frecuentemente de lunes a viernes o días calendario corridos.
  - El sistema debe evitar disputas de cobro mostrando un desglose transparente de días cobrables y días festivos/no laborables excluidos tanto en el mostrador POS como en el contrato PDF.

---

### 2. Requisitos del Sistema (EARS Syntax)

#### Requisitos Ubicuos (Ubiquitous - Operación Estándar)
- **[U01]**: El sistema DEBE proveer un servicio de dominio puro `CalendarioLaboralService` que calcule con precisión matemática los 18 días festivos de Colombia para cualquier año (festivos fijos, Ley Emiliani y festivos basados en la Pascua según el Computus gregoriano).
- **[U02]**: El sistema DEBE admitir tres modos canónicos de cobro de tiempo:
  1. `CALENDARIO`: Cobra el 100% de los días transcurridos entre fecha inicio y fecha fin.
  2. `HABILES_LUNES_VIERNES`: Cobra únicamente días de lunes a viernes, excluyendo sábados, domingos y festivos nacionales.
  3. `HABILES_LUNES_SABADO`: Cobra de lunes a sábado, excluyendo domingos y festivos nacionales (estándar obras civiles).
- **[U03]**: El sistema DEBE recalcular dinámicamente los días cobrables, el subtotal y el total al cambiar las fechas o el modo de cobro en el formulario de alquiler y en el mostrador POS (`MostradorPosModal`).
- **[U04]**: El contrato en PDF generado (`ContratoAlquilerPDF` y `EnterprisePDFService`) DEBE indicar explícitamente el modo de cobro pactado y el desglose de días cobrables.

#### Requisitos Basados en Eventos (Event-driven)
- **[E01]**: CUANDO el operador seleccione un modo de cobro en la UI, el sistema DEBE actualizar de inmediato la cantidad de días cobrables e indicar en un badge cuántos días festivos o no laborales fueron descontados del período.
- **[E02]**: CUANDO el operador pulse sobre el desglose de días, el sistema DEBE mostrar un popover o tooltip informativo detallando fecha por fecha cuáles días son cobrables y cuáles fueron excluidos con su motivo (ej: "2026-05-01: Día del Trabajo (Festivo)").
- **[E03]**: CUANDO se guarde un alquiler desde el Mostrador POS o el formulario de edición, el sistema DEBE persistir el campo `modo_cobro_dias` y los `dias_cobrables` en la base de datos de manera consistente.

#### Requisitos de Manejo de Errores y Poka-Yoke (Unwanted Behaviour)
- **[W01]**: SI la fecha final de alquiler es anterior a la fecha de inicio, el sistema DEBE rechazar el cálculo y marcar error de validación tipado ("La fecha final debe ser posterior o igual a la fecha de inicio").
- **[W02]**: SI un período de alquiler en modalidad de días hábiles solo contiene fines de semana y festivos (resultando en 0 días cobrables), el sistema DEBE alertar al operador y requerir al menos 1 día facturable antes de permitir la emisión del contrato.

#### Requisitos de Estado (State-driven)
- **[S01]**: MIENTRAS un contrato de alquiler no tenga especificado `modo_cobro_dias` (registros heredados o importados), el sistema DEBE asumir por defecto `CALENDARIO` garantizando retrocompatibilidad al 100%.
- **[S02]**: MIENTRAS la aplicación se ejecute en dispositivos móviles (375 px), el selector de modo de cobro y el resumen de días hábiles DEBEN presentarse en tarjetas verticales compactas con botones de pulsación mínima de 44x44 px sin desbordamiento horizontal.
