# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **SPEC-014 Completada y Desplegada en Producción (Vercel & Supabase Live)**:
  - Commit `8fa83af9` desplegado en Vercel (`https://alquileres-erp-nextjs-ruby.vercel.app`) en estado `READY`.
  - Dominio puro `CalendarioLaboralService`: Computus (Pascua) y traslados Ley Emiliani (18 festivos de Colombia/año). 16/16 pruebas pasando.
  - POS Mostrador interactivo: Selector segmentado (`CALENDARIO`, `HABILES_LUNES_VIERNES`, `HABILES_LUNES_SABADO`), cálculo dinámico de días/subtotales y modal de auditoría día por día.
  - Integración en Contrato PDF y Factura (`EnterprisePDFService` & `ContratoAlquilerPDF`): Impresión de modalidad y días cobrables. 4/4 pruebas pasando.
  - Verificado en producción con Chrome DevTools MCP en Laptop (1366x768) y Móvil (375x812, `hasHorizontalOverflow: false`) con 0 errores de consola.

## Decisiones (y por qué)
- **Normalización UTC Neutra (12:00:00Z)**: Inmunidad absoluta contra desfases de zona horaria local al operar cálculos de calendario laboral.
- **Transparencia en Modal de Auditoría**: Permite al operario de mostrador y al cliente auditar fecha por fecha cuáles días son hábiles, festivos o descansos.

## Aprendizajes y errores a evitar
- Los Server Actions en Next.js exigen que toda función exportada desde `'use server'` sea estrictamente `async`; helpers internos síncronos no deben llevar `export`.
- En pruebas con inputs tipo date de React, los eventos sintéticos requieren invocar el setter nativo de `HTMLInputElement.prototype` para gatillar el ciclo de renderizado.

## Próximos pasos
1. Proceder con la **Tarea B4**: Notificaciones automáticas de cobranza por WhatsApp/Email al cliente y recordatorios de devolución express.
2. Integrar módulo de rutas y logística de fletes Bucaramanga (**Tarea B3**).
