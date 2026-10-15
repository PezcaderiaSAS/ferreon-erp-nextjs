# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js 14 en Vercel + Supabase Postgres RLS).
- Accesibilidad & Focus-Trap LIFO (Speckit SDD - SPEC-2026-UI-REMEDIATION-WCAG-001):
  - Creado `src/hooks/useModalAccessibility.ts` con control de teclado WCAG 2.1 AA (2.1.1, 2.1.2), supresión por Server Actions (`isBlocked`) y delegación LIFO para modales anidados (`isNestedOpen`).
  - Integrado en `ConvertirCotizacionModal.tsx`, `Modal.tsx` y `CrearSubcontratacionModal.tsx` con recuperación poka-yoke para cotizaciones vacías.
  - Inyectados atributos `aria-label` descriptivos y feedback táctil (`active:scale-[0.98]`, min 44px) en tablas de cotizaciones y devoluciones.
- Blindaje de Fechas & Motor de Generación PDF (Speckit Workflow):
  - Neutralizado el desfase UTC-5 en la carga de datos para PDFs, mappers de base de datos e interfaces operativas.
  - Estandarizado el uso de `formatearFechaLocal`, `formatearFechaISO`, `calcularDiasEntreFechas` y `resolverFechaYHoraDocumento`.
  - Módulos auditados y blindados: `mappers.ts`, `AlquileresInteractiveIsland.tsx`, `ContratoAlquilerPDF.tsx`, `EnterprisePDFService`, `facturacion-transaccional.service.ts`, `devoluciones-transaccional.service.ts`, `OrdenSubcontratacionPDFModal.tsx`, `ReciboCajaMixtoPDFModal.tsx`, `ComprobanteDevolucionPDFModal.tsx` y `CotizacionRapidaModal.tsx`.
- Calidad y Cobertura:
  - 87/87 suites Vitest (500/500 tests aprobados al 100%).
  - 0 errores TypeScript (`tsc --noEmit`) y 14/14 checks de tokens W3C DTCG en verde (`audit:tokens`).
  - Suites especializadas: `modal-accessibility.test.ts` (6/6), `fechas-congruencia-bloqueo.test.ts` (6/6) y `pdf-fechas-carga.test.ts` (9/9).

## Decisiones (y por qué)
- **Eliminación Total de `new Date(str).toISOString()` no anclado**: Previene que cadenas de fecha pura se interpreten a las 00:00:00 UTC y retrocedan 5 horas (19:00:00 del día anterior) en Colombia, alterando los PDFs.
- **Normalización de Renglones de Maquinaria**: Todo renglón garantiza cálculo exacto de días $\ge 1$, formato `DD/MM/YYYY` ordenado cronológicamente y subtotales coherentes.

## Aprendizajes y errores a evitar
- Nunca usar `toLocaleDateString` sin fijar la zona horaria o el anclaje a mediodía local para evitar divergencias entre servidor Node (UTC) y cliente (UTC-5).
- Mantener siempre `MEMORY.md` en $\le 50$ líneas consolidando contexto histórico en `docs/memory-bank/`.

## Próximos pasos
- Monitoreo de observabilidad y feedback operativo en producción sobre contratos y PDFs emitidos.
