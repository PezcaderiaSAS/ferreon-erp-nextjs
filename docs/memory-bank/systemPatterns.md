# System Patterns — Alquileres System (FerreOn ERP & WMS)

Este documento establece las convenciones de arquitectura, patrones de diseño y restricciones no negociables para todo desarrollador y agente autónomo que opere sobre este código.

---

## 1. Arquitectura de Next.js 14 App Router

### 1.1 React Server Components (RSC) como Estándar por Defecto
- **Regla Inviolable:** Todas las páginas de ruta (`src/app/**/page.tsx`) deben ser **Server Components** (sin `'use client'`).
- **Carga de Datos:** Los datos iniciales se consultan directamente en el servidor en paralelo (`Promise.all`), reduciendo las cascadas de peticiones (*waterfalls*).
- **Streaming Progresivo:** Toda vista principal debe implementar su respectivo `loading.tsx` con componentes Skeleton que reflejen la estructura exacta de la interfaz según los tokens de `DESIGN.md`.

### 1.2 Client Islands (Islas de Cliente Delimitadas)
- La directiva `'use client'` solo está permitida en las hojas del árbol de componentes:
  - Tablas interactivas con ordenamiento y paginación local.
  - Modales de creación/edición cargados dinámicamente con `next/dynamic` y `ssr: false`.
  - Formularios complejos con validación reactiva en tiempo real (`react-hook-form` + `zod`).

### 1.3 Server Actions Delgadas (< 80 líneas)
- Las Server Actions en `src/app/actions/` actúan estrictamente como **Controladores de Transporte HTTP**:
  1. Extraer e inspeccionar la sesión (`auth.getUser()`) y el `empresaId`.
  2. Validar exhaustivamente la entrada con esquemas Zod (`validateActionInput`).
  3. Delegar la orquestación a un **Servicio de Dominio** en `src/core/services/`.
  4. Registrar la auditoría inmutable con `AuditLogger`.
  5. Invalidar la caché relevante con `revalidatePath()` o `revalidateTag()`.
  6. Retornar una respuesta envelope tipada `{ success: boolean, data?: T, error?: string }`.
- **Prohibición:** Queda prohibido escribir consultas directas a la base de datos o lógica matemática dentro de un archivo de Server Action.

---

## 2. Resiliencia de Datos y Concurrencia WMS

### 2.1 Bloqueo Pesimista en PostgreSQL (`SELECT ... FOR UPDATE`)
- Toda reserva, despacho o devolución de inventario debe ejecutarse mediante funciones atómicas RPC de PostgreSQL.
- Se adquiere un bloqueo exclusivo a nivel de fila (`FOR UPDATE`) sobre los registros de `equipos` impactados para evitar condiciones de carrera en picos de alta concurrencia.
- Si el `stock_disponible` no satisface la cantidad requerida, la transacción aborta inmediatamente con rollback automático.

### 2.2 Idempotencia en Frontera y en Base de Datos
- Toda mutación financiera o de contrato debe recibir un `idempotency_key` (UUID v4).
- La tabla `alquileres` contiene la restricción única `UNIQUE(empresa_id, idempotency_key)`.
- Si se detecta una clave repetida, el sistema retorna el registro original sin duplicar el cobro ni el despacho de inventario.

---

## 3. Gobernanza del Estado en Cliente (Zustand)

### 3.1 Límites de Zustand: Exclusivo para UI Efímera
- **Permitido:**
  - Estado de modales (abierto/cerrado, modal activo).
  - Pestaña seleccionada (`contratos`, `cotizaciones`, `historial`).
  - Término de búsqueda y filtros visuales locales.
  - Notificaciones Toasts y pasos de tutoriales (Tour).
- **PROHIBIDO:**
  - Guardar colecciones completas de datos de negocio (>100 registros) en Zustand con el middleware `persist` (`localStorage`).
  - Tratar a Zustand como una base de datos local desconectada del servidor.

---

## 4. Gobernanza Visual y Accesibilidad UI/UX

1. **Tokens Semánticos:** Todo estilo debe usar las variables semánticas de `DESIGN.md`. Prohibido el uso de colores hex hardcodeados.
2. **Prevención de Doble Click (Poka-Yoke):** Todo botón de submit debe deshabilitar físicamente la interacción (`pointer-events-none disabled:opacity-50`) y mostrar un spinner SVG animado durante el estado `isLoading`.
3. **Formatos Numéricos:** Los valores monetarios y cantidades de stock deben renderizarse con `font-mono tabular-nums text-right`.
4. **Estándar Linear de Alta Densidad (Reverse-Engineered Linear Standard):**
   - Tablas densas con filas de 30px (`h-7.5`), fuentes `text-xs` (12px) y micro-elementos e íconos estrictos de 14px (`w-3.5 h-3.5`).
   - Cero sombras estáticas (`shadow-none`) y bordes tenues `border-zinc-800/80` (dark) / `border-zinc-200` (light).
   - Minimalismo monocromático gobernado por opacidad (`text-white/90`, `text-white/60`, `text-white/40`) y acento único índigo (`bg-indigo-600`) para CTA activo.
   - Navegación ágil por teclado (`Ctrl+K` Command Palette, flechas `↑`/`↓`, `J`/`K`, hotkeys `C`/`F`, foco `ring-1 ring-indigo-500/70`).
   - Cuadrícula métrica inamovible con anchos explícitos (`w-28`, `w-44`, `w-64`) bajo `table-fixed`.
