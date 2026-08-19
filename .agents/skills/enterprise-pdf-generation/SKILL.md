---
name: enterprise-pdf-generation
description: Estándares arquitectónicos y de diseño para la generación de documentos PDF de nivel empresarial (Cotizaciones, Contratos de Alquiler y Cuentas de Cobro) con soporte de impresión A4, membrete corporativo y 100% de renglones.
---

# Enterprise PDF Generation — Guía de Arquitectura & Estándares

Esta skill define las reglas obligatorias para generar documentos PDF de nivel corporativo en **Alquileres ERP** (`alquileres_app`), garantizando precisión fiscal, alta fidelidad tipográfica e integridad en el 100% de los renglones contratados.

## 1. Tipos de Documentos Empresariales

1. **COTIZACIÓN COMERCIAL (`COTIZACION`):**
   - Propuesta económica para el cliente antes del despacho.
   - Incluye validez de la oferta (días hábiles), disponibilidad tentativa de inventario en bodega, tarifas diarias, peso proyectado de transporte y costos de fletes.
   - No descuenta inventario ni exige depósito hasta su aprobación.

2. **CONTRATO DE ALQUILER & REMISIÓN DE DESPACHO (`ACTIVO`):**
   - Documento legal y operativo de entrega en obra.
   - Incluye conductor/vehículo asignado (`detallesLogistica`), fletes de transporte, fecha de inicio y fecha de devolución estimada por equipo.
   - Registra el valor del depósito en garantía recibido y el pagaré suscrito.
   - Incorpora cláusulas de custodia, responsabilidad por averías y horarios de corte de facturación (5:00 PM `America/Bogota`).

3. **CUENTA DE COBRO / LIQUIDACIÓN FINAL (`FINALIZADO` / `FACTURACION`):**
   - Documento fiscal y de cobro emitido tras la inspección física de retorno.
   - Incluye el subtotal de días reales contratados, costos adicionales por daños o averías (`costo_dano`), deducción del depósito entregado y el **Saldo Neto a Pagar en COP**.

## 2. Reglas de Diseño & CSS Print Estándar A4

- **Dimensiones:** Hoja A4 vertical (`210mm x 297mm`) con margen estándar de `12mm` a `15mm`.
- **Paleta Corporativa:**
  - Primario / Acentos: Azul Petróleo `#0284c7` y Azul Marino Profundo `#0f172a`.
  - Bordes y Separadores: `#e2e8f0` y `#cbd5e1`.
  - Fondos de Tablas y Cajas: `#f8fafc` y `#f0f9ff`.
  - Resaltados de Totales: Negrita 900 con formato de moneda `$ XX.XXX,00 COP`.
- **Integridad de Renglones:**
  - **NUNCA** truncar o resumir los ítems del contrato. El 100% de los equipos contratados deben aparecer con sus fechas individuales de inicio y fin, cantidad, peso y subtotal.
- **Micro-Tipografía y Cero Fugas de Memoria:**
  - Renderizado HTML/CSS optimizado para streaming serverless e impresión directa (`window.print()` / PDF export).
