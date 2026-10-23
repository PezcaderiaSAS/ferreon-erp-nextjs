# Plan Arquitectónico: SPEC-013
## Módulo de Firma Digital Touch en Pantalla para el Cliente

---

### 1. Arquitectura Técnica y Separación de Capas

```text
[Cliente / Pantalla Táctil]
       │
       ▼ (Eventos touch/pointer / DPR retina)
[FirmaTouchCanvas.tsx] ────► [FirmaTouchPadModal.tsx]
                                    │
                                    ▼ (Base64 PNG ~20KB)
                     [guardarFirmaClienteAlquilerAction]
                                    │
                                    ▼ (Supabase / Invalidation)
                   [alquileres.firma_cliente_base64]
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
[ContratoAlquilerPDF.tsx]                          [EnterprisePDFService]
(Lado Cliente: Acepto a Satisfacción)             (HTML / Impresión / Media Carta A5)
```

### 2. Contratos y Esquemas (Zod)
- `src/core/domain/schemas/firmaClienteSchemas.ts`:
  - `GuardarFirmaClienteInputSchema`:
    - `alquilerId`: `z.union([z.string().min(1), z.number().int().positive()])`
    - `firmaBase64`: `z.string().regex(/^data:image\/(png|webp);base64,/, "Formato de firma inválido").max(500 * 1024)`
    - `clienteNombre`: `z.string().optional()`
    - `clienteNit`: `z.string().optional()`

### 3. Servicio de Dominio Puro
- `src/core/services/firma-digital.service.ts`:
  - `validarFirmaBase64(base64: string): { valida: boolean; error?: string; bytesAprox?: number }`
  - `generarEstampaLegalCliente(clienteNombre: string, nit: string, fecha?: Date): string`
  - `formatearFechaLegal(fecha?: Date): string`

### 4. Componente Canvas Táctil
- `src/components/common/FirmaTouchCanvas.tsx`:
  - Ancho reactivo y escalado mediante `ResizeObserver`.
  - Configuración de `lineWidth` (2.5px), `lineCap: 'round'`, `lineJoin: 'round'`, color de tinta `#0f172a` (Slate 900).
  - Trazado con `PointerEvent` para soporte universal (Touch, Stylus/Apple Pencil, Mouse).
  - Detección de canvas vacío mediante contador de trazos/puntos para validación Poka-Yoke.

### 5. Integración en Documentos PDF
- `ContratoAlquilerPDF.tsx`:
  - Renderizado condicional de `Image` en la casilla `sigBox` del Cliente / Receptor.
  - Leyenda de firma touch con fecha/hora de certificación.
- `pdf-factura-generator.service.ts`:
  - Renderizado condicional de `<img>` con clase `sig-cliente-img` en la plantilla HTML para visualización e impresión.
