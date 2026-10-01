# Blueprint de Arquitectura y Componentes para Figma — Alquileres System

**Documento Maestro de Diseño para Figma / Penpot**  
**Versión**: 1.0.0 Canónica  
**Basado en**: Producción Vercel (`alquileres-erp-nextjs-ruby.vercel.app`) + `DESIGN.md` + `stitch.json`  
**Archivo de Tokens Asociado**: [`figma_design_tokens.json`](file:///c:/Users/Personal/Documents/FRIOSPEZCADERIA/FerreOn/ferreon-erp-nextjs/figma_design_tokens.json)

---

## 1. Frame Maestro de Aplicación (App Shell)

```
┌────────────────────────────────────────────────────────────────────────┐
│                              APP SHELL                                 │
├───────────────┬────────────────────────────────────────────────────────┤
│ SIDEBAR       │ TOPNAV (H: 64px, Sticky, border-b: #E2E8F0)            │
│ (W: 256px     │  [Menu Toggle] [Search (W: 320px)] [Caja Badge] [User] │
│  Expanded     ├────────────────────────────────────────────────────────┤
│  W: 64px      │ MAIN CANVAS (bg: #F8FAFC, padding: 24px)               │
│  Collapsed)   │                                                        │
│               │  [Page Header: Title + Action Buttons]                 │
│  [Logo Brand] │  [KPI Metric Cards Grid (1 to 4 cols)]                 │
│  [Navigation] │  [Interactive Filters / Tabs]                          │
│  [Trial Card] │  [DataGrid Table / Card List Responsive]               │
│  [User Pill]  │                                                        │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Anatomía de Componentes de las 8 Pantallas Principales

### 2.1 `/dashboard` — Panel de Control y Operaciones
- **KPI Metrics Cards (AutoLayout Horizontal, Gap: 20px)**:
  - Tarjeta 1: Equipos Alquilados (Icono: Box, Valor: `124`, Delta: `+5%`).
  - Tarjeta 2: Contratos Activos (Icono: FileText, Valor: `45`, Delta: `Estable`).
  - Tarjeta 3: Devoluciones Pendientes (Icono: Clock, Valor: `12`, Tag: `Requiere atención`).
- **Recent Activity Table (AutoLayout Vertical, Border: 1px Slate 200, Radius: 16px)**:
  - Columnas: Contrato (`#ALQ-089`), Cliente (`Constructora Omega`), Equipo (`Retroexcavadora`), Estado (`Pill: Activo`), Fecha (`Hace 2h`).
- **Modal de Términos (Width: 640px, Radius: 20px, Shadow: Modal)**:
  - Header: Escudo de seguridad + Título *Actualización Obligatoria de Términos v1.0.0*.
  - Body: Párrafos legales + 2 bullets explicativos (Supervisión Humana + RLS).
  - Footer: Checkbox bajo juramento + Botón primario (`disabled` hasta marcar checkbox).

---

### 2.2 `/alquileres` — Cotizaciones Comerciales y Contratos de Obra
- **Banner del Ciclo de Vida (AutoLayout Horizontal, 4 Fases conmutables)**:
  - `Fase 1: Cotizar`: Propuesta comercial sin reserva de stock.
  - `Fase 2: Formalizar`: 1-Clic Poka-Yoke hacia contrato vinculante.
  - `Fase 3: En Obra`: Maquinaria en posesión del cliente, causación diaria.
  - `Fase 4: Devolución`: Recepción, Split-Line y conciliación de garantías.
- **Pestañas Superiores (Tab Bar)**:
  - `Cotizaciones Activas (12)` | `Contratos en Obra (8)` | `Historial y Finalizados (4)`.
- **Botón de Acción Primaria**: `Nueva Cotización / Nuevo Contrato` (bg: `#0f766e` / `#FF8A65`).

---

### 2.3 `/bodega` — Inventario, SKU y Disponibilidad
- **Barra de Métricas**:
  - `Total Equipos (68 modelos)` | `Stock Disponible (27.101 un.)` | `Stock en Obra (3.310 un.)`.
- **Search & Filter Bar**:
  - Input con icono Search (`id: bodega-search-input`) + Pills: *Todos*, *Disponibles*, *En Obra*, *Mantenimiento*.
- **Modal Alta de Equipo (`BodegaForm`)**:
  - SKU (Autogenerado, Font: Mono, bg: `#FFF3F0`), Categoría (Dropdown), Nombre (Input), Tarifa Diaria (`tabular-nums`), Valor Reposición (bg: `#FEF3C7`), Stock Inicial (bg: `#ECFDF5`).

---

### 2.4 `/compras` — Recepción Física, PMP y Proveedores
- **Indicadores Financieros**:
  - Inversión Facturada (`$ COP`), Neto Desembolsado, Pendientes de Recepción, Equipos Ingresados.
- **Directorio de Proveedores**:
  - Tabla de 6 columnas con NIT, Contacto, Ubicación, Días Crédito (Tag: *Contado* vs *15 días*) y Estado (*ACTIVO*).

---

### 2.5 `/subcontrataciones` — Re-Alquiler y Tercerización
- **Widget de Rentabilidad**:
  - Costo Aliados Activo (`$ COP`) vs Cobro Cliente = Margen Proyectado (`%` y `$`).
- **Modal Registrar Orden de Tercerización**:
  - Selector de Proveedor Aliado + Switch de vinculación a Contrato de Alquiler existente.
  - Selectores de fecha (Recepción / Devolución) con cálculo automático de días.
  - Input dinámico de ítems: Descripción, Cantidad, Costo Diario Aliado.

---

### 2.6 `/devoluciones` — Inspección Técnica, Split-Line y Liquidación
- **Modal Crítico: Inspección Técnica & Split-Line (Width: 840px)**:
  - Cabecera: Contrato `#32` — Cliente: `LUZ YAMILE CASTELLANOS`.
  - Lista de Equipos en Obra con selector numérico de retorno parcial (*Split-Line*).
  - Toggles de Estado por Ítem: `Buen Estado` (Verde) | `Daño / Mantenimiento` (Ámbar) | `Pérdida / Extraviado` (Rojo).
  - Panel Financiero en Vivo: Depósito Inicial ($1.000.000) - Alquiler Causado ($63.120) = **Saldo Reembolso: $936.880 COP**.
  - Alerta Poka-Yoke: Detecta si caja física está cerrada y desactiva efectivo, sugiriendo transferencia.

---

### 2.7 `/clientes` — Directorio y Ficha 360°
- **DataGrid de Clientes**:
  - Avatar circular con iniciales generadas (ej. `AD`, `AL`, `BR`), Razón Social, NIT, Teléfono, Nivel de Riesgo (*Bajo* / *Medio* / *Alto*).
- **Drawer Lateral (Ficha 360°, Width: 480px, Slide-Over)**:
  - Pestañas: Datos de Contacto, Contratos Activos, Historial de Pagos, Saldo Pendiente.

---

### 2.8 `/configuracion` — Gobierno Institucional y RBAC
- **Sub-vistas**:
  - `Datos de la Empresa`: Logo en Base64, Razón Social, Selector de Paleta (Salmon vs Cyber Cyan vs Monochrome).
  - `Usuarios y Accesos`: Tarjetas de usuario con avatar Dicebear, rol institucional y botones de edición. Detección defensiva de cuenta propia (`TÚ`) bloqueando auto-eliminación.
  - `Auditoría y Seguridad RBAC`: Bitácora inmutable append-only con bloqueo perimetral a usuarios no-SuperAdmin.

---

## 3. Matriz de Estados de Interacción para Componentes en Figma

| Componente | Default | Hover | Focus / Active | Disabled / Loading |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Button** | bg: `primary500`, text: white | bg: `primary600`, scale: 100% | bg: `primary700`, scale: 98% | opacity: 50%, pointer-events: none, SVG spinner |
| **Secondary Button**| bg: `white`, border: `slate200` | bg: `slate100`, text: `slate900`| bg: `slate200`, scale: 98% | opacity: 50%, text: `slate400` |
| **Input / Select** | bg: `white`, border: `slate300` | border: `slate400` | border: `primary500`, ring: 2px | bg: `slate50`, text: `slate400` |
| **Status Badge** | bg: `color-50`, text: `color-700` | brightness: 95% | ring: 1px | opacity: 40% |
| **Glass Card** | bg: `white/95`, blur: 12px | shadow: md, -1px translate | ring: 1px `slate200` | - |
