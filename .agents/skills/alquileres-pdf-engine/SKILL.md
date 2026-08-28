---
name: alquileres-pdf-engine
description: Motor y estándares arquitectónicos de generación de PDFs en Alquileres System (React-PDF, Impresión HTML A4, cálculo de días/subtotales y formato verbal monetario).
---

# Alquileres PDF Engine — Estándar Técnico de Generación de Documentos

Esta skill documenta las reglas, utilidades y componentes obligatorios para la generación de documentos PDF (Contratos de Alquiler, Cotizaciones y Cuentas de Cobro) en **Alquileres System**.

---

## 1. Reglas Inviolables de Cálculo y Renglones

1. **100% de Información por Renglón:**
   Cada fila de maquinaria en la tabla del PDF debe contener sin excepción:
   - `nombre`: Nombre del equipo o maquinaria.
   - `codigo`: Código o SKU asignado.
   - `cantidad`: Cantidad de unidades alquiladas.
   - `fechaInicio`: Fecha de entrega / inicio del alquiler (`YYYY-MM-DD` o formato local `DD/MM/YYYY`).
   - `fechaFin`: Fecha de devolución estimada.
   - `dias`: Cantidad de días hábiles/calendario calculados:
     $$\text{días} = \max\left(1, \left\lceil \frac{\text{fechaFin} - \text{fechaInicio}}{1000 \times 60 \times 60 \times 24} \right\rceil\right)$$
   - `tarifaDiaria`: Valor unitario por día en COP.
   - `subtotal`: $\text{cantidad} \times \text{tarifaDiaria} \times \text{días}$.

2. **Liquidación Financiera Exacta:**
   - $\text{Subtotal Equipos} = \sum (\text{subtotal de cada renglón})$
   - $\text{Total Fletes} = \text{Flete Entrega} + \text{Flete Recogida}$
   - $\text{Total General} = \text{Subtotal Equipos} + \text{Total Fletes}$
   - $\text{Saldo Pendiente} = \max(0, \text{Total General} - \text{Depósito / Anticipo})$

3. **Monto en Letras Obligatorio:**
   - Todo PDF debe incluir la representación formal en letras:
     `SON: [VALOR EN LETRAS] PESOS M/CTE`.

---

## 2. Nomenclatura Estandarizada de Archivos

Los archivos PDF descargados deben seguir estrictamente el patrón:
`Contrato_Alquiler_#CONSECUTIVO_CLIENTE_YYYY-MM-DD.pdf`

Ejemplo:
`Contrato_Alquiler_#101_Andres_Joaquin_Luna_2026-08-28.pdf`

*Nota: Los espacios y caracteres no alfanuméricos en el nombre del cliente se reemplazan por guiones bajos (`_`).*

---

## 3. Asistencia Verbal de Monedas en Formularios UI

En todos los campos de entrada monetaria (Depósito, Garantía, Fletes, Tarifas Diarias), se debe renderizar una etiqueta de ayuda visual en tiempo real con el formato:
`$ 10.000 (Diez mil pesos)`
evitando confusiones en la digitación de ceros.

---

## 4. Arquitectura de Generación Dual

- **Descarga Directa (`@react-pdf/renderer`):** Componente [`ContratoAlquilerPDF.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/FerreOn/Alquileres_erp/src/components/pdf/ContratoAlquilerPDF.tsx) con soporte para estilos A4, tipografía incrustada Roboto y renderizado client-side.
- **Vista Previa e Impresión (`window.print()`):** Servicio [`EnterprisePDFService`](file:///c:/Users/USUARIO/Documents/Aplicaciones/FerreOn/Alquileres_erp/src/core/services/pdf-factura-generator.service.ts) que renderiza HTML/CSS optimizado con membrete corporativo, notas bancarias y ventana emergente de impresión A4.
