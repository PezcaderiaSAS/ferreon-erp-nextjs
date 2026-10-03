# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js 14 en Vercel + Supabase Postgres RLS).
- Facturación Recurrente y Cuentas de Cobro Periódicas (Hito 19 - SPEC-003 Completado):
  - Servicio de dominio (`facturacion-recurrente.service.ts`): Intersección pro-rata exacta de rangos de fechas (max/min), liquidación por ítem con tarifas diarias, IVA (19%), Retefuente (2.5%) y ReteICA (0.966%) con Integer Math en COP. Constructor de mensajes y URLs para WhatsApp.
  - Server Actions (`facturacion-recurrente.ts`): Asignación de consecutivo correlativo (`CC-PER-XXXX` o `FAC-REC-XXXX`), persistencia en tabla `facturas`, auditoría inmutable e invalidación de caché en Redis.
  - UI/UX (`CortesPeriodicosPanel.tsx`, `EmitirCuentaCobroModal.tsx`): Selector de cortes (quincenales, mensuales, libres), KPIs proyectados del periodo, tabla tabular con selección múltiple para lote, modal con emisión y envío directo por WhatsApp.
  - Integración en `/facturacion`: Conmutador de pestañas en `FacturacionInteractiveIsland.tsx`.
- Pruebas y validaciones: 79 suites de Vitest pasadas, 438/438 tests aprobados (100%), 0 errores TypeScript (`tsc --noEmit`), compilación de producción Next.js (`npm run build`) en verde (33 rutas optimizadas).

## Decisiones (y por qué)
- **Intersección Pro-Rata con Max/Min**: Garantiza cobro exacto de días en obra para contratos que iniciaron después del inicio del corte o finalizaron antes del fin del corte.
- **Dualidad Documental (Cuenta de Cobro vs Factura IVA)**: Permite a los clientes elegir si emiten documento de cobro bajo Art. 616-1 del E.T. o factura con desglose tributario según el régimen fiscal.
- **Emisión en Lote & Envío WhatsApp**: Agiliza la gestión de cobro periódico para decenas de contratos en obra sin fricción manual.

## Aprendizajes y errores a evitar
- Al calcular diferencias de días cronológicos sobre marcas de tiempo UTC, normalizar a medianoche o usar fechas ISO 'YYYY-MM-DD' para evitar desfases de horas de zona horaria.
- Recordar usar `BypassSandbox: true` para invocar ejecutables de Node/pnpm/git en Windows bajo este entorno.

## Próximos pasos
- Módulo de Devoluciones y Liquidación final de contratos en obra con penalidades o reembolsos de depósitos.
- Opcional: Grabar demostración interactiva con Recordly para QA visual.
