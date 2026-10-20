# Especificación EARS: SPEC-004 Sistema de Tutorial Interactivo, Gamificación y Academia de Maquinaria

## 1. Metadatos
- **ID de Especificación**: SPEC-004
- **Título**: Academia Alquileres System — Sistema de Tutoriales Interactivos, Gamificación (XP, Niveles, Insignias) y Guía Pedagógica 360° de Botones y Flujos (Apto para usuarios desde 12 años)
- **Módulo**: Onboarding, Academia & Gamificación Transversal
- **Autor**: @planner (Software Architect + Data Engineer)
- **Revisor**: @reviewer (UI Finish-Gate + QA Specialist)
- **Estado**: BORRADOR

---

## 2. Contexto y Objetivos del Negocio
Alquileres System es una plataforma ERP y WMS de alta densidad operativa diseñada para empresas de maquinaria, andamiaje y equipos de construcción en Colombia y Latinoamérica. Aunque la plataforma es robusta y completa (33 rutas, 19 hitos arquitectónicos certificados), los operadores de bodega, auxiliares comerciales y nuevos empleados requieren una curva de aprendizaje intuitiva, amigable y libre de frustración.

El objetivo de esta especificación es crear la **"Academia Alquileres System"**: un ecosistema de aprendizaje interactivo y gamificado que permita a cualquier usuario (desde los 12 años en adelante) dominar la aplicación al 100%, comprender qué hace cada botón, para qué sirve cada flujo y cómo se mueve el inventario y el dinero tras bambalinas, acumulando Puntos de Experiencia (XP), desbloqueando 5 Niveles de Maestría y ganando Insignias coleccionables con micro-celebraciones visuales.

---

## 3. Cobertura de Módulos del Sistema (Los 12 Territorios)
1. **Dashboard & Centro de Control Operativo (`/dashboard`)**: KPIs de utilización, cartera en COP, tareas del día y calendario multi-flujo.
2. **Cotizaciones Rápidas (`/cotizaciones`)**: Creación express en 30 segundos, verificación de stock, enlace WhatsApp y formalización poka-yoke.
3. **Alquileres & Contratos (`/alquileres`)**: Wizard de despacho, contratos activos, cálculo de fletes y garantías, detalle 360°.
4. **Bodega, Kardex & Mantenimiento (`/bodega`)**: Control de stock disponible/alquilado/taller, kardex inmutable y liberación de mantenimiento.
5. **Compras & Proveedores (`/compras`)**: Órdenes de compra de maquinaria, recepción física en bodega y cálculo PMP.
6. **Subcontrataciones & Tercerización (`/subcontrataciones`)**: Re-renting con aliados, semáforo de margen negativo y actas de devolución a aliados.
7. **Devoluciones & Inspección Split-Line (`/devoluciones`)**: Retorno físico de obra, actas de inspección técnica (buen estado/daño/taller) y liquidación de garantías.
8. **Facturación, Cartera CXC & Cortes Recurrentes (`/facturacion`)**: Emisión de Cuentas de Cobro con leyenda legal Art. 616-1 / 437 E.T., cortes pro-rata y pagos mixtos.
9. **Caja, POS & Arqueos (`/caja`)**: Sesión activa de cajero, egresos menores de patio, arqueos de cierre con denominaciones y balance continuo.
10. **Directorio de Clientes (`/clientes`)**: Ficha de clientes, obras activas, historial de alquileres y cupo de crédito.
11. **Suscripción SaaS (`/suscripcion`)**: Planes Pro/Trial, facturación del software y límites de inquilino.
12. **Gobernanza UltraAdmin (`/admin/empresas`)**: Cockpit de supervisión de tenants, licencias de módulos y auditoría de seguridad.

---

## 4. Requisitos Funcionales en Sintaxis Formal EARS

### 4.1. Requisitos Ubicuos (Ubiquitous - Comportamiento Fundamental)
- **RF-01**: El sistema DEBERÁ mantener accesible en todo momento un punto de entrada a la Academia (botón en `TopNav` y widget flotante `AcademiaIsland`) con el nivel actual del usuario, barra de progreso y XP acumulada.
- **RF-02**: El sistema DEBERÁ persistir el progreso de gamificación de forma híbrida: primero en `LocalStorage` reactivo vía Zustand para renderizado instantáneo (0 ms), y sincronizado asíncronamente con Supabase en segundo plano (`gamification_progress`).
- **RF-03**: El sistema DEBERÁ redactar todas las explicaciones de botones, modales y flujos en lenguaje claro y accesible para usuarios desde 12 años, utilizando la tríada pedagógica:
  1. **¿Qué hace?** (Acción en palabras simples y metáforas visuales).
  2. **¿Cuándo y para qué se usa?** (Ejemplo de la vida real en una constructora/obra).
  3. **¿Qué pasa tras bambalinas?** (Impacto transparente en el inventario de bodega y en el dinero/caja).

