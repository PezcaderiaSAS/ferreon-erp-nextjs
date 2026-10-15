---
name: local-dates
description: Checklist y directrices de manejo de fechas locales para evitar desincronizaciones UTC en contratos, alquileres, rachas e historiales operativos.
---

# Skill: Manejo Seguro de Fechas Locales y Motores PDF (Local Dates)

Esta habilidad asegura la consistencia temporal absoluta en **Alquileres System**, previniendo errores por desfasajes de zona horaria (UTC vs Local Colombia `America/Bogota`, UTC-5), sobreescritura destructiva de fechas en cascada y alteraciones en la generación de documentos PDF.

---

## 1. Reglas Innegociables

1. **Zona Horaria de Negocio:**
   - Todas las fechas de inicio, fin, vencimiento, entrega y devoluciones operan bajo el huso horario de Colombia (`America/Bogota`, UTC-5).
2. **Almacenamiento en Base de Datos:**
   - **Fechas puras de calendario:** Almacenar como tipo `DATE` (formato ISO `YYYY-MM-DD`) sin componente de hora. Esto blinda los registros contra desfasajes en serializaciones JSON de Vercel/Node.
   - **Marcas de auditoría:** Almacenar como `TIMESTAMPTZ` en UTC.
3. **Cero Invocaciones UTC sin Anclar:**
   - **PROHIBIDO:** `new Date("YYYY-MM-DD").toISOString().split('T')[0]` (resta 5 horas en UTC-5, cayendo a las 19:00:00 del día anterior).
   - **PROHIBIDO:** `new Date(string).toLocaleDateString('es-CO')` en servidor o cliente sin fijar la zona horaria.
4. **Cálculo de Días de Alquiler:**
   - Debe computarse determinísticamente con guardia de piso: $\max(1, \text{días})$.
   - Mismo día de inicio y devolución equivale a 1 día completo de alquiler.
5. **No Cascada Destructiva:**
   - En formularios de creación/edición (`useAlquilerForm.ts`), modificar fechas maestras en el Paso 1 JAMÁS debe sobreescribir las fechas de los ítems individuales ya configurados en el Paso 2.

---

## 2. Catálogo de Utilidades Canónicas (`src/core/utils/fechas.ts`)

```typescript
import { 
  parsearFechaLocal, 
  obtenerFechaHoyISO, 
  formatearFechaISO, 
  formatearFechaLocal, 
  calcularDiasEntreFechas, 
  resolverFechaYHoraDocumento 
} from '@/core/utils/fechas';

// 1. Obtener la fecha de hoy local segura (YYYY-MM-DD)
const hoy = obtenerFechaHoyISO();

// 2. Serializar cualquier fecha a YYYY-MM-DD sin desfase
const fechaISO = formatearFechaISO(item.fecha_inicio);

// 3. Formatear para visualización en UI y reportes (DD/MM/YYYY)
const fechaVisual = formatearFechaLocal(fechaISO);

// 4. Calcular días de alquiler con mínimo 1 día
const dias = calcularDiasEntreFechas(fechaInicio, fechaFin);

// 5. Emisión de comprobantes y PDFs con fecha y hora exacta
const { fecha, hora } = resolverFechaYHoraDocumento({ fechaEmision: doc.created_at });
```

---

## 3. Checklist de Auditoría Rápida

- [ ] ¿El mapeador (`src/lib/mappers.ts`) utiliza `formatearFechaISO` en lugar de `new Date().toISOString()`?
- [ ] ¿Los generadores de PDF (`ContratoAlquilerPDF.tsx`, `EnterprisePDFService`) usan `formatearFechaLocal` y `calcularDiasEntreFechas`?
- [ ] ¿Los comprobantes modales (`ReciboCajaMixtoPDFModal`, `ComprobanteDevolucionPDFModal`) usan `resolverFechaYHoraDocumento`?
- [ ] ¿Los formularios permiten contratos y cotizaciones retroactivas manteniendo congruencia (`fin >= inicio`)?
- [ ] ¿Las suites de regresión `tests/unit/fechas-congruencia-bloqueo.test.ts` y `tests/unit/pdf-fechas-carga.test.ts` pasan al 100%?
