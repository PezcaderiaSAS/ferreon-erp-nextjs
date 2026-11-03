# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **SPEC-015 Completada (Módulo de Alquiler Express por Horas en Mostrador POS & Control de Equipos)**:
  - Servicio puro `AlquilerHorasService` con fórmula `((tarifaDia / 8) * 1.20)` redondeado a entero COP, proyección de horas, formato 12h/24h, alerta de horario de cierre (>18:00) y retrasos.
  - Configuración multitenant `EmpresaConfig` con flags `alquilerHorasHabilitado`, `maxEquiposAlquilerHoras` (default 5) y `recargoHorasPorcentaje` (default 20%).
  - Interfaz POS ultra-simple táctil con switch segmentado `[📅 Por Días]` vs `[⏱️ Por Horas (Express)]`, botones rápidos (`1h`, `2h`, `4h`, `8h`), stepper y Poka-Yoke visual que bloquea adición al llegar al tope de equipos.
  - Documentos adaptados: `TicketAlquilerModal.tsx` y `ContratoAlquilerPDF.tsx` con badges express, hora de despacho, hora pactada y tarifas horarias.
  - 21 pruebas en `alquiler-horas.service.test.ts`, 3 en `ticket-pdf-horas.test.ts`, `tsc --noEmit` en código 0 y 98 suites verdes.
- **SPEC-016 Previamente Completada**: Firmas profesionales simétricas sin widget flotante invasivo.

## Decisiones (y por qué)
- **Fórmula Base 8h con Recargo Express (+20%)**: Compensa el desgaste logístico y rotación rápida en mostrador para clientes que necesitan herramientas de forma inmediata por horas.
- **Poka-Yoke Visual de Tope de Equipos**: Previene vaciado involuntario de inventario en mostrador bloqueando el botón de añadir si `totalUnidades >= maxEquiposAlquilerHoras`.
- **Proyección Reactiva en 0 ms y Fallback en Observaciones**: Mantiene compatibilidad histórica con la tabla `alquileres` almacenando la metadata de horas en `observaciones` y en los contratos sin requerir migraciones destructivas de BD.

## Aprendizajes y errores a evitar
- Siempre validar la suma total de unidades en el carrito (`item.cantidad`) y no solo la longitud del array de ítems al aplicar el límite de equipos.
- En `@react-pdf/renderer` y vistas de impresión, alternar dinámicamente las cabeceras de columnas (`Días/Tarifa Día` vs `Horas/Tarifa H`) según `esModoHoras` para evitar ambigüedades contractuales.

## Próximos pasos
1. Proceder con la **Tarea B4**: Notificaciones automáticas de cobranza por WhatsApp/Email al cliente.
2. Integrar recordatorios automáticos de entrega express vía webhook/WhatsApp antes de que expire la hora de entrega pactada.
