---
name: alquileres-pdf-engine
description: Motor y estándares arquitectónicos de generación de PDFs en Alquileres System (React-PDF, Impresión HTML Carta y A5, cálculo de días/subtotales y formato verbal monetario).
---

# Alquileres PDF Engine — Estándar Técnico de Generación de Documentos

Esta skill documenta las reglas, utilidades y componentes obligatorios para la generación de documentos PDF (Contratos de Alquiler, Cotizaciones y Cuentas de Cobro) en **Alquileres System**.

---

## 1. Reglas Inviolables de Cálculo y Renglones (7 Columnas)

1. **100% de Información por Renglón:**
   Cada fila de maquinaria en la tabla del PDF debe contener sin excepción:
   - `nombre`: Nombre del equipo o maquinaria (incluyendo SKU/código).
   - `cantidad`: Cantidad de unidades alquiladas.
   - `fechaInicio`: Fecha de entrega / inicio del alquiler (`DD/MM/YYYY`).
   - `fechaFin`: Fecha de devolución estimada (`DD/MM/YYYY`).
   - `dias`: Cantidad de días hábiles/calendario calculados con guardia de mínimo 1 día:
     $$\text{días} = \max\left(1, \left\lceil \frac{\text{fechaFin} - \text{fechaInicio}}{1000 \times 60 \times 60 \times 24} \right\rceil\right)$$
   - `tarifaDiaria`: Valor unitario por día en COP.
   - `subtotal`: $\text{cantidad} \times \text{tarifaDiaria} \times \text{días}$.

2. **Liquidación Financiera Exacta (Cero `$ 0`):**
   - $\text{Subtotal Equipos} = \sum (\text{subtotal de cada renglón})$
   - $\text{Total Fletes} = \text{Flete Entrega} + \text{Flete Recogida}$
   - $\text{Total General} = \text{Subtotal Equipos} + \text{Total Fletes}$
   - $\text{Saldo Pendiente} = \max(0, \text{Total General} - \text{Depósito / Anticipo})$

3. **Monto en Letras Obligatorio:**
   - Todo documento debe incluir la representación formal en letras:
     `SON: [VALOR EN LETRAS] PESOS M/CTE`.

---

## 2. Soporte Multiformato (Carta & Media Carta A5)

El motor soporta de forma nativa dos tamaños de hoja estandarizados:

1. **Tamaño Carta (`LETTER` - 215.9 × 279.4 mm):**
   - Padding de página: `28pt`.
   - Tipografía base: `8.5pt - 9pt`.
   - Orientado a contratos legales formales, cuentas de cobro y pólizas.

2. **Tamaño Media Carta (`A5` - 148 × 210 mm):**
   - Padding de página: `16pt - 18pt`.
   - Tipografía base: `7.5pt - 8pt`.
   - Orientado a comprobantes rápidos de despacho y remisiones en obra.

---

## 3. Nomenclatura Estandarizada y Sanitizada de Archivos

Los archivos descargados deben seguir estrictamente el patrón:
`Contrato_Alquiler_#CONSECUTIVO_CLIENTE_YYYY-MM-DD_FORMATO.pdf`

Ejemplos:
- `Contrato_Alquiler_#00101_Andres_Joaquin_Luna_2026-08-28_Carta.pdf`
- `Contrato_Alquiler_#00101_Andres_Joaquin_Luna_2026-08-28_A5.pdf`

*Nota: Los caracteres con tilde, espacios y símbolos no alfanuméricos se limpian automáticamente con `.normalize("NFD").replace(/[^a-zA-Z0-9]/g, "_")`.*

---

## 4. Asistencia Verbal de Monedas en Formularios UI

En todos los campos de entrada monetaria (Depósito, Garantía, Fletes, Tarifas Diarias), se debe renderizar una etiqueta de ayuda visual en tiempo real con el formato:
`$ 10.000 (Diez mil pesos)`
utilizando `formatearMonedaConLetras(monto)` desde `src/core/utils/numero-a-letras.ts`.

---

## 5. Arquitectura de Generación Dual y Previsualización

- **Previsualización Interactiva en Vivo (Paso 3):** Modal antes del guardado que renderiza el contrato en tiempo real permitiendo alternar entre Carta y A5 e imprimir directamente (`window.print()`).
- **Descarga Directa (`@react-pdf/renderer`):** Componente [`ContratoAlquilerPDF.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/FerreOn/Alquileres_erp/src/components/pdf/ContratoAlquilerPDF.tsx) con prop `pageSize: 'LETTER' | 'A5'`.
- **Vista Previa e Impresión (`window.print()`):** Servicio [`EnterprisePDFService`](file:///c:/Users/USUARIO/Documents/Aplicaciones/FerreOn/Alquileres_erp/src/core/services/pdf-factura-generator.service.ts) con CSS `@page` y barra de herramientas con conmutador de tamaño.
