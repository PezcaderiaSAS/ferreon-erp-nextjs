# Design System: FerreOn ERP (Glassmorphism)

## 1. Visión Estética
El ERP debe sentirse como una aplicación premium, moderna y vibrante, abandonando el estilo aburrido tradicional de los sistemas corporativos. Utilizaremos **Glassmorphism**, combinando fondos oscuros y translúcidos, bordes de cristal y resplandores neón para generar una experiencia táctil y profunda.

## 2. Reglas Estéticas Fundamentales
1. **Fondo Translúcido con Desenfoque (Backdrop Blur):** Los paneles deben utilizar fondos con opacidad reducida (`bg-slate-900/60` o `bg-slate-950/70`) combinados con desenfoque de fondo (`backdrop-blur-md` o `backdrop-blur-xl`).
2. **Bordes de Cristal (Glass Borders):** Bordes sutiles y elegantes en blanco transparente (`border border-white/10` o `border-slate-800/80`).
3. **Resplandores Neon de Fondo (Glow Orbs):** Elementos circulares con gradientes de color (celeste, cian, esmeralda, índigo) con `blur-3xl` situados detrás de los páneles para simular luz ambiental.
4. **Sombras Profundas (Deep Shadows):** Uso de sombras `shadow-2xl` y sombras de color (`shadow-sky-500/20`).
5. **Micro-animaciones Táctiles:** Efectos hover con `hover:-translate-y-0.5`, `transition-all duration-300` y estados activos `active:scale-95`.
6. **Responsividad Móvil (Mobile-First):** Componentes táctiles deben medir al menos `44x44px`. En móviles (< 640px), las tablas deben transformarse en "Card Views".

## 6. Design System Notes for Stitch Generation
> [!NOTE] 
> Copia este bloque en los prompts de Stitch.

**DESIGN SYSTEM (REQUIRED):**
- **Theme:** Dark Mode Glassmorphism.
- **Colors:** Deep Slate/Navy backgrounds (`bg-slate-950`). Accents in Cyan (`#06b6d4`), Sky Blue (`#0ea5e9`), and Emerald (`#10b981`).
- **Typography:** Modern Sans-Serif (Inter, Roboto, or Outfit). White/gray text with high contrast.
- **Containers/Panels:** Use Glassmorphism. Background `rgba(15, 23, 42, 0.65)` with `backdrop-filter: blur(16px)`, border `1px solid rgba(255, 255, 255, 0.1)`, and `box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4)`.
- **Buttons:** Gradient backgrounds (e.g. `linear-gradient(135deg, #0284c7 0%, #0369a1 100%)`), subtle borders, glowing box shadows. Add micro-animations on hover (translate-y, brighter gradient).
- **Backgrounds:** Add large, highly blurred (`blur-3xl`) circular orbs of color (cyan, purple, blue) fixed behind the main content to create a neon ambient glow.
- **Layout:** SPA Tab-like navigation. Mobile views must use card-based layouts instead of tables. Touch targets must be large and accessible.
