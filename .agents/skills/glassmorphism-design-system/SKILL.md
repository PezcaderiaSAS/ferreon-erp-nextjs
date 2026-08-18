---
name: glassmorphism-design-system
description: Sistema de diseño UI/UX Glassmorphism con Tailwind CSS, translucidez, bordes de cristal, resplandores neon y animaciones.
---

# Sistema de Diseño Glassmorphism UI/UX (`alquileres_app`)

## 1. Reglas Estéticas Fundamentales
1. **Fondo Translúcido con Desenfoque (Backdrop Blur):** Los paneles deben utilizar fondos con opacidad reducida (`bg-slate-900/60` o `bg-slate-950/70`) combinados con desenfoque de fondo (`backdrop-blur-md` o `backdrop-blur-xl`).
2. **Bordes de Cristal (Glass Borders):** Bordes sutiles y elegantes en blanco transparente (`border border-white/10` o `border-slate-800/80`).
3. **Resplandores Neon de Fondo (Glow Orbs):** Elementos circulares con gradientes de color (celeste, cian, esmeralda, índigo) con `blur-3xl` situados detrás de los páneles para simular luz ambiental.
4. **Sombras Profundas (Deep Shadows):** Uso de sombras `shadow-2xl` y sombras de color (`shadow-sky-500/20`).
5. **Micro-animaciones Táctiles:** Efectos hover con `hover:-translate-y-0.5`, `transition-all duration-300` y estados activos `active:scale-95`.

## 2. Clases CSS de Utilidad Recomendadas (`src/app/globals.css`)
```css
.glass-panel {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

.glass-button-primary {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 25px rgba(2, 132, 199, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-button-primary:hover {
  background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
  box-shadow: 0 12px 30px rgba(56, 189, 248, 0.45);
  transform: translateY(-2px);
}
```
