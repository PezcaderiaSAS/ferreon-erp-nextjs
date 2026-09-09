<!-- Generated: 2026-09-09 | Files scanned: ~30 | Token estimate: ~650 -->
# Frontend Architecture

## Page Tree (`src/app/`)
- `/alquileres`: Dashboard de contratos, wizard de nuevo alquiler con atajo F2 y rango maestro de fechas, menú contextual, emisión directa de PDFs y calculadora de colaterales.
- `/admin/empresas`: Panel de control UltraAdmin multi-tenant para supervisión global de tenants y usuarios.
- `/configuracion`: Datos fiscales, logo corporativo con compresión canvas (<150KB), paleta de colores WCAG AA y usuarios.
- `/bodega`: Panel de inventario, Kardex visual y ajustes Poka-Yoke de stock (`EditarEquipoModal.tsx`).
- `/caja`: Gestión de turnos, apertura, cierres de caja y arqueo de efectivo.
- `/devoluciones`: Wizard Poka-Yoke interactivo para el reingreso parcial/total de equipos.
- `/facturacion`: Visualización de cuentas por cobrar.

## Components (`src/components/` & `src/app/components/`)
- `ui/EquipoCombobox.tsx`: Buscador typeahead de maquinaria accesible (WAI-ARIA 1.2), navegación completa por teclado, normalización de acentos, badges de stock y colisión de viewport con despliegue invertido inteligente para 10 ítems visibles.
- `forms/AlquilerForm.tsx`: Formulario de contratos en 3 pasos con Rango Maestro de Fechas en Paso 1, propagación automática en cascada a filas, atajo global `F2` con autofocus, bloqueo Read-Only en edición (*Poka-Yoke*), colateral mínimo (10%) y densidad visual para 10 ítems simultáneos.
- `pdf/ContratoAlquilerPDF.tsx`: Documento vectorial `@react-pdf/renderer` con logo responsivo (`<Image />`), guarda `tieneLogoValido` y formatos Letter/A5.
- `bodega/EditarEquipoModal.tsx`: Control de Stock UI con motivo de ajuste obligatorio (Delta).
- `cartera/RegistrarPagoModal.tsx`: Calculadora de Vueltas para pagos en EFECTIVO.
- `devoluciones/NeuDevolucionWizard.tsx`: Wizard paso a paso para devolución de equipos.

## State Management (`src/infrastructure/state/`)
- `alquilerStore.ts`: Estado local y sanitización de contratos.
- `empresaStore.ts`: Estado reactivo y persistencia local de identidad de marca y logo.
- `bodegaStore.ts`: Estado local de equipos y control de stock (`EquipoUI`).
- `clienteStore.ts`: Catálogo de clientes activos.
- `ledgerStore.ts`: Transacciones contables y pagos.
