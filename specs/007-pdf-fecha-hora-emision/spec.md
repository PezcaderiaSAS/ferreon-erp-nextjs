# Requerimiento Formal EARS: Evidencia de Fecha y Hora en Documentos PDF (Alquileres System)

## Metadatos
- **ID de Especificación**: SPEC-007
- **Nombre**: Incorporación de Fecha y Hora de Emisión en Documentos PDF
- **Proyecto**: Alquileres System
- **Módulo**: Núcleo de Documentación Oficial / Enterprise PDF (`EnterprisePDFService`)
- **Estado**: En Planificación / Implementación
- **Autor**: Planner & Arquitecto Multi-Agente SDD

---

## 1. Contexto y Justificación de Negocio
Al generar el documento oficial en PDF (Cuenta de Cobro, Cotización Comercial de Obra, Contrato de Alquiler o Factura), el cliente y el operador requieren una constancia jurídica y operativa fehaciente que demuestre la fecha y la hora exacta en la que se realizó o formalizó el documento.
Anteriormente, el badge superior derecho (`doc-badge`) mostraba exclusivamente `Fecha: DD/MM/YYYY`, omitiendo la estampa temporal (hora, minutos y período AM/PM) y limitando la trazabilidad de auditoría para entregas y cierres contables.

---

## 2. Requisitos EARS (Easy Approach to Requirements Syntax)

### 2.1. Requisitos Ubicuos (Ubiquitous Requirements)
- **UBQ-1**: El sistema `Alquileres System` DEBE mostrar tanto la fecha en formato colombiano (`DD/MM/YYYY`) como la hora en formato 12 horas con indicador de período (`hh:mm AM/PM`) en el badge de identificación del documento PDF.
- **UBQ-2**: El sistema DEBE preservar la zona horaria operativa de Colombia (`America/Bogota`, UTC-5) para evitar desfases horarios o falsas horas de medianoche por interpretaciones UTC estándar.
- **UBQ-3**: El sistema DEBE mantener la integridad estética y de layout en los tamaños de papel CARTA (Letter) y MEDIA CARTA (A5), sin generar saltos de línea antiestéticos ni desbordamientos horizontales.

### 2.2. Requisitos Conducidos por Eventos (Event-Driven Requirements)
- **EVT-1**: CUANDO el operador genera o imprime un PDF de contrato, cotización o cuenta de cobro desde `AlquileresInteractiveIsland`, `useAlquilerForm` o `VisorDocumentoPDFModal`, EL SISTEMA DEBE calcular y estampar la fecha y hora exacta en el encabezado (`doc-badge`) y en la leyenda de cierre del pie de página (`footer`).
- **EVT-2**: CUANDO el documento posea una marca de tiempo de creación persistida (`created_at`), EL SISTEMA DEBE utilizar dicha estampa temporal para reflejar fielmente la hora en que se formalizó la transacción.

### 2.3. Requisitos Conducidos por Estado (State-Driven Requirements)
- **STD-1**: MIENTRAS se renderiza el documento en tamaño MEDIA CARTA (A5), EL SISTEMA DEBE ajustar el tamaño de fuente y espaciado de la fecha y hora a escala proporcional (`6.8pt` - `7.5pt`) garantizando su legibilidad sin solapamientos.

### 2.4. Comportamientos No Deseados (Unwanted Behavior Requirements)
- **UNW-1**: SI la cadena de fecha suministrada carece de componente de hora (ej. string simple `YYYY-MM-DD`), EL SISTEMA NO DEBE renderizar `12:00 AM` ni `19:00 PM` (por desfase UTC-5); EN SU LUGAR, DEBE recurrir a la hora de creación real o a la hora actual de emisión del documento.
- **UNW-2**: SI el valor de fecha es nulo, indefinido o inválido, EL SISTEMA NO DEBE fallar con excepciones de JavaScript; EN SU LUGAR, DEBE utilizar la fecha y hora actual local.

### 2.5. Requisitos Opcionales (Optional Features)
- **OPT-1**: DONDE esté disponible, el ticket de alquiler térmico y el comprobante de arqueo también podrán beneficiarse de la utilidad estandarizada `formatearHoraLocal`.
