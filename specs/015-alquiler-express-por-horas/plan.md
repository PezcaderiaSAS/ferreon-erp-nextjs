# Plan de Arquitectura y Diseño Técnico: SPEC-015
## Módulo de Alquiler Express por Horas en Mostrador POS con Límite Configurable

---

### 1. Arquitectura y Componentes Involucrados

```text
[Módulo de Configuración (/configuracion)]
   │  └── EmpresaConfig (alquilerHorasHabilitado, maxEquiposAlquilerHoras, recargoHorasPorcentaje)
   ▼
[Core Domain / Pure Services]
   │  ├── AlquilerHorasService.ts (Cálculo de tarifas horarias, redondeos COP, proyección de hora retorno)
   │  └── empresaStore / bodegaStore
   ▼
[Schemas Zod & Server Actions]
   │  ├── posSchemas.ts (unidadTiempo: 'DIAS' | 'HORAS', horasContratadas, horaEntrega, horaRetornoEstimada)
   │  └── alquileres.ts (crearAlquilerRapidoPosAction)
   ▼
[UI Layer: Mostrador POS Ultra-Simple]
   │  └── MostradorPosModal.tsx
   │        ├── Segmented Control Grande: [Modo Días (📅)] vs [Modo Horas (⏱️)]
   │        ├── Controles Gigantes (+1h, +2h, +4h, +8h) y Stepper (+/-)
   │        ├── Card de Horas: Salida [10:30 AM] ➔ Retorno [02:30 PM]
   │        └── Poka-Yoke: Badge amigable de límite alcanzado al llegar a maxEquipos
   ▼
[PDF & Ticket Output]
   │  ├── ContratoAlquilerPDF.tsx (Línea de Modalidad Horas, Hora Entrega y Hora Retorno)
   │  └── TicketAlquilerModal.tsx (Ticket térmico 80mm con hora de devolución destacada)
```

---

### 2. Modificaciones en Modelos y Esquemas

#### A. Entidad `EmpresaConfig` (`src/core/domain/entities/empresa-config.ts`)
```typescript
export interface EmpresaConfig {
  // ... campos existentes ...
  alquilerHorasHabilitado?: boolean; // default: true
  maxEquiposAlquilerHoras?: number;  // default: 5
  recargoHorasPorcentaje?: number;   // default: 20 (%)
}
```

#### B. Servicio `AlquilerHorasService` (`src/core/services/alquiler-horas.service.ts`)
```typescript
export class AlquilerHorasService {
  public static calcularTarifaHora(tarifaDia: number, recargoPorcentaje: number = 20): number {
    if (tarifaDia <= 0) return 0;
    const baseHora = tarifaDia / 8;
    const conRecargo = baseHora * (1 + recargoPorcentaje / 100);
    return Math.round(conRecargo);
  }

  public static proyectarHoraRetorno(horaEntrega: string, horas: number): string {
    // Suma segura de horas manejando cruce de mediodía o tarde
    // Retorna formato legible 'HH:mm' o 'hh:mm A'
  }

  public static calcularHorasRetraso(horaPactada: string, horaReal: string): number {
    // Retorna número de horas completas o fraccionadas en exceso
  }
}
```

#### C. Esquema `posSchemas.ts`
```typescript
export const UnidadTiempoAlquilerZodSchema = z.enum(['DIAS', 'HORAS']).default('DIAS');

export const ItemPosZodSchema = z.object({
  equipoId: z.union([z.string(), z.number()]),
  cantidad: z.coerce.number().int().min(1),
  tarifaAplicada: z.coerce.number().min(0),
  unidadTiempo: UnidadTiempoAlquilerZodSchema.optional(),
  duracion: z.coerce.number().int().min(1).default(1), // días u horas
  diasCobro: z.coerce.number().int().min(1).default(1),
  horaEntrega: z.string().optional().nullable(),
  horaDevolucionEstimada: z.string().optional().nullable(),
  subtotalLinea: z.coerce.number().min(0).optional(),
});
```

---

### 3. Principios de Simplicidad "Niño de 12 Años" (Poka-Yoke Visual)

1. **Botones Enormes y Autoexplicativos**:
   - Cada botón incluye ícono + texto legible en negrita + color temático.
2. **Cero Cálculos Mentales para el Operador**:
   - Al marcar "+2 Horas", la pantalla muestra en tipografía grande:
     `🟢 Entrega: Ahora (09:15 AM) ➔ Devolver a las: 11:15 AM`.
3. **Bloqueo Físico Suave**:
   - Al alcanzar el 5to equipo (o el límite configurado), el botón de agregar se torna gris claro y muestra un escudo protector con el texto: *"¡Tope de 5 equipos alcanzado para alquiler express!"*.
4. **Resumen de Cobro Transparente**:
   - Total = `(Horas x Tarifa Horaria) + Depósito`.
