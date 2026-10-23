# Plan de Arquitectura y Diseño Técnico: SPEC-014
## Motor de Tarifas Dinámicas por Días Hábiles vs Calendario con Exclusión de Domingos y Festivos de Colombia

---

### 1. Arquitectura General y Capas
El módulo se estructura siguiendo los principios de Clean Architecture y DDD (Domain-Driven Design) en **Alquileres System**:

```text
[UI / Form Layer]
   │  ├── MostradorPosModal.tsx (Selector de Modo de Cobro + Badge de Días Excluidos)
   │  └── AlquilerForm.tsx / AlquilerWizard
   ▼
[Server Actions / Application Layer]
   │  └── alquilerActions.ts (validación Zod de modo_cobro_dias y dias_cobrables)
   ▼
[Domain Services Layer]
   │  └── CalendarioLaboralService.ts (Puro, determinista, 0 dependencias externas)
   │        ├── calcularPascua(anio) [Algoritmo de Butcher / Meeus]
   │        ├── obtenerFestivosColombia(anio) [Fijos + Ley Emiliani + Pascua]
   │        ├── esFestivo(fecha)
   │        ├── esDiaHabil(fecha, modo)
   │        ├── calcularDiasCobrables(inicio, fin, modo)
   │        └── desglosarDiasPeriodo(inicio, fin, modo)
   ▼
[PDF Reporting Layer]
   │  ├── ContratoAlquilerPDF.tsx (Línea de modo de cobro y días cobrables)
   │  └── EnterprisePDFService (pdf-factura-generator.service.ts)
```

---

### 2. Algoritmo de Festivos de Colombia (Ley 51 de 1983 - Emiliani)

1. **Festivos Fijos** (se celebran exactamente el día de calendario correspondiente):
   - 1 Enero: Año Nuevo
   - 1 Mayo: Día del Trabajo
   - 20 Julio: Grito de Independencia
   - 7 Agosto: Batalla de Boyacá
   - 8 Diciembre: Inmaculada Concepción
   - 25 Diciembre: Navidad

2. **Festivos Ley Emiliani** (se trasladan al lunes siguiente; si caen en lunes se mantienen en lunes):
   - 6 Enero: Reyes Magos
   - 19 Marzo: San José
   - 29 Junio: San Pedro y San Pablo
   - 15 Agosto: Asunción de la Virgen
   - 12 Octubre: Día de la Raza
   - 1 Noviembre: Todos los Santos
   - 11 Noviembre: Independencia de Cartagena

3. **Festivos Móviles vinculados al Domingo de Pascua (Computus)**:
   - Jueves Santo: Pascua - 3 días (siempre jueves)
   - Viernes Santo: Pascua - 2 días (siempre viernes)
   - Ascensión del Señor: Pascua + 43 días (trasladado al siguiente lunes)
   - Corpus Christi: Pascua + 64 días (trasladado al siguiente lunes)
   - Sagrado Corazón de Jesús: Pascua + 71 días (trasladado al siguiente lunes)

4. **Regla de Traslado al Siguiente Lunes**:
   - Si la fecha cae en Lunes (day = 1), se queda en esa fecha.
   - Si cae en Domingo (day = 0), se suma 1 día.
   - Si cae en Martes (day = 2), se suman 6 días.
   - Si cae en Miércoles (day = 3), se suman 5 días.
   - Si cae en Jueves (day = 4), se suman 4 días.
   - Si cae en Viernes (day = 5), se suman 3 días.
   - Si cae en Sábado (day = 6), se suman 2 días.
   - Fórmula: `diasParaLunes = (8 - diaSemana) % 7` (con domingo = 0).

---

### 3. Contratos de Tipos e Interfaces TypeScript

```typescript
export type ModoCobroDias = 'CALENDARIO' | 'HABILES_LUNES_VIERNES' | 'HABILES_LUNES_SABADO';

export interface FestivoColombia {
  fecha: string; // ISO 'YYYY-MM-DD'
  nombre: string;
  tipo: 'FIJO' | 'EMILIANI' | 'PASCUA';
}

export interface DetalleDiaPeriodo {
  fecha: string; // 'YYYY-MM-DD'
  diaSemana: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  nombreDia: string; // 'Lunes', 'Martes', etc.
  esCobrable: boolean;
  esFestivo: boolean;
  nombreFestivo?: string;
  motivoExclusion?: string; // 'Domingo', 'Sábado', 'Festivo: Día del Trabajo', etc.
}

export interface DesgloseDiasAlquiler {
  totalDiasCalendario: number;
  diasCobrables: number;
  diasExcluidos: number;
  modoCobro: ModoCobroDias;
  detalles: DetalleDiaPeriodo[];
}
```

---

### 4. Estrategia de Pruebas (TDD)
- **Suite**: `tests/unit/calendario-laboral.service.test.ts`.
- Casos de prueba:
  1. Pascua en 2026 (5 de abril de 2026) y 2027 (28 de marzo de 2027).
  2. Festivos fijos (1 mayo 2026, 20 julio 2026, etc.).
  3. Traslado Emiliani (ej: 12 de octubre de 2026 trasladado al lunes).
  4. Jueves y Viernes Santo en 2026 (2 y 3 de abril de 2026).
  5. Cálculo de cobro período 1 mayo 2026 al 10 mayo 2026:
     - En `CALENDARIO`: 10 días.
     - En `HABILES_LUNES_VIERNES`: excluye 1 mayo (festivo), 2 y 3 mayo (fin de semana), 9 y 10 mayo (fin de semana) -> 5 días.
     - En `HABILES_LUNES_SABADO`: incluye sábados 2 y 9 mayo -> 7 días.
  6. Manejo de fechas inválidas o fin < inicio.
