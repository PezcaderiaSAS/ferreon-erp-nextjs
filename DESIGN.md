# Sistema de Diseño y Tokens: FerreOn ERP & AppFrios Pezca (DESIGN.md)

Este documento define la especificación canónica de tokens de diseño, tipografía, espaciado, componentes e interacciones de acuerdo con el estándar [DESIGN.md](https://github.com/voltagent/awesome-design-md), la visión de **Dark Mode Glassmorphism**, y las directrices de [ui-layouts/ui-tools](https://github.com/ui-layouts/ui-tools) y [streamich/awesome-styleguides](https://github.com/streamich/awesome-styleguides).

---

## 1. Visión Estética: Dark Mode Glassmorphism & Micro-interacciones

El ERP ofrece una experiencia táctil, moderna y vibrante, combinando fondos oscuros y translúcidos, bordes de cristal, resplandores neón y micro-interacciones aceleradas por GPU.

1. **Fondo Translúcido con Desenfoque (Backdrop Blur):** Los paneles utilizan fondos con opacidad reducida (`bg-slate-900/60` o `bg-slate-950/70`) con `backdrop-filter: blur(16px)` (`backdrop-blur-md` o `backdrop-blur-xl`).
2. **Bordes de Cristal (Glass Borders):** Bordes sutiles en blanco transparente (`border border-white/10` o `border-slate-800/80`).
3. **Resplandores Neón de Fondo (Glow Orbs):** Elementos circulares con gradientes de color (celeste, cian, esmeralda, índigo) con `blur-3xl` situados detrás de los paneles principales.
4. **Sombras Profundas (Deep Shadows):** Sombras multinivel `shadow-2xl` y sombras de color (`shadow-sky-500/20`).
5. **Micro-animaciones Táctiles:** Efectos hover con `hover:-translate-y-0.5`, `transition-all duration-300` y estados activos `active:scale-95`.
6. **Responsividad Móvil (Mobile-First):** Componentes táctiles de al menos `44x44px`. En pantallas móviles (< 640px), las tablas se transforman en "Card Views".

---

## 2. Tokens de Color (Paleta HSL Semántica)

### Marca & Primarios (Industrial Ferretero & Frío Polar)
- `--color-primary-50`: `hsl(210, 100%, 97%)`
- `--color-primary-100`: `hsl(210, 95%, 92%)`
- `--color-primary-500`: `hsl(215, 85%, 45%)` /* Azul Acero Industrial / FerreOn */
- `--color-primary-600`: `hsl(218, 90%, 38%)`
- `--color-primary-700`: `hsl(222, 85%, 28%)`
- `--color-accent-cyan`: `hsl(190, 90%, 48%)` /* Cyan Frío / AppFrios Pezca */

### Superficies & Neutros (Tema Claro y Oscuro)
- `--color-bg-base`: `hsl(220, 20%, 98%)` (Claro) | `hsl(222, 47%, 11%)` (Oscuro)
- `--color-bg-surface`: `hsl(0, 0%, 100%)` (Claro) | `hsl(217, 33%, 17%)` (Oscuro)
- `--color-bg-surface-elevated`: `hsl(210, 20%, 96%)` (Claro) | `hsl(215, 28%, 23%)` (Oscuro)
- `--color-border`: `hsl(214, 32%, 91%)` (Claro) | `hsl(217, 20%, 27%)` (Oscuro)

### Feedback Semántico
- `--color-success`: `hsl(142, 71%, 45%)`
- `--color-warning`: `hsl(38, 92%, 50%)`
- `--color-danger`: `hsl(0, 84%, 60%)`
- `--color-info`: `hsl(199, 89%, 48%)`

---

## 3. Tipografía

- **Fuente Primaria (UI & Body):** `Inter`, `system-ui`, `-apple-system`, `sans-serif`
- **Fuente de Encabezados (Display):** `Outfit`, `Inter`, `sans-serif`
- **Fuente Monoespaciada (Códigos & Datos):** `JetBrains Mono`, `Fira Code`, `monospace`

---

## 4. Elevaciones, Sombras & Efectos Visuales (ui-tools)

### Sombras Suaves Multinivel
- `--shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `--shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)`
- `--shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)`
- `--shadow-xl`: `0 20px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.06)`

### Glassmorphism (Efecto Cristal Translúcido)
```css
.glass-panel {
  background: hsla(217, 33%, 17%, 0.75);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid hsla(0, 0%, 100%, 0.12);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}
```

---

## 5. Estándares de Componentes Críticos

1. **Botones (`Button`):**
   - Soporte obligatorio para `isLoading` (spinner SVG animado sin descolocar el layout).
   - Prevención física de doble click (`pointer-events-none disabled:opacity-50`).
2. **Tablas de Datos (`DataTable`):**
   - Alineación numérica a la derecha para valores monetarios, pesajes y stocks.
   - Paginación o virtualización para listados mayores a 50 registros.
3. **Skeletons de Carga:**
   - Prohibido el uso de spinners globales que congelen toda la pantalla.
   - Usar cajas grises con gradiente shimmer en pulso continuo durante la carga asíncrona.
