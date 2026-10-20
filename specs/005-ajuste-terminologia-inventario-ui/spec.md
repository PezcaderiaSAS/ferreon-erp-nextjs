# Especificación EARS: SPEC-005 Ajuste de Terminología (Flota -> Inventario) y Blindaje Anti-Desbordamiento UI/UX

## 1. Contexto y Objetivos del Sistema
Alquileres System gestiona el alquiler de maquinaria, andamios, herramientas y equipos de construcción. El uso del término "Flota" induce a la confusión con vehículos automotores que no existen en el modelo de negocio de la plataforma. Adicionalmente, se identificaron defectos de desbordamiento horizontal y truncamiento de texto en pantallas con anchos estándar (1280px-1440px), específicamente en el badge de nivel del TopNav, las cifras de las tarjetas KPI y el contenedor principal de `AppShell`.

---

## 2. Requisitos Funcionales en Sintaxis EARS

### RF-01: Erradicación y Reemplazo Canónico de "Flota" por "Inventario"
- **Ubiquitous (General)**: El sistema DEBERÁ referirse al conjunto de maquinaria y equipos en alquiler bajo los términos "Inventario", "Stock de Alquiler" o "Equipos", eliminando la palabra "Flota".
- **State-driven (Estados)**: MIENTRAS el usuario visualice el Dashboard y sus tarjetas de KPI, el sistema DEBERÁ mostrar la tarjeta 01 como "INVENTARIO · 01" y "Utilización de Inventario" en lugar de "Utilización de Flota".
- **Event-driven (Eventos)**: CUANDO el usuario gane la insignia de recorrido de almacén en la Academia, el sistema DEBERÁ otorgar la insignia "Explorador de Inventario".

### RF-02: Badge de Academia y TopNav Anti-Truncamiento
- **State-driven (Estados)**: MIENTRAS el usuario esté en pantallas de resolución estándar o intermedia (laptop de 1024px a 1535px), el badge de TopNav DEBERÁ mostrar de forma concisa el icono, nivel y puntos (ej. "📦 Nivel 2 · 250 XP"), sin truncar el nombre con puntos suspensivos ("Operador de Bo...").
- **Optional (Configurable)**: DONDE la resolución de pantalla sea ultra ancha (>= 1536px / 2xl), el sistema DEBERÁ mostrar el nombre del rango completo sin truncamiento.
- **Ubiquitous (General)**: La barra de búsqueda global DEBERÁ adaptarse de forma flexible para que los botones de acción del TopNav mantengan su espacio sin desbordarse.

### RF-03: Prevención de Desbordamiento Horizontal en AppShell
- **Ubiquitous (General)**: El contenedor principal en `AppShell.tsx` DEBERÁ calcular su ancho descontando con precisión el margen del menú lateral (`calc(100% - sidebar)` o `min-w-0 flex-1`), garantizando que ningún botón de acción (como "+ Nuevo Alquiler") quede cortado en el borde derecho del viewport.

### RF-04: Cifras Monetarias Legibles en Tarjetas KPI
- **State-driven (Estados)**: MIENTRAS una tarjeta de KPI contenga una cifra monetaria superior a 8 caracteres (ej. "$ 11.734.500"), el sistema DEBERÁ reducir automáticamente la escala tipográfica a `text-lg` o `text-xl` para mostrar el valor completo sin elipsis ("$ 11.73...").

### RF-05: Convivencia del Widget Flotante AcademiaIsland
- **Ubiquitous (General)**: El área de contenido principal del Dashboard DEBERÁ contar con margen inferior suficiente (`pb-24` / `safe-area-pb`) para asegurar que el widget flotante `AcademiaIsland` no bloquee la visualización ni interacción de tareas y botones.

---

## 3. Criterios de Aceptación y Verificación QA
1. Ninguna pantalla o componente de Alquileres System muestra la palabra "Flota" referida a vehículos o maquinaria.
2. El badge de TopNav muestra "📦 Nivel 2 · 250 XP" sin truncamiento en pantallas de 1280px y 1366px.
3. El botón "+ Nuevo Alquiler" y la cabecera del Dashboard son visibles al 100% en el borde derecho.
4. La tarjeta de Cartera por Cobrar muestra la cifra monetaria completa.
5. Verificación visual certificada en vivo con el MCP de Chrome DevTools.
6. 100% de la suite de pruebas unitarias y de integración pasando en verde.
