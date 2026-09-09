<!-- Generated: 2026-09-09 | Files scanned: ~35 | Token estimate: ~720 -->
# Frontend Architecture

## Page Tree (`src/app/`)
- `/alquileres`: Dashboard de contratos, wizard de nuevo alquiler con atajo F2 y rango maestro de fechas, menú contextual, emisión directa de PDFs y calculadora de colaterales. Hidratación resiliente con `Promise.allSettled`.
- `/admin/empresas`: Panel de control UltraAdmin multi-tenant para supervisión global de tenants y usuarios.
- `/configuracion`: Datos fiscales, logo corporativo con compresión canvas (<150KB), paleta de colores WCAG AA y usuarios.
- `/bodega`: Panel de inventario, Kardex visual y ajustes Poka-Yoke de stock (`EditarEquipoModal.tsx`). Sincronización optimizada con `useCallback([setEquipos])`.
- `/caja`: Gestión de turnos, apertura, cierres de caja y arqueo de efectivo.
- `/clientes`: Directorio de clientes con reconciliación estabilizada vía `useCallback([setClientes])`.
- `/devoluciones`: Wizard Poka-Yoke interactivo para el reingreso parcial/total de equipos.
- `/facturacion`: Visualización de cuentas por cobrar.

## Components (`src/components/` & `src/app/components/`)
- `ui/EquipoCombobox.tsx`: Buscador typeahead de maquinaria accesible (WAI-ARIA 1.2), navegación por teclado (`↑/↓/Enter/Esc`), normalización de texto, badges de stock y colisión con umbral ergonómico (220px). Popover `z-[100]`, fondo sólido `bg-white dark:bg-slate-900`, `min-w-[300px] sm:min-w-[420px]` y `max-h-[340px] sm:max-h-[380px]` para 10 ítems visibles con evento `onOpenChange`.
- `forms/AlquilerForm.tsx`: Formulario en 3 pasos con Rango Maestro de Fechas en Paso 1, propagación en cascada a filas, atajo global `F2` (`addItemRow` con `useCallback`), elevación dinámica de apilamiento (`openComboboxRowId` eleva la fila activa a `zIndex: 100` con `border-teal-500 shadow-xl`), `pb-36` de holgura en `#items-scroll-area`, colateral mínimo (10%) y densidad para 10 ítems.
- `pdf/ContratoAlquilerPDF.tsx`: Documento vectorial `@react-pdf/renderer` con logo responsivo (`<Image />`), supresión limpia de reglas jsx-a11y y formatos Letter/A5.
- `bodega/EditarEquipoModal.tsx`: Control de Stock UI con motivo de ajuste obligatorio (Delta).
- `cartera/RegistrarPagoModal.tsx`: Calculadora de Vueltas para pagos en EFECTIVO.
- `devoluciones/NeuDevolucionWizard.tsx`: Wizard paso a paso para devolución de equipos.

## State Management (`src/infrastructure/state/`)
- `alquilerStore.ts`: Estado local y sanitización de contratos.
- `empresaStore.ts`: Estado reactivo y persistencia local de identidad de marca y logo.
- `bodegaStore.ts`: Estado local de equipos y control de stock (`EquipoUI`).
- `clienteStore.ts`: Catálogo de clientes activos.
- `ledgerStore.ts`: Transacciones contables y pagos.