5. **Las 5 Leyes Inmutables de CSS Moderno (Verdad Absoluta):**
   - **Centrado:** Prohibido `absolute + transform: translate(-50%, -50%)`. Obligatorio `grid place-items-center` o `align-content: center`.
   - **Contexto de Apilamiento:** Prohibido `z-index: 9999`. Obligatorio `isolation: isolate; z-index: 1` (`isolate z-10`) para crear nuevo stacking context sin guerras de escalada.
   - **Espaciado:** Prohibido `.card { margin-bottom: 24px; } :last-child`. Obligatorio gobernanza desde el contenedor con `gap` (`flex flex-col gap-4` o `grid gap-6`).
   - **Viewports Verticales:** Prohibido `height: 100%` en contenedores de aplicación sin ancestros con altura explícita. Obligatorio unidades de viewport dinámicas `min-height: 100dvh` (`min-h-[100dvh]`).
   - **Especificidad:** Prohibido resolver conflictos con `!important`. Obligatorio arquitectura en capas `@layer base, components, utilities;`.

---

## 5. Paridad Bidireccional de Diseño (Design Tokens & Figma Sync)

### 5.1 Especificación W3C Design Tokens Community Group (DTCG)
- Los tokens de diseño en `figma_design_tokens.json` y `DESIGN.md` representan el contrato de verdad entre el código frontend (Tailwind/CSS) y Figma.
- Cada token se categoriza semánticamente en Color (`$type: color`), Espaciado (`$type: dimension`) y Radio de Borde (`$type: dimension`).

### 5.2 Arquitectura del Plugin Sync Studio v2.0 (`figma-tokens-sync/`)
- **Plugin Nativo Local sin Dependencias SaaS:** Elimina costos recurrentes o restricciones de Tokens Studio Pro operando 100% en el sandbox local de Figma Desktop.
- **Comunicación Iframe ⇄ Sandbox:** La interfaz visual (`ui.html`) se comunica bidireccionalmente con el motor de Figma (`code.js`) vía `parent.postMessage` y `figma.ui.onmessage`.
- **Compatibilidad Arquitectónica con Figma Free:** Ante la restricción de 1 solo modo por colección (`Limited to 1 modes only`), se adoptó el patrón de colecciones hermanas:
  - `Alquileres System — Design Tokens` (Tema Canónico / Salmón Pastel).
  - `Alquileres System — Cyber Cyan (Dark)` (Tema Alternativo / Cyber Cyan).
- **Enlace Nativo de Capas (`setBoundVariable`):** Vinculación formal de capas a las Variables mediante `setBoundVariableForPaint`, asegurando que modificar un token en el sistema propague reactivamente los cambios sobre las 14 vistas del lienzo.

---

## 6. Arquitectura de Componentes UI Premium & Microinteracciones (16 Patrones)

Para experiencias de usuario enriquecidas, tableros de gestión técnica y flujos de completado, el sistema dispone de la biblioteca modular `@/components/ui/premium`:

1. **Gestión Técnica de Proyectos y Tareas:**
   - `PremiumAdvancedKanban`: Soporte de Sprint 38, rotación física al arrastrar (`rotate(2deg) scale(1.02)`), marcadores de decisión en neón esmeralda (`#00e699`) y límites WIP visuales (`4/4`).
   - `PremiumLinearSystem`: Adhesión estricta a los 5 pilares de Linear (alta densidad, bordes `#30363d`, acento único `#00e699`, atajos de teclado y alineación monospace).
   - `PremiumWeeklyCalendarSystem`: Rejilla semanal con cero colapso de eventos (Zero-Overlaps Grid), discriminación categórica por color (Work `#0d9488`, Personal `#d97706`, Team `#6d28d9`) y leyenda de 40 eventos.
   - `PremiumUpcomingMeetings`: Panel de 2 columnas con sidebar gradiente oscuro, selector horizontal en píldoras y avatares superpuestos.
   - `PremiumKanbanBoard`: Tablero de 4 columnas con etiquetas de prioridad, avatares, comentarios y adjuntos.

2. **Tablas Adaptativas y Datos Financieros:**
   - `PremiumResponsiveMobileTable`: Shell móvil de 360px (`border-radius: 32px`) que transforma filas en tarjetas fluidas con métricas financieras destacadas y comparativa de escritorio.
   - `PremiumTable`: Tabla enterprise con toolbar integrada, buscador en tiempo real, filtros, estados visuales y avatares con iniciales.
   - `PremiumDashboardPreview`: Panel analítico Dark Mode con flat accents, banner de bienvenida, métricas y gráfico SVG con toggles 7d/30d/90d.

3. **Acciones, Confirmación y Anti Dead-End UX:**
   - `PremiumSuccessDoneScreen`: Principio *done ≠ dead end*, resplandor neón fosforescente (`#00e699`), caja de destinatario y llamada a la acción secundaria (*Next Step*).
   - `PremiumToast` & `PremiumToastShowcase`: Avisos flotantes con gradientes a 135deg según jerarquía cromática y animación de entrada con rebote `cubic-bezier`.
   - `PremiumGoalTracker`: Card de objetivos con cabecera en gradiente vibrante, progreso circular radial SVG y caja de deadline.
   - `PremiumProfileUpload`: Carga de avatar circular con badge flotante de cámara, zona dropzone y botones con gradientes.

4. **Navegación y Microinteracciones:**
   - `PremiumWaterRipple`: Canvas interactivo de fluido con gradiente oceánico profundo y ondas expansivas en coordenadas de clic a 60 FPS con aceleración GPU.
   - `PremiumStickyHeader`: Barra fija con desenfoque de fondo glassmorphic de 12px, listener de scroll dinámico y botón CTA con gradiente.
   - `PremiumHamburgerMenu`: Menú desplegable responsive con botón animado en contenedor índigo `#6366f1` y dropdown elevado.
   - `PremiumAccordion`: Acordeón de tarjetas elevadas independientes con icon badges atenuados y alternancia (+ / -).


