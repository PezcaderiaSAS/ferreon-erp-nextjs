# Sistema de Diseño y Tokens: FerreOn ERP & AppFrios Pezca (DESIGN.md)

Este documento define la especificación canónica en texto plano de tokens de diseño, tipografía, espaciado, componentes e interacciones de acuerdo con el estándar [DESIGN.md](https://github.com/voltagent/awesome-design-md), las directrices de [VP0 / Untitled UI Alternative](https://github.com/vp0), [Refero Design](https://refero.design), [Open Design](https://github.com/nexu-io/open-design) y los sistemas de diseño de alta gama de [streamich/awesome-styleguides](https://github.com/streamich/awesome-styleguides).

---

## 1. Visión Estética Canónica: Corporate Clean & Modern Enterprise (Anti-AI-Slop)

FerreOn ERP unifica su identidad bajo una estética limpia, corporativa y funcional inspirada en **Untitled UI** y **Stripe**:
1. **Fondos Limpios y Superficies Nítidas:** El lienzo general opera sobre un fondo gris tenue (`bg-slate-50`) con tarjetas y contenedores en blanco puro (`bg-white`) delimitados por bordes precisos de 1px (`border-slate-200`). Se eliminan brillos fluorescentes artificiales o sombras oscuras excesivas (*anti-ai-slop*).
2. **Elevaciones Sutiles:** Sombras de baja dispersión (`shadow-sm` y `shadow-md`), reservando elevaciones mayores únicamente para modales emergentes y dropdowns flotantes.
3. **Ergonomía de Datos:** Densidad de información equilibrada, con inputs de 40px (`h-10`), padding uniforme y micro-interacciones táctiles ágiles (`transition-colors duration-150`).
4. **Gobernanza Institucional Centralizada:** La empresa define la paleta corporativa activa mediante `EmpresaConfig` en el store institucional.

---

## 2. Tríada de Paletas de Color Institucionales

La aplicación soporta tres identidades corporativas conmutables mediante el atributo `data-theme` en el contenedor raíz:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TRÍADA INSTITUCIONAL                           │
├──────────────────────┬─────────────────────────┬───────────────────────┤
│ 1. salmon-pastel     │ 2. cyber-cyan           │ 3. monochrome         │
│ (Predeterminada)     │ (Industrial / Marítima) │ (Minimalismo B2B)     │
│ Rosa Salmonado Pastel│ Cyber Cyan & Steel Blue │ Neutral Slate/Zinc    │
└──────────────────────┴─────────────────────────┴───────────────────────┘
```

### Paleta 1: Rosa Salmonado Pastel (`[data-theme="salmon-pastel"]` / `:root`) - Predeterminada
Identidad moderna, cálida y de alta legibilidad, diseñada para reducir la fatiga visual en jornadas de facturación continuas.
- `--brand-base`: `#FF8A65`
- `--color-primary-50`: `hsl(16, 100%, 97%)` (`#FFF3F0`)
- `--color-primary-100`: `hsl(14, 100%, 92%)` (`#FFE4DC`)
- `--color-primary-500`: `hsl(14, 90%, 65%)` (`#FF8A65`) — Primario corporativo
- `--color-primary-600`: `hsl(14, 85%, 55%)` (`#F4683E`) — Estado hover
- `--color-primary-700`: `hsl(14, 80%, 46%)` (`#D94C24`) — Estado active / focus ring
- `--color-bg-base`: `hsl(210, 20%, 98%)` (`#F8FAFC` - Slate 50)
- `--color-bg-surface`: `hsl(0, 0%, 100%)` (`#FFFFFF`)
- `--color-border`: `hsl(214, 32%, 91%)` (`#E2E8F0` - Slate 200)

### Paleta 2: Cyber Cyan & Steel Blue (`[data-theme="cyber-cyan"]`)
Identidad corporativa técnica e industrial, ideal para la operación pesquera y de cadena de frío de Fríos Pezca.
- `--brand-base`: `#0EA5E9`
- `--color-primary-50`: `hsl(204, 100%, 97%)` (`#F0F9FF`)
- `--color-primary-100`: `hsl(204, 94%, 94%)` (`#E0F2FE`)
- `--color-primary-500`: `hsl(199, 89%, 48%)` (`#0EA5E9`) — Primario corporativo
- `--color-primary-600`: `hsl(200, 98%, 39%)` (`#0284C7`) — Estado hover
- `--color-primary-700`: `hsl(201, 96%, 32%)` (`#0369A1`) — Estado active
- `--color-bg-base`: `hsl(210, 20%, 98%)` (`#F8FAFC`)
- `--color-bg-surface`: `hsl(0, 0%, 100%)` (`#FFFFFF`)
- `--color-border`: `hsl(214, 32%, 91%)` (`#E2E8F0`)

### Paleta 3: Neutral Monochrome (`[data-theme="monochrome"]`)
Estética monocromática de alta gama y máxima sobriedad para administración ejecutiva y auditoría (estilo Linear / Vercel).
- `--brand-base`: `#18181B`
- `--color-primary-50`: `hsl(240, 5%, 96%)` (`#F4F4F5`)
- `--color-primary-100`: `hsl(240, 6%, 90%)` (`#E4E4E7`)
- `--color-primary-500`: `hsl(240, 5.9%, 10%)` (`#18181B`) — Primario corporativo
- `--color-primary-600`: `hsl(240, 4%, 16%)` (`#27272A`) — Estado hover
- `--color-primary-700`: `hsl(240, 5%, 26%)` (`#3F3F46`) — Estado active
- `--color-bg-base`: `hsl(220, 14%, 96%)` (`#F1F5F9`)
- `--color-bg-surface`: `hsl(0, 0%, 100%)` (`#FFFFFF`)
- `--color-border`: `hsl(240, 6%, 86%)` (`#D4D4D8`)

### Feedback Semántico Universal (Común a todos los temas)
- `--color-success`: `hsl(142, 71%, 45%)` (Verde Esmeralda - Liquidado / Aprobado)
- `--color-warning`: `hsl(38, 92%, 50%)` (Ámbar - Pendiente / Por Vencer)
- `--color-danger`: `hsl(0, 84%, 60%)` (Rojo Coral - Vencido / Anulado / Error)
- `--color-info`: `hsl(199, 89%, 48%)` (Azul Celeste - Información Operativa)

---

## 3. Gobernanza Tipográfica Canónica

Se eliminan fuentes decorativas obsoletas (`Outfit`, `Calistoga`, `Roboto`). El sistema se estandariza exclusivamente en dos familias tipográficas con `display: swap`:

1. **Fuente de Lectura, Controles y Titulares:** `Inter`, `system-ui`, `-apple-system`, `sans-serif`
   - Pesos:
     - `400 (Regular)`: Textos descriptivos, párrafos y labels estándar.
     - `500 (Medium)`: Controles de formulario, badges y opciones de menú.
     - `600 (SemiBold)`: Encabezados de sección, botones principales y títulos de tarjetas.
     - `700 (Bold)`: Títulos principales (`h1`, `h2`) y métricas clave.

2. **Fuente de Cifras y Datos Técnicos:** `JetBrains Mono`, `monospace`
   - Se utiliza obligatoriamente con la clase `tabular-nums` para:
     - Precios monetarios en Pesos Colombianos (`$ COP`).
     - Pesajes en báscula (Gramos / Kilogramos).
     - Números de documento (Facturas, Devoluciones, NIT/Cédulas, Códigos SKU).

### Escala Tipográfica Relativa
- `text-xs`: `0.75rem (12px)` | `line-height: 1rem`
- `text-sm`: `0.875rem (14px)` | `line-height: 1.25rem` (Estándar de inputs y tablas)
- `text-base`: `1rem (16px)` | `line-height: 1.5rem` (Estándar móvil para evitar zoom)
- `text-lg`: `1.125rem (18px)` | `line-height: 1.75rem`
- `text-xl`: `1.25rem (20px)` | `line-height: 1.75rem` (Títulos de tarjeta)
- `text-2xl`: `1.5rem (24px)` | `line-height: 2rem` (Títulos de vista)
- `text-3xl`: `1.875rem (30px)` | `line-height: 2.25rem` (Métricas de dashboard)

---

## 4. Adaptabilidad Multi-Dispositivo Universal (Móviles, Tablets, Desktop)

El sistema está optimizado para garantizar paridad operativa idéntica en:
- **Teléfonos Móviles (Android / iPhone Safari):**
  - **Inputs `font-size: 16px` en móvil:** Previene el zoom involuntario y distorsionante del viewport en iOS Safari al enfocar campos de texto.
  - **Touch Targets de 44px Mínimo:** Todos los botones, checkboxes y selectores interactivos tienen un área de pulsación de al menos `44x44px` (`min-h-[44px]` o padding ergonómico en móvil).
  - **Soporte de Safe Areas:** Uso de `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)` y `env(safe-area-inset-right)` para evitar solapamientos con notches e islas dinámicas.
  - **Desactivación de Tap Highlight y Retardo:** `touch-action: manipulation` y `-webkit-tap-highlight-color: transparent` para una respuesta táctil instantánea sin los 300ms de retardo típicos del navegador.
- **Tablets y Pantallas Plegables:**
  - Layouts adaptativos de 2 columnas (`md:grid-cols-2`) para inspección de bodega y recepción en muelle.
- **Escritorio & Mostrador POS (Windows / macOS):**
  - Altura compacta y eficiente de inputs (`h-10` / 40px).
  - Navegación ágil por teclado (`Tab`, `Enter`, `Escape`) y tooltips contextuales.

---

## 5. Espaciado, Layout & Sombras (Untitled UI Standard)

- **Grid Base:** Múltiplos de 4px / 8px (`p-2: 8px`, `p-3: 12px`, `p-4: 16px`, `p-6: 24px`, `p-8: 32px`).
- **Bordes de Contenedores:** `border border-slate-200 dark:border-slate-800`.
- **Radio de Esquinas:**
  - Controles (`Input`, `Select`, `Button`): `rounded-lg` (8px).
  - Tarjetas y Contenedores: `rounded-xl` (12px).
  - Modales de Sistema: `rounded-2xl` (16px).
- **Elevaciones Sutiles:**
  - `shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Tarjetas y tablas de contenido).
  - `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.04)` (Dropdowns).
  - `shadow-xl`: `0 20px 25px -5px rgb(0 0 0 / 0.1)` (Modales y drawers).

---

## 6. Estándares de Componentes Críticos

1. **Botones (`Button`):**
   - Altura estándar de 40px (`h-10`) en escritorio, 44px en pantallas táctiles (`sm:h-10 min-h-[44px]`).
   - Soporte obligatorio para estado `isLoading` con spinner SVG sin alterar el ancho del botón.
   - Prevención física de doble click (`disabled:pointer-events-none disabled:opacity-50`).
2. **Tablas de Datos (`DataTable`):**
   - Alineación numérica estricta a la derecha para valores monetarios y cantidades.
   - En pantallas móviles (< 640px), soporte automático para vista compacta tipo tarjeta (*Card List*).
3. **Formularios Modulares (Patrón Stepper / Wizard):**
   - Validación reactiva por pasos con esquemas Zod.
   - Guardado seguro en memoria local o estado persistente para evitar pérdida de datos durante caídas de conexión.
