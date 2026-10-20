# Especificación EARS: SPEC-002 Módulo de Cotizaciones Rápidas y Conversión Comercial

## 1. Metadatos de la Especificación
- **ID de Especificación**: SPEC-002
- **Título**: Módulo Integral de Cotizaciones Rápidas, Pipeline Comercial y Conversión Poka-Yoke 1-Clic
- **Módulo**: Comercial / Cotizaciones & Alquileres (`Alquileres System`)
- **Autor / Rol**: `@planner` (Software Architect + Data Engineer inyectado desde Agency Agents)
- **Revisor / QA**: `@reviewer` (UI Finish-Gate Reviewer + QA Specialist)
- **Estado**: AUDITADA_FASE_1_PROPUESTA (Pendiente de Aprobación de Quality Gate Fase 2)
- **Fecha de Creación**: 2026-10-03
- **Versión de Especificación**: 1.0.0

---

## 2. Contexto del Negocio y Diagnóstico de la Operación

En las empresas de alquiler de maquinaria y equipos para construcción, la velocidad de respuesta comercial es el factor determinante para cerrar negocios frente a la competencia:
1. **Punto de Dolor Actual**:
   - Las cotizaciones se encuentran actualmente embebidas como una pestaña secundaria dentro de `/alquileres?tab=cotizaciones`. La ruta principal `/cotizaciones` solo redirige.
   - Cuando un asesor comercial o despachador atiende a un cliente por WhatsApp o en mostrador, el proceso tradicional de registro exige demasiados pasos y campos no requeridos en la etapa de prospección.
   - Se requiere un flujo **"Cotización Express en 30 segundos"** que permita cotizar múltiples ítems con cálculo dinámico en tiempo real, desglose de impuestos configurable (IVA 19%, Retefuente, ReteICA), costo de flete/transporte y depósito de garantía.
2. **Oportunidad y Valor de Negocio**:
   - Habilitar la página de primer nivel `/cotizaciones` como un **Centro Comercial de Cotizaciones** con KPIs ejecutivos (Tasa de Conversión %, Volumen Cotizado COP, Cotizaciones Vigentes).
   - Generación instantánea de **PDF oficial corporativo** y botón de compartir por **WhatsApp** con plantilla de mensaje personalizada y enlace directo.
   - Formalización en **1-clic a Contrato de Alquiler** aprovechando los RPCs existentes con bloqueo pesimista (`FOR UPDATE`) para evitar sobreventas concurrentes.

---

## 3. Requisitos Funcionales en Sintaxis Formal EARS

### 3.1. Requisitos Ubicuos (Ubiquitous - Comportamiento Fundamental)
- **EARS-UBI-01**: El sistema DEBERÁ proveer una vista de primer nivel autónoma en la ruta `/cotizaciones`, integrada en el menú lateral de navegación con su propio contador de pendientes y permisos de módulo comercial.
- **EARS-UBI-02**: El sistema DEBERÁ procesar todos los cálculos monetarios (subtotales, tarifas, IVA, retenciones, transporte y total) bajo formato exacto Integer Math (redondeo bancario a enteros de COP), eliminando desfasajes de coma flotante.
- **EARS-UBI-03**: El sistema DEBERÁ representar las cifras de dinero y cantidades de equipos con tipografía monoespaciada tabular `font-mono tabular-nums` para garantizar estabilidad visual y legibilidad óptima.
- **EARS-UBI-04**: El sistema DEBERÁ generar de manera correlativa y atómica el consecutivo comercial de cotización bajo la convención `COT-XXXX` aislado por cada empresa (`tenant_id` / `empresa_id`).

