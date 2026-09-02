# Estándares de Diseño UI/UX y Gobernanza Visual

Cualquier componente visual, página web o interfaz creada o modificada en este proyecto DEBE cumplir estrictamente con los siguientes mandamientos de diseño:

1. **Tokens Centralizados Obligatorios (DESIGN.md):** 
   - Prohibido utilizar colores hexadecimales o valores en píxeles hardcodeados en el CSS/JSX.
   - Siempre referenciar las variables semánticas definidas en `DESIGN.md` (ej. `var(--color-primary-600)`, `var(--space-4)`).

2. **Ground Truth de Sistemas de Diseño (Awesome Styleguides & Penpot):**
   - Para patrones complejos (tablas de datos, formularios multi-paso, navegación), basar la implementación en las mejores prácticas de producción de Shopify Polaris, GitHub Primer o Radix UI.
   - Usar layouts nativos basados en Flexbox / CSS Grid con espaciados proporcionales y Mobile-First.

3. **Utilidades Visuales de Alta Calidad (UI Tools):**
   - Aplicar sombras difusas multicapa (`--shadow-md`, `--shadow-lg`) y efectos de elevación o glassmorphism (`backdrop-filter`) para crear interfaces con profundidad y sensación premium.

4. **Accesibilidad & Usabilidad (Awesome UI & Addy Osmani):**
   - Cumplir con WCAG 2.1 AA (contraste mínimo 4.5:1).
   - Incluir estados visuales completos: Default, Hover, Focus-Visible, Active, Disabled y Loading.
   - En cargas asíncronas, implementar **Skeleton Screens** en lugar de bloqueos de pantalla o spinners gigantescos.

5. **Micro-interacciones y Rendimiento Web:**
   - Toda transición interactiva debe ser acelerada por hardware (`transform`, `opacity`) con tiempos menores a 250ms (`--transition-normal`).
   - Evitar tareas bloqueantes en el hilo principal para asegurar un INP < 200ms y CLS < 0.1.
