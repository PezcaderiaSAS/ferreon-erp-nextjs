---
name: react-pdf-generation
description: Generación serverless de PDFs con @react-pdf/renderer, 100% de inclusión de ítems y almacenamiento en Supabase Storage.
---

# Generación Serverless de PDFs (`alquileres_app`)

## 1. Regla Inviolable de Negocio
- **100% de Ítems en el PDF:** El documento PDF (Cuenta de Cobro / Factura / Contrato) MUST incluir la totalidad de los renglones contratados originalmente en `alquileres_detalle`, **sin filtrar ni ocultar** los ítems que tengan estado devuelto.

## 2. Generación en Memoria con @react-pdf/renderer
Los PDFs se renderizan directamente en la API Route serverless como un Stream/Buffer binario sin depender de instancias pesadas de navegador (Puppeteer/Chromium):

```typescript
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { FacturaDocumentoPdf } from "@/infrastructure/pdf/templates/factura-template";

export async function generarBufferPdf(facturaData: unknown): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <FacturaDocumentoPdf data={facturaData} />
  );
  return buffer;
}
```

## 3. Almacenamiento en Supabase Storage Bucket
- Los binarios generados se suben directamente al bucket `documentos-pdf`.
- La URL firmada resultante se almacena en `facturas_header.pdf_url`.