### 3.2. Requisitos Guiados por Eventos (Event-driven - Disparadores)
- **EARS-EVE-01**: CUANDO el usuario presione el botón prioritario '+ Nueva Cotización Rápida', el sistema DEBERÁ desplegar el drawer o modal enfocado de cotización express con foco automático en la selección de cliente o prospecto.
- **EARS-EVE-02**: CUANDO el usuario ingrese o seleccione un cliente prospecto no registrado previamente, el sistema DEBERÁ permitir la creación "On-The-Fly" (solo Nombre y Celular/WhatsApp) sin obligar a abandonar el flujo ni abrir ventanas secundarias.
- **EARS-EVE-03**: CUANDO el asesor presione el botón 'Compartir por WhatsApp', el sistema DEBERÁ generar un enlace codificado `https://wa.me/{telefono}?text={mensaje}` con el resumen de ítems, días, valor total, validez de la oferta y enlace de visualización o PDF.
- **EARS-EVE-04**: CUANDO el usuario presione 'Convertir a Contrato (1-Clic)', el sistema DEBERÁ ejecutar la Server Action `convertirCotizacionAContratoAction` con bloqueo pesimista en base de datos; si hay unidades suficientes, creará el contrato en estado `ACTIVO` o `ACTIVO_EN_OBRA` y marcará la cotización como `CONVERTIDA`.
- **EARS-EVE-05**: CUANDO el usuario modifique la cantidad de días o la cantidad de equipos en cualquier fila, el sistema DEBERÁ recalcular instantáneamente el subtotal, impuestos y total sin recargas de página (latencia reactiva < 16ms).

### 3.3. Requisitos Basados en Estados (State-driven - Comportamiento Continuo)
- **EARS-STA-01**: MIENTRAS una cotización se encuentre en estado `BORRADOR` o `ENVIADA`, el sistema DEBERÁ permitir editar sus ítems, fechas de vigencia y parámetros tributarios.
- **EARS-STA-02**: MIENTRAS una cotización figure en estado `CONVERTIDA`, el sistema DEBERÁ bloquear la edición de sus campos estructurales y exhibir un enlace directo y visible al Contrato de Alquiler generado (`ALQ-XXXX`).
- **EARS-STA-03**: MIENTRAS se esté ejecutando la conversión a contrato o la consulta en base de datos, el sistema DEBERÁ deshabilitar los botones de acción e indicar el estado de carga para prevenir dobles clics y condiciones de carrera.

### 3.4. Requisitos de Comportamiento No Deseado (Unwanted Behavior - Casos Borde)
- **EARS-UNW-01**: SI el inventario de bodega no dispone de unidades libres al momento de la conversión a contrato, ENTONCES el sistema DEBERÁ abortar la transacción de forma segura, rechazar el sobrecupo y desplegar el diálogo Poka-Yoke con opciones de derivación a Subcontratación o ajuste de cantidades.
- **EARS-UNW-02**: SI la fecha de vigencia de la cotización es anterior a la fecha actual y se intenta convertir a contrato, ENTONCES el sistema DEBERÁ solicitar confirmación explícita para actualizar la fecha de inicio del alquiler antes de continuar.
- **EARS-UNW-03**: SI el usuario intenta guardar una cotización sin al menos un equipo válido con cantidad mayor a cero y días mayor a cero, ENTONCES el sistema DEBERÁ impedir el envío y resaltar el campo correspondiente con borde de advertencia accesible.

### 3.5. Requisitos Opcionales y Adaptativos (Optional Features)
- **EARS-OPT-01**: DONDE el viewport sea inferior a 768px (pantalla móvil), el sistema DEBERÁ reemplazar la tabla tabular por una grilla líquida de tarjetas móviles táctiles con botones de acción directa (Llamar, WhatsApp, PDF, Convertir).
- **EARS-OPT-02**: DONDE el asesor active el modo "Cotización Sin Impuestos", el sistema DEBERÁ apagar las casillas de IVA y retenciones en 1-clic mediante un interruptor simplificado tipo toggle.

---

## 4. Requisitos No Funcionales (RNF) y Criterios de Aceptación (QA)
- **RNF-01 (Seguridad & Multitenancy)**: Todas las operaciones de lectura, escritura y conversión deben filtrar estrictamente por `empresa_id` con políticas RLS de Supabase.
- **RNF-02 (Rendimiento)**: Tiempo de carga inicial (FCP) de la ruta `/cotizaciones` < 1.0s y First Load JS < 125 kB.
- **RNF-03 (Calidad de Código y Cero Regresiones)**: Las 419 pruebas existentes en Vitest deben mantenerse al 100% de aprobación y las nuevas pruebas unitarias del servicio de cotizaciones deben cubrir el 100% de los casos de cálculo tributario y conversión.
- **RNF-04 (Gobernanza de Marca)**: Se debe respetar estrictamente el nombre **"Alquileres System"** en todos los encabezados, plantillas de PDF y textos generados.
