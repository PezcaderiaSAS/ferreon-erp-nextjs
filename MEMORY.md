# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **SPEC-017 Completada y Desplegada en Producción (Vercel & Supabase Live)**:
  - Commit `5891246a` desplegado en Vercel (`https://alquileres-erp-nextjs-ruby.vercel.app`) en estado `READY`.
  - Dominio puro `NotificacionesCobranzaService`: Sanitización Colombia (+57), enlaces profundos de WhatsApp, recordatorios preventivos de alquileres express (por horas), alertas de mora con cálculo de recargo y tolerancia de 15 min, consolidación de cartera multirrecibo y plantillas HTML de cobranza. 8/8 pruebas unitarias y 40/40 de la suite pasando.
  - Integración UI en `AlquileresInteractiveIsland` y `FacturacionInteractiveIsland` con botones directos de WhatsApp para contratos por horas y facturas pendientes.
  - Verificado en producción con Chrome DevTools MCP en Laptop (1366x768) y Móvil (375x812, `hasHorizontalOverflow: false`) con 0 errores de consola.

## Decisiones (y por qué)
- **Tolerancia de Gracia de 15 Minutos en Alquiler Express**: Previene fricciones de cobranza y falsas acusaciones de mora mientras el cliente arriba al mostrador a entregar los equipos.
- **Deep Links `api.whatsapp.com/send`**: Máxima compatibilidad cruzada entre navegadores de escritorio (WhatsApp Web) y móviles nativos sin necesidad de registrar APIs de pago adicionales.
- **Aritmética Entera COP**: Todos los valores monetarios de cobranza y mora se calculan en enteros exactos para evitar errores de redondeo IEEE 754.

## Aprendizajes y errores a evitar
- Mapeo de `FacturaUI`: el nombre del cliente se almacena en `factura.cliente` y el objeto contrato original en `factura.alquilerOriginal`, desde donde se extrae de forma segura el teléfono del cliente (`factura.alquilerOriginal.clientes?.telefono`).
- Los saltos de línea de los archivos deben verificarse (LF vs CRLF) antes de aplicar reemplazos de cadenas para evitar discordancias.

## Próximos pasos
1. Proceder con el siguiente hito del roadmap: Módulo de rutas y logística de fletes Bucaramanga (**SPEC-018 / Tarea B3**).
2. Reportes avanzados de rentabilidad y depreciación de equipos.
