# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js 14 en Vercel + Supabase Postgres RLS).
- Módulo Cotizaciones Rápidas (Hito 18 - SPEC-002 Completado):
  - Ruta `/cotizaciones`: Convertida a RSC de primer nivel en el menú lateral con streaming `<Suspense>` y skeleton shimmer (First Load JS: 95.5 kB).
  - Dominio y TDD (`cotizacion-rapida.service.ts`): Integer Math en COP, IVA 19%, retenciones, cálculo de KPIs del pipeline y constructor de enlace WhatsApp (`wa.me`). Suite de 9 pruebas unitarias aprobadas al 100%.
  - Modal Express 30s (`CotizacionRapidaModal.tsx`): Creación de prospectos on-the-fly, verificación de stock en vivo, recálculo reactivo y envío directo por WhatsApp.
  - Isla Interactiva (`CotizacionesInteractiveIsland.tsx`): KPIs de conversión, filtros por estado, tabla tabular en desktop, tarjetas líquidas en móvil y conversión poka-yoke a contratos en 1-clic.
- Pruebas y validaciones: 78 suites de Vitest pasadas, 428/428 tests aprobados (100%), 0 errores TypeScript (`tsc --noEmit`), compilación de producción Next.js 33/33 rutas en verde.

## Decisiones (y por qué)
- **Ruta `/cotizaciones` como RSC Autónomo**: Independiza el flujo comercial del asesor para que pueda emitir ofertas en 30 segundos sin depender del formulario denso de contratos.
- **Creación de Prospecto On-The-Fly**: Permite cotizar a nuevos clientes con solo Nombre y Teléfono sin obligar a registrar previamente el tercero.
- **Integración WhatsApp sin librerías externas**: Generación de URLs canónicas `https://wa.me/{tel}?text={msg}` que abren directamente la app nativa o web de WhatsApp en cualquier dispositivo.

## Aprendizajes y errores a evitar
- Escapar siempre las comillas dobles en JSX (`&quot;`) para evitar fallos de compilación con ESLint en Next.js.
- En `ModalProps`, la propiedad de tamaño es `maxWidth` y no `size`.
- Recordar usar `BypassSandbox: true` para invocar ejecutables de Node/pnpm/git en Windows bajo este entorno.

## Próximos pasos
- Módulo de Facturación Recurrente y Cuentas de Cobro periódicas.
- Opcional: Grabar demostración interactiva con Recordly para QA visual.
