# Especificación EARS: [NNN-nombre-funcionalidad]

## 1. Metadatos
- **ID de Especificación**: SPEC-NNN
- **Título**: [Nombre descriptivo de la funcionalidad]
- **Módulo**: [Ej: Alquileres, Facturación, Inventario, Flota]
- **Autor**: @planner (Software Architect + Data Engineer)
- **Revisor**: @reviewer (UI Finish-Gate + QA Specialist)
- **Estado**: BORRADOR | AUDITADA_QA | APROBADA_USUARIO | IMPLEMENTADA

---

## 2. Contexto y Objetivos del Negocio
[Descripción del problema, valor aportado y propósito dentro de Alquileres System]

---

## 3. Requisitos Funcionales en Sintaxis Formal EARS

### 3.1. Requisitos Ubicuos (Ubiquitous - Comportamiento Fundamental)
- **RF-01**: El sistema DEBERÁ [comportamiento fundamental que el sistema siempre realiza].
- **RF-02**: El sistema DEBERÁ almacenar todos los importes monetarios en formato Integer Math (centavos) para evitar errores de precisión de punto flotante.

### 3.2. Requisitos Guiados por Eventos (Event-driven - Disparadores)
- **RF-03**: CUANDO [el usuario presione el botón 'Confirmar Alquiler'], el sistema DEBERÁ validar el aislamiento de inquilino (`tenant_id`) y persistir la transacción de forma atómica en Supabase.
- **RF-04**: CUANDO [se detecte un error de red o timeout], el sistema DEBERÁ registrar el log estructurado en el servidor y mostrar una notificación accesible sin exponer el stacktrace.

### 3.3. Requisitos Basados en Estados (State-driven - Comportamiento Continuo)
- **RF-05**: MIENTRAS [el formulario maestro se encuentre en estado de carga o envío], el sistema DEBERÁ deshabilitar los botones de acción para prevenir dobles envíos (*double submit*).

### 3.4. Requisitos de Comportamiento No Deseado (Unwanted Behavior - Errores y Excepciones)
- **RF-06**: SI [la cantidad ingresada es menor o igual a cero o el cliente no existe], ENTONCES el sistema DEBERÁ abortar la transacción antes de consultar la base de datos y retornar un error 422 con mensaje descriptivo.

### 3.5. Requisitos Opcionales (Optional Features)
- **RF-07**: DONDE [la pantalla del dispositivo tenga un ancho inferior a 768px (móvil)], el sistema DEBERÁ renderizar los registros en tarjetas apiladas (Cards) con acciones contextuales en vez de tablas horizontales desbordantes.

---

## 4. Requisitos No Funcionales (RNF)
- **RNF-01 (Seguridad)**: Las consultas deben aplicar políticas RLS de Supabase.
- **RNF-02 (Rendimiento)**: Tiempo de respuesta P95 < 200ms en consultas de listado.
- **RNF-03 (Accesibilidad)**: Cumplimiento de estándares WCAG AA y soporte de navegación por teclado.