### 4.2. Requisitos Guiados por Eventos (Event-driven - Disparadores)
- **RF-04**: CUANDO [el usuario complete un recorrido guiado (Tour) o una misión de aprendizaje], el sistema DEBERÁ otorgar los puntos de experiencia correspondientes (+50 a +150 XP), actualizar la barra de progreso, verificar si sube de nivel y disparar una micro-celebración con confeti ligero (`canvas-confetti`).
- **RF-05**: CUANDO [el usuario ingrese por primera vez a cualquiera de las 12 rutas principales], el sistema DEBERÁ mostrar una invitación no invasiva tipo banner/píldora preguntando si desea realizar el tour guiado de 2 minutos de ese módulo, con opción de iniciar o posponer.
- **RF-06**: CUANDO [el usuario presione el botón 'Guía de Botones y Flujos' o el atajo global 'F1'], el sistema DEBERÁ desplegar el modal interactivo con buscador typeahead en tiempo real y selector de módulos para consultar cualquier acción del ERP.
- **RF-07**: CUANDO [el usuario alcance los umbrales de XP definidos], el sistema DEBERÁ desbloquear automáticamente el nuevo Rango de Maestría y la Insignia correspondiente:
  - Nivel 1 (0 - 200 XP): **Aprendiz de Taller** 🛠️
  - Nivel 2 (201 - 500 XP): **Operador de Bodega** 📦
  - Nivel 3 (501 - 900 XP): **Asesor Comercial** 💼
  - Nivel 4 (901 - 1400 XP): **Maestro de Contratos** 📜
  - Nivel 5 (1401+ XP): **Gerente de Maquinaria Pro** 👑

### 4.3. Requisitos Basados en Estados (State-driven - Comportamiento Continuo)
- **RF-08**: MIENTRAS [un tour interactivo se encuentre en ejecución], el sistema DEBERÁ iluminar con un spotlight el elemento objetivo (`targetId`), oscurecer sutilmente el resto de la pantalla con backdrop blur, posicionar el tooltip de forma inteligente (top, bottom, left, right) evitando salirse del viewport, y permitir cancelar o avanzar con las teclas `Esc` y `Enter`.
- **RF-09**: MIENTRAS [el usuario interactúe con el ERP en modo normal], el sistema NO DEBERÁ bloquear la navegación ni forzar modales intrusivos que entorpezcan la atención a clientes o el registro de operaciones urgentes.

### 4.4. Requisitos de Comportamiento No Deseado (Unwanted Behavior - Robustez)
- **RF-10**: SI [un elemento objetivo de un paso del tour no existe en el DOM por permisos de rol o renderizado condicional], ENTONCES el sistema DEBERÁ omitir silenciosamente ese paso o mostrar un mensaje alternativo sin romper la UI ni provocar bloqueos suaves (*anti soft-lock*).
- **RF-11**: SI [la sincronización de puntos con Supabase falla por pérdida de conexión], ENTONCES el sistema DEBERÁ encolar la mutación en `LocalStorage` y sincronizarla automáticamente cuando se restablezca la red (*Zero Data Loss*).

### 4.5. Requisitos Opcionales y Adaptabilidad (Optional Features)
- **RF-12**: DONDE [el ancho del dispositivo sea inferior a 768px (móvil)], el sistema DEBERÁ adaptar el modal de la Academia y los tooltips del tour en una hoja inferior deslizable (*Bottom Sheet Drawer*) con botones táctiles grandes de fácil toque.

---

## 5. Requisitos No Funcionales (RNF)
- **RNF-01 (Rendimiento)**: El motor de gamificación y tours no debe añadir más de 15 kB al First Load JS bundle inicial (carga diferida `next/dynamic` para canvas-confetti y modales pesados).
- **RNF-02 (Accesibilidad WCAG AA)**: Contrastes de color superiores a 4.5:1, etiquetas ARIA (`role="dialog"`, `aria-modal="true"`, `aria-live="polite"` para anuncio de puntos y logros ganados).
- **RNF-03 (Calidad de Código y TDD)**: Mínimo 80% de cobertura de pruebas unitarias para el motor de puntos, rangos e insignias en Vitest. Cero errores de compilación TypeScript.
