# ADR-0001: Transición a Menú Lateral Desplegable Tipo Hamburguesa

**Date**: 2026-08-19  
**Status**: accepted  
**Deciders**: Equipo de Arquitectura y Desarrollo Frontend FerreOn  

## Context

En la versión previa del frontend SPA (`src/app/page.tsx`), las 8 pestañas principales de navegación (`Dashboard`, `Alquileres`, `Bodega e Inventario`, `Devoluciones`, `Facturación`, `Cartera & Pagos`, `Clientes & Terceros`, `Configuración Empresa`) estaban renderizadas en una barra horizontal en el encabezado superior (`<nav className="... overflow-x-auto ...">`).

Al crecer el número de módulos a 8, la barra horizontal producía un desbordamiento con barra de desplazamiento horizontal visible, comprometiendo la estética glassmorphism, la accesibilidad móvil y la usabilidad en pantallas estándar.

## Decision

Reemplazar la barra horizontal superior por un **Menú Lateral Desplegable (Collapsible Drawer) con Activador Tipo Hamburguesa** al lado izquierdo:
1. Un botón de alternancia (`Menu` / `X` de `lucide-react`) en el extremo izquierdo de la cabecera superior.
2. Un drawer lateral izquierdo con fondo glassmorphic (`bg-slate-950/95 backdrop-blur-2xl border-r border-white/10`) animado con CSS transitions (`translate-x-0` vs `-translate-x-full`).
3. Botón de cierre explícito `[X]` en la cabecera del sidebar y botón `[Ocultar Menú]` en el pie del sidebar.
4. Soporte para cierre por clic en el fondo difuminado (backdrop overlay) y mediante la tecla `Escape`.
5. Cierre automático del menú al hacer clic en cualquiera de los 8 módulos para maximizar el área de trabajo del usuario.
6. Indicador del módulo activo en el encabezado principal para mantener la orientación contextual en todo momento.

## Alternatives Considered

### Alternative 1: Barra horizontal con submenús desplegables (Dropdowns agrupados)
- **Pros**: Mantiene la navegación en la parte superior.
- **Cons**: Agrupación artificial de módulos que oculta el acceso rápido y requiere múltiples clics.
- **Why not**: Los módulos del ERP son operativos y de uso directo; la vista tipo drawer ofrece mayor jerarquía y visibilidad de badges de estado.

### Alternative 2: Sidebar fija permanente (Docked)
- **Pros**: Siempre visible en pantallas grandes.
- **Cons**: Resta 280px–320px de ancho a tablas densas (Inventario, Contratos, Facturación, Cartera) en laptops y pantallas de 1366x768.
- **Why not**: El drawer colapsable maximiza el espacio horizontal para el trabajo financiero y operativo del ERP.

## Consequences

### Positive
- Eliminación total de la barra de desplazamiento horizontal en el encabezado.
- Cabecera limpia y moderna con branding claro y botón de acción principal ("Nuevo Alquiler").
- Menú lateral espacioso con iconos, descripciones contextuales y badges numéricos reactivos en tiempo real.
- Interfaz 100% responsiva y amigable en resoluciones móviles, tablets y desktops.

### Negative / Trade-offs
- Se requiere un clic para abrir el menú si el usuario desea cambiar de módulo (mitigado por el indicador visual del módulo activo y el botón rápido de retorno "Volver").

### Risks & Mitigations
- **Riesgo**: Que el usuario olvide en qué pestaña está si el menú está cerrado.
- **Mitigación**: Se añadió un indicador de estado con el icono y nombre del módulo activo en la cabecera principal (`ActiveTabIcon` + `currentActiveTabInfo.label`).
