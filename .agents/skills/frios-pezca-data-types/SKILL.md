---
name: frios-pezca-data-types
description: Reglas estrictas para manejar los esquemas DDL en Supabase, conversiones de gramos a kilos, fechas y decimales financieros.
---

# Tipos de Datos y Esquemas (FerreOn ERP Next.js + Supabase)

## 1. Muestreo de Tipos en Supabase PostgreSQL
- **UUID:** Claves primarias generadas mediante `uuid_generate_v4()`.
- **Precios / Finanzas:** `NUMERIC(12, 2)` para evitar distorsiones de coma flotante.
- **Peso de Equipos / Materiales:** `peso_gramos BIGINT` (Gramos enteros, ej. 24,575,400 gramos = 24,575.4 Kilos).
- **Fechas / Marcas de Tiempo:** `TIMESTAMPTZ` (ISO 8601 con zona horaria `America/Bogota` / UTC).

## 2. Conversión de Unidades (Gramos vs. Kilos)
```typescript
// En Dominio (Value Object)
export class PesoGramos {
  private constructor(public readonly gramos: bigint) {}

  static fromKilos(kilos: number): PesoGramos {
    return new PesoGramos(BigInt(Math.round(kilos * 1000)));
  }

  toKilos(): number {
    return Number(this.gramos) / 1000;
  }
}
```

## 3. Manejo de Fechas e Invariantes
- En las API Routes y la capa de infraestructura, formatear y manipular fechas utilizando `date-fns` o ISO 8601 strings.
- Los rangos de alquiler (`fecha_inicio` a `fecha_fin`) deben ser validados para prevenir que la fecha de finalización sea anterior a la inicial.
