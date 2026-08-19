# Reglas de Negocio: Precisión Matemática de Moneda COP (Cero Centavos)

## Contexto Comercial y Legal en Colombia
En el mercado colombiano de alquiler y venta de maquinaria, equipos menores, andamios y herramientas de construcción, **los valores comerciales y fiscales no utilizan centavos**. Los centavos fueron descontinuados en las transacciones comerciales cotidianas y en la facturación de este sector.

---

## Directrices Técnicas de Arquitectura de Datos

### 1. Base de Datos (PostgreSQL / Supabase)
* **Tipos de Columna:**
  - Valores de dinero (tarifas, fletes, subtotales, depósitos, pagos): `BIGINT` o `NUMERIC(14, 0)`.
  - Prohibido el uso de `FLOAT` o `REAL` debido a errores de aproximación en sumas acumulativas.

### 2. Capa de Dominio y Lógica Financiera (TypeScript)
* Todas las fórmulas de cálculo aplican `Math.round()` al subtotal final de cada renglón y de la cabecera:
  ```typescript
  export function calcularSubtotalLinea(cantidad: number, tarifaDiaria: number, dias: number): number {
    return Math.round(cantidad * tarifaDiaria * dias);
  }
  ```
* La cartera y las cuentas de cobro deducen abonos manteniendo la precisión exacta:
  $$\text{saldoPendiente} = \max\left(0, \text{totalFacturado} - \text{totalAbonado}\right)$$

### 3. Presentación Visual y Generación Documental (PDF Carta)
* **Formato de Moneda:** `$40.000` (con separador de miles con punto y sin `,00`).
* **Expresión en Letras:** `SON: [VALOR EN LETRAS] PESOS M/CTE`.
