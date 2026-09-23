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
