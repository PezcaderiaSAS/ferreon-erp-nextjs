# Regla de Negocio: Precisión Monetaria en Colombia (COP Sin Centavos)

## 1. Principio Fundamental
En Colombia, la totalidad de operaciones comerciales, contratos de alquiler, cotizaciones, cobro de fletes, depósitos en garantía, liquidaciones por averías, recibos de caja y control de cartera para maquinaria y equipos de construcción **se manejan estrictamente en Pesos Colombianos (COP) enteros, SIN CENTAVOS**.

## 2. Reglas Obligatorias de Implementación

1. **Precisión Matemática de Enteros:**
   - En cálculos aritméticos (subtotales, días multiplicados por tarifa, suma de fletes, deducción de depósitos y abonos), el resultado debe ser siempre un entero (`Math.round()` o `BIGINT`).
   - Queda terminantemente prohibido almacenar o presentar decimales o centavos en valores monetarios.

2. **Formato Visual y en PDFs:**
   - Los importes monetarios deben representarse con el signo de pesos `$`, separación de miles con punto y sin sufijo de decimales.
   - **Correcto:** `$40.000`, `$135.000`, `$1.500.000`
   - **Incorrecto:** `$40.000,00`, `$40.000.50`, `40000 COP`

3. **Conversión de Totales a Letras:**
   - Todo documento oficial de Cotización, Contrato de Alquiler o Cuenta de Cobro debe incluir la glosa legal colombiana en mayúsculas:
     $$\text{SON: [MONTO EN LETRAS] PESOS M/CTE}$$
   - *Ejemplo:* `$40.000` $\rightarrow$ `SON: CUARENTA MIL PESOS M/CTE`
   - *Ejemplo:* `$145.000` $\rightarrow$ `SON: CIENTO CUARENTA Y CINCO MIL PESOS M/CTE`
