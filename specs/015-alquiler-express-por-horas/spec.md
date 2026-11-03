# Especificación del Sistema (EARS): SPEC-015
## Módulo de Alquiler Express por Horas en Mostrador POS con Límite Configurable de Equipos (Diseño Ultra-Simple para Niño de 12 Años)

---

### 1. Contexto y Objetivos del Negocio
- **Sistema Canónico**: **Alquileres System**.
- **Propósito**: Permitir el despacho express de maquinaria y herramientas en el Mostrador POS fraccionado por horas (ej: 1h, 2h, 4h, 8h) para clientes que realizan trabajos rápidos de plomería, demolición puntual o jardinería, limitando la cantidad a un máximo de equipos simultáneos (configurable globalmente en el módulo de Configuración, valor predeterminado: 5 equipos).
- **Filosofía de Diseño Suprema (Innegociable)**:
  Toda la interfaz y el flujo operacional deben estar diseñados con tal claridad visual, ergonomía y principios Poka-Yoke que **un niño de 12 años pueda utilizar el sistema completo de forma rápida, intuitiva y sin posibilidad de cometer errores**.

---

### 2. Reglas de Negocio y Fórmulas Matemáticas

1. **Fórmula de Tarifa por Hora (Recargo Express 20%)**:
   $$\text{tarifa\_hora} = \text{Math.round}\left(\left(\frac{\text{tarifa\_dia}}{8}\right) \times 1.20\right)$$
   *Ejemplo*: Si la tarifa diaria de un taladro percutor es \$80.000 COP:
   - Tarifa base por hora: \$10.000 COP
   - Recargo express (+20%): \$2.000 COP
   - **Tarifa final por hora**: **\$12.000 COP**

2. **Registro Automático de Tiempos**:
   - **Hora de Entrega**: Se captura automáticamente del reloj del sistema en el instante del despacho (ej: `08:30 AM`).
   - **Hora de Devolución Estimada**: Se proyecta automáticamente sumando la cantidad de horas pactadas a la hora de entrega (ej: `08:30 AM + 4h = 12:30 PM`).

3. **Límite Configurable de Equipos**:
   - Administrado en `/configuracion` bajo la propiedad `maxEquiposAlquilerHoras` (por defecto: `5`).
   - Al alcanzar dicho tope en el carrito del mostrador POS en modo horas, el sistema desactiva el botón de agregar con feedback visual amigable: *"Tope de equipos alcanzado para alquiler por horas (máx. 5)"*.

4. **Detección Automática de Horas Extras en Devolución**:
   - Si la hora real de recepción supera la hora pactada, el sistema liquida automáticamente las horas extras transcurridas y sugiere el cobro adicional amigable sin fricción.

---

### 3. Requisitos del Sistema (EARS Syntax)

#### Requisitos Ubicuos (Ubiquitous - Operación Estándar)
- **[U01]**: El sistema DEBE proveer un interruptor visual gigante en el Mostrador POS para alternar entre modalidad `POR DÍAS` y `POR HORAS`.
- **[U02]**: El sistema DEBE calcular la tarifa horaria redondeada a enteros COP aplicando la fórmula canónica de 8 horas + 20% de recargo express.
- **[U03]**: El sistema DEBE guardar en `EmpresaConfig` el parámetro `maxEquiposAlquilerHoras` y permitir su edición directa desde el módulo de `/configuracion`.

#### Requisitos Basados en Eventos (Event-driven)
- **[E01]**: CUANDO el operador active la modalidad `POR HORAS`, el sistema DEBE registrar la hora actual como hora de entrega y proyectar la hora de devolución con base en las horas seleccionadas.
- **[E02]**: CUANDO el operador pulse los botones rápidos de horas (`1h`, `2h`, `4h`, `6h`, `8h`), el sistema DEBE actualizar instantáneamente la hora fin estimada y recalcular los subtotales en 0 ms.
- **[E03]**: CUANDO el número total de unidades en el carrito alcance el límite configurado (`maxEquiposAlquilerHoras`), el sistema DEBE deshabilitar el botón de añadir más equipos con un mensaje claro e instructivo.

#### Requisitos de Manejo de Errores y Poka-Yoke (Unwanted Behaviour)
- **[W01]**: SI el operador intenta ingresar 0 horas o un valor negativo, el sistema DEBE autocorregir el valor a un mínimo de 1 hora de alquiler.
- **[W02]**: SI la hora de devolución calculada sobrepasa el horario laboral de cierre (ej: 06:00 PM), el sistema DEBE mostrar una alerta visual amistosa recomendando pasar a modalidad de día completo.

#### Requisitos de Estado (State-driven)
- **[S01]**: MIENTRAS el contrato se emita en modalidad `POR HORAS`, el PDF del contrato y el ticket de despacho DEBEN imprimir de manera destacada: `ALQUILER EXPRESS POR HORAS`, la hora exacta de salida y la hora límite de retorno.
- **[S02]**: MIENTRAS la pantalla se visualice en móvil (375 px), los botones de incremento de horas DEBEN tener un tamaño táctil mínimo de 48x48 px con tipografía grande y colores de contraste alto.
