<!-- Generated: 2026-09-08 | Files scanned: ~25 | Token estimate: ~550 -->
# Frontend Architecture

## Page Tree (`src/app/`)
- `/alquileres`: Dashboard de contratos, wizard de nuevo alquiler, menú de acciones contextual con filtro de edición y emisión directa de PDFs.
- `/configuracion`: Datos fiscales, logo corporativo con compresión canvas (<150KB), paleta de colores WCAG AA y usuarios.
- `/bodega`: Panel de inventario, Kardex visual y ajustes Poka-Yoke de stock (`EditarEquipoModal.tsx`).
- `/caja`: Gestión de turnos, apertura, cierres de caja y arqueo de efectivo.
- `/devoluciones`: Wizard Poka-Yoke interactivo para el reingreso parcial/total de equipos.
- `/facturacion`: Visualización de cuentas por cobrar.

## Components (`src/components/` & `src/app/components/`)
- `forms/AlquilerForm.tsx`: Formulario de contratos con bloqueo Read-Only de cliente en edición (*Poka-Yoke*), fallbacks resilientes y validación de colateral (10%).
- `pdf/ContratoAlquilerPDF.tsx`: Documento vectorial `@react-pdf/renderer` con logo responsivo (`<Image />`), guarda `tieneLogoValido` y formatos Letter/A5.
- `bodega/EditarEquipoModal.tsx`: Control de Stock UI con motivo de ajuste obligatorio (Delta).
- `cartera/RegistrarPagoModal.tsx`: Calculadora de Vueltas para pagos en EFECTIVO.
- `devoluciones/NeuDevolucionWizard.tsx`: Wizard paso a paso para devolución de equipos.

## State Management (`src/infrastructure/state/`)
- `alquilerStore.ts`: Estado local y sanitización de contratos.
- `empresaStore.ts`: Estado reactivo y persistencia local de identidad de marca y logo.
- `bodegaStore.ts`: Estado local de equipos y control de stock.
- `clienteStore.ts`: Catálogo de clientes activos.
- `ledgerStore.ts`: Transacciones contables y pagos.
