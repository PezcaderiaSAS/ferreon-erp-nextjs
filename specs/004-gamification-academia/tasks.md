# Desglose de Tareas de Implementación (TDD): SPEC-004 Academia Alquileres System & Gamificación

## Matriz de Tareas Atómicas para `@implementer`

---

### [x] Tarea 1: Pruebas Unitarias TDD para el Motor de Gamificación
- **Archivo de Test**: `tests/unit/gamification.service.test.ts`
- **Criterio de Aceptación**:
  - Verificar cálculo exacto de XP acumulada por misiones y tours completados.
  - Verificar transición de rangos (Nivel 1 a 5) según los umbrales de XP (0, 201, 501, 901, 1401).
  - Verificar que tours repetidos no otorguen XP duplicada de forma fraudulenta (idempotencia).
  - Verificar cálculo de porcentaje de avance hacia el siguiente nivel (0% a 100%).
  - La suite DEBE fallar (RED) antes de implementar el servicio.
- **Estado**: COMPLETADA (16/16 pruebas pasando en Vitest)

---

### [x] Tarea 2: Implementación del Servicio de Dominio Puro de Gamificación
- **Archivos Afectados**:
  - `src/core/types/gamification.ts`
  - `src/core/services/gamification.service.ts`
- **Criterio de Aceptación**:
  - Definir tipos e interfaces estrictas (`MisionAprendizaje`, `InsigniaGamification`, `RangoMaestria`, `ProgresoGamificationState`).
  - Implementar funciones puras: `calcularRangoMaestria(xp)`, `calcularProgresoSiguienteNivel(xp)`, `evaluarDesbloqueoInsignias(progreso)`.
  - Pasar a verde (GREEN) la suite de la Tarea 1.
- **Estado**: COMPLETADA (Tipos exportados y funciones puras validadas)

---

### [x] Tarea 3: Store Reactivo Híbrido en Zustand con Persistencia Local
- **Archivos Afectados**:
  - `src/infrastructure/state/gamificationStore.ts`
- **Criterio de Aceptación**:
  - Store Zustand con `persist` en `LocalStorage` (`alquileres-gamification-storage`).
  - Métodos atómicos: `completarMision(misionId, xp)`, `completarTour(tourId)`, `desbloquearInsignia(insigniaId)`, `resetProgreso()`.
  - Disparador de eventos para micro-celebración con confeti al subir de nivel o ganar insignias.
- **Estado**: COMPLETADA (Almacenamiento persistente, detección de Level Up y celebración)

---

### [x] Tarea 4: Currículum Pedagógico Maestro 360° (Los 12 Módulos Apto 12+)
- **Archivos Afectados**:
  - `src/core/constants/academia-curriculum.ts`
- **Criterio de Aceptación**:
  - Catálogo pedagógico exhaustivo de los 12 territorios/módulos con títulos intuitivos, rutas y metáforas visuales.
  - Mapeo de más de 40 botones operativos bajo la estructura de 3 partes:
    1. **¿Qué hace?** (Lenguaje simple y sin tecnicismos opacos).
    2. **¿Cuándo y para qué usarlo?** (Casos de obra y constructoras).
    3. **¿Qué pasa tras bambalinas?** (Impacto transparente en stock de bodega y dinero en caja).
  - Los 6 Flujos Maestros del Negocio ("El Viaje de la Maquinaria"):
    1. Del Prospecto a la Cotización Rápida en WhatsApp.
    2. De la Cotización al Contrato y Reserva de Stock.
    3. Despacho y Entrega en Obra.
    4. Retorno e Inspección Técnica Split-Line.
    5. Facturación Periódica Pro-Rata y Cobro.
    6. Caja, Arqueos y Asientos Contables.
- **Estado**: COMPLETADA (12 módulos, 40+ botones con tríada didáctica, 6 flujos maestros y 12 misiones)

---

### [x] Tarea 5: Widget Flotante de Academia, Modal de Misiones y Celebración
- **Archivos Afectados**:
  - `src/components/academia/AcademiaIsland.tsx`
  - `src/components/academia/AcademiaModal.tsx`
  - `src/components/academia/CelebracionConfetti.tsx`
  - `src/components/academia/index.ts`
- **Criterio de Aceptación**:
  - Widget flotante en la esquina inferior izquierda/derecha con badge de nivel, XP y botón de apertura.
  - Modal con pestañas: *Mis Misiones*, *Insignias Coleccionables* y *Ruta de Maestría*.
  - Celebración animada con confeti visual reactivo al desbloquear logros (Canvas nativo ultraligero).
- **Estado**: COMPLETADA (Componentes creados y testeados)

---

### [x] Tarea 6: Modal Pedagógico 360° de Botones y Flujos del ERP
- **Archivos Afectados**:
  - `src/components/academia/GuiaBotonesFlujosModal.tsx`
  - `src/components/academia/index.ts`
- **Criterio de Aceptación**:
  - Conmutador de pestañas por módulo (Alquileres, Cotizaciones, Bodega, Facturación, etc.).
  - Buscador instantáneo typeahead para encontrar cualquier botón o atajo de teclado por nombre o acción.
  - Renderizado de tarjetas didácticas con colores semánticos, badges y la tríada pedagógica.
  - Sección interactiva para visualizar los 6 flujos de maquinaria paso a paso.
  - Atajo global `F1` y tecla `Esc`.
- **Estado**: COMPLETADA (Modal interactivo con 3 pestañas y buscador en tiempo real)

---

### [x] Tarea 7: Catálogo de Tours Guiados por Módulo e Integración en TopNav / AppShell
- **Archivos Afectados**:
  - `src/components/academia/toursConfig.ts`
  - `src/components/ui/TopNav.tsx`
  - `src/components/layout/AppShell.tsx`
  - `src/components/ui/GlobalTourWrapper.tsx`
  - `src/components/ui/InteractiveTour.tsx`
  - `src/components/ui/Sidebar.tsx`
- **Criterio de Aceptación**:
  - Configuración estructurada de los tours guiados para las rutas clave conectando con `targetId` del DOM.
  - Integración del badge interactivo de rango y XP en `TopNav.tsx`.
  - Inyección universal de `AcademiaIsland`, `AcademiaModal`, `GuiaBotonesFlujosModal` y `CelebracionConfetti` en `AppShell.tsx`.
  - Conexión de `InteractiveTour` para acreditar XP y celebrar automáticamente al terminar cualquier tour.
- **Estado**: COMPLETADA (Integrado y sincronizado en todo el layout)

---

### [x] Tarea 8: Verificación Global de Calidad, Tipos y Suite Completa
- **Comandos de Verificación**:
  - `npm test` (Suite completa de pruebas en Vitest: 455 de 455 pruebas aprobadas al 100% en 80 archivos).
  - `npx tsc --noEmit` (0 errores de tipado TypeScript en todo el proyecto).
- **Criterio de Aceptación**:
  - Cero regresiones en la operativa existente del ERP.
  - Sincronización final de `MEMORY.md`.
- **Estado**: COMPLETADA (100% verde)
