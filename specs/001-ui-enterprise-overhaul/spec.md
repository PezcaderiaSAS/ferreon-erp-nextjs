# Especificación EARS: SPEC-001 Modernización UI/UX Nivel Enterprise (Linear Dark Glassmorphism)

## 1. Metadatos de la Especificación
- **ID**: SPEC-001
- **Título**: Modernización Visual Enterprise, Unificación de Tokens y Responsividad Líquida en Tarjetas Móviles
- **Módulo**: UI / UX Core & Design System (Alquileres System)
- **Autor / Rol**: `@planner` (Software Architect + Data Engineer inyectado desde Agency Agents)
- **Revisor / QA**: `@reviewer` (UI Finish-Gate Reviewer + QA Specialist)
- **Estado**: AUDITADA_FASE_1_COMPLETA
- **Fecha de Creación**: 2026-10-02

---

## 2. Contexto del Negocio y Diagnóstico de Auditoría Tridimensional

Tras la auditoría tridimensional realizada sobre el estado del frontend de **Alquileres System**:
1. **Capa de Tokens (Figma vs Código)**:
   - `figma_design_tokens.json` posee 33 tokens concentrados en temas claros (`theme-salmon-pastel` y `theme-cyber-cyan` con `bgCanvas: #F8FAFC`).
   - Existe una discrepancia con `stitch.json` y `DESIGN.md`, los cuales prescriben el tema oficial **Dark Mode Glassmorphism** con canvas `hsl(222, 47%, 11%)`, superficie `hsl(217, 33%, 17%)`, bordes `hsla(0, 0%, 100%, 0.12)` y `backdrop-blur(16px)`.
2. **Capa de Layout (Sidebar y TopNav)**:
   - `Sidebar.tsx` y `TopNav.tsx` tienen clases fijas `bg-white`, `text-slate-900` y `border-slate-200`, impidiendo la inmersión en modo oscuro de alta densidad estilo Linear/Raycast.
   - En `tailwind.config.ts`, los colores de `sidebar` están hardcodeados con valores hexadecimales planos (`#FFFFFF`, `#F8FAFC`, `#FFF4F1`).
3. **Capa de Tablas y Responsividad Móvil**:
   - `LinearDataTable.tsx` renderiza una estructura `<table>` fija dentro de un contenedor `overflow-x-auto`.
   - En dispositivos móviles (<768px), los operadores deben desplazarse horizontalmente para consultar estados, fechas y montos, violando la regla de interfaces líquidas de `AGENTS.md`.

---

## 3. Requisitos Funcionales en Sintaxis Formal EARS

### 3.1. Requisitos Ubicuos (Ubiquitous - Comportamiento Fundamental)
- **EARS-UBI-01**: El sistema DEBERÁ gobernar toda la interfaz bajo la paleta canónica **Linear / Raycast Dark Glassmorphism**, utilizando fondos Slate/Navy (`hsl(222, 47%, 11%)`), superficies translúcidas `rgba(15, 23, 42, 0.75)` con `backdrop-filter: blur(16px)` y bordes sutiles de 1px `rgba(255, 255, 255, 0.10)`.
- **EARS-UBI-02**: El sistema DEBERÁ representar todas las cifras monetarias en Pesos Colombianos ($ COP) y pesajes de equipos utilizando la tipografía tabular obligatoria `JetBrains Mono` con alineación numérica a la derecha y formato `tabular-nums`.
- **EARS-UBI-03**: El sistema DEBERÁ mantener sincronizados los 33 tokens canónicos de `figma_design_tokens.json` con las variables CSS de Next.js mediante el plugin local `figma-tokens-sync`.
- **EARS-UBI-04**: El módulo de Gobernanza UltraAdmin (`/admin/empresas`) DEBERÁ forzar un contenedor oscuro de alta densidad (**Dark Governance Cockpit**) con fondo base `bg-slate-950`, eliminando el choque de texto blanco sobre fondo claro, garantizando una relación de contraste superior a 7:1 (WCAG AAA) en títulos, tarjetas de métricas, banner DMCA y badges de tenants.

### 3.2. Requisitos Basados en Estados (State-driven - Comportamiento Continuo)
- **EARS-STA-01**: MIENTRAS el tema Dark Glassmorphism esté activo, el `Sidebar` y el `TopNav` DEBERÁN mantener una elevación visual con desenfoque de fondo (`backdrop-blur-md`), bordes translúcidos y estados interactivos hover con micro-transiciones suaves de 150ms.
- **EARS-STA-02**: MIENTRAS una tabla (`LinearDataTable`) se encuentre en estado de carga (`isLoading === true`), el sistema DEBERÁ renderizar esqueletos Shimmer compactos que preserven exactamente la geometría y dimensiones métricas de las filas.

### 3.3. Requisitos Guiados por Eventos (Event-driven - Disparadores)
- **EARS-EVE-01**: CUANDO el usuario interactúe con cualquier fila en `LinearDataTable` o tarjeta móvil, el sistema DEBERÁ destacar la selección con un borde luminoso Cyan (`#06b6d4` al 30%) y aplicar la acción primaria mediante la tecla `Enter` o click directo.
- **EARS-EVE-02**: CUANDO el usuario presione el atajo de teclado global `Ctrl+K` (o `Cmd+K`), el sistema DEBERÁ desplegar la Command Palette con desenfoque modal profundo y navegación rápida por teclado (flechas ↑/↓).

### 3.4. Requisitos de Comportamiento No Deseado (Unwanted Behavior - Casos Borde)
- **EARS-UNW-01**: SI la pantalla del dispositivo tiene un ancho inferior a 768px (viewport móvil), ENTONCES el sistema NO DEBERÁ generar barras de desplazamiento horizontal (`overflow-x-scroll`) en las vistas maestras de Alquileres, Cotizaciones o Inventario.
- **EARS-UNW-02**: SI un componente intenta inyectar un color hexadecimal plano no registrado en `figma_design_tokens.json` o `DESIGN.md`, ENTONCES el linter y la suite de pruebas DEBERÁN marcar una advertencia de consistencia de tokens.

### 3.5. Requisitos Opcionales y Adaptativos (Optional Features)
- **EARS-OPT-01**: DONDE el viewport sea menor a 768px (móviles y tablets pequeñas), el componente `LinearDataTable` DEBERÁ ocultar automáticamente la tabla rígida (`hidden md:table`) y renderizar una vista líquida de Tarjetas apiladas (**Cards Grid** `block md:hidden`), mostrando el consecutivo, cliente, estado en Badge semántico y acciones en menú contextual inferior.

---

## 4. Requisitos No Funcionales y Criterios de Aceptación (QA)
- **RNF-01 (Compatibilidad y Cero Regresiones)**: Las 396 pruebas existentes (`396/396 passing`) deben continuar pasando al 100% sin roturas en controladores ni Server Actions.
- **RNF-02 (Rendimiento Web Vitals)**: El desenfoque CSS (`backdrop-filter`) no debe generar caídas de frames (<60fps) ni penalizar el Largest Contentful Paint (LCP < 2.5s).
- **RNF-03 (Accesibilidad WCAG AA)**: La relación de contraste entre los textos secundarios (`text-white/60`) y el fondo navy profundo (`bg-slate-950`) debe superar el ratio mínimo de 4.5:1.
