# Especificación EARS: 018-rutas-logistica-fletes-bucaramanga

## 1. Metadatos
- **ID de Especificación**: SPEC-018
- **Título**: Módulo de Rutas, Logística y Matriz de Fletes Bucaramanga (Área Metropolitana)
- **Módulo**: Logística, Rutas y Alquileres
- **Autor**: @planner (Software Architect + Data Engineer)
- **Revisor**: @reviewer (UI Finish-Gate + QA Specialist)
- **Estado**: BORRADOR_PROPUESTO
- **Fecha**: 2026-11-10

---

## 2. Contexto y Objetivos del Negocio
Alquileres System gestiona el alquiler y transporte diario de maquinaria y andamiaje pesado en Bucaramanga y su área metropolitana (Floridablanca, Girón, Piedecuesta, Lebrija). Actualmente, la asignación de fletes en los contratos de alquiler se efectúa manualmente sin una matriz tarifaria por zonas ni trazabilidad del estado de despacho físico, lo que genera desajustes en cobros de fletes, falta de visibilidad sobre los camiones en ruta y ausencia de evidencia documental/fotográfica al entregar en obra.

### Objetivos:
1. **Matriz Tarifaria Zonificada**: Proveer tarifas base y sugeridas de flete según la zona geográfica (Bucaramanga, Cañaveral, Ruitoque, Chimitá, Girón, Piedecuesta, Lebrija) y la capacidad del vehículo requerido (Motocarro, Camioneta, Camión Turbo).
2. **Planificador de Rutas de Despacho y Recogida**: Permitir al despachador consolidar en una hoja de ruta diaria las entregas y recogidas de equipos, asignando vehículo y conductor.
3. **Trazabilidad de Estados y Evidencia en Obra**: Registrar estados (`PROGRAMADO`, `EN_CARGUE`, `EN_RUTA`, `ENTREGADO`, `RECOGIDO`, `FALLIDO`) y permitir adjuntar foto del acta/maquinaria en obra con estampa horaria y coordenadas GPS.
4. **Integración Transaccional**: Conectar la selección de zona de flete con el cálculo automático en el Wizard de Alquileres (`useAlquilerForm.ts` / `StepEquiposLogistica.tsx`), manteniendo la opción de sobreescritura manual en COP entero.

---

## 3. Requisitos Funcionales en Sintaxis Formal EARS

### 3.1. Requisitos Ubicuos (Ubiquitous - Comportamiento Fundamental)
- **RF-01**: El sistema DEBERÁ mantener un catálogo preconfigurado de zonas de flete para el Área Metropolitana de Bucaramanga (`BUCARAMANGA_CENTRO_NORTE`, `BUCARAMANGA_CABECERA_SUR`, `FLORIDABLANCA_CANAVERAL`, `FLORIDABLANCA_RUITOQUE`, `GIRON_CHIMITA_INDUSTRIAL`, `GIRON_POBLADO`, `PIEDECUESTA_GUATIGUARA`, `LEBRIJA_PALONEGRO`).
- **RF-02**: El sistema DEBERÁ almacenar todos los importes de flete en enteros exactos de pesos colombianos (COP) respetando el constraint `TRUNC(flete) = flete`.
- **RF-03**: El sistema DEBERÁ asociar cada despacho o recogida a un `empresa_id` con aislamiento estricto RLS Zero-Trust.

### 3.2. Requisitos Guiados por Eventos (Event-driven - Disparadores)
- **RF-04**: CUANDO [el usuario seleccione una zona de destino en el formulario de despacho/alquiler], el sistema DEBERÁ sugerir automáticamente la tarifa de flete correspondiente según la flota/volumen requerida, permitiendo ajuste manual.
- **RF-05**: CUANDO [el despachador cree una ruta de transporte diaria], el sistema DEBERÁ permitir agrupar múltiples paradas (entregas de nuevos contratos o recogidas de devoluciones) y ordenar la secuencia de paradas de 1 a N.
- **RF-06**: CUANDO [se registre el cambio de estado a 'ENTREGADO' o 'RECOGIDO'], el sistema DEBERÁ registrar la estampa temporal en zona `America/Bogota` (UTC-5), el usuario responsable y permitir adjuntar hasta 3 fotos de evidencia.
- **RF-07**: CUANDO [se confirme la entrega de un alquiler en obra], el sistema DEBERÁ actualizar el estado logístico del contrato sin alterar el estado de pago de la cartera.

### 3.3. Requisitos Basados en Estados (State-driven - Comportamiento Continuo)
- **RF-08**: MIENTRAS [una orden de transporte se encuentre en estado 'EN_RUTA'], el sistema DEBERÁ mostrar una insignia indicadora en el detalle del contrato de alquiler y en el dashboard operativo.
- **RF-09**: MIENTRAS [un vehículo asignado a una ruta diaria no haya completado todas sus paradas], el sistema DEBERÁ reflejar el porcentaje de avance de la ruta en la interfaz de logística.

### 3.4. Requisitos de Comportamiento No Deseado (Unwanted Behavior - Errores y Excepciones)
- **RF-10**: SI [se intenta programar una entrega o recogida con fecha anterior a la fecha de inicio del contrato], ENTONCES el sistema DEBERÁ bloquear la acción con un mensaje Poka-Yoke explicativo.
- **RF-11**: SI [la subida de la imagen de evidencia fotográfica supera 5 MB o no es un formato válido (JPEG/PNG/WEBP)], ENTONCES el sistema DEBERÁ comprimir o rechazar la carga antes de enviar la petición a Supabase Storage.

### 3.5. Requisitos Opcionales (Optional Features)
- **RF-12**: DONDE [el operador autorice geolocalización en su navegador o móvil], el sistema DEBERÁ capturar latitud y longitud al momento de presionar 'Marcar como Entregado en Obra' y generar un enlace a Google Maps.

---

## 4. Requisitos No Funcionales (RNF)
- **RNF-01 (Arquitectura)**: Seguir la arquitectura canónica Next.js App Router (RSC conciso para prefetching en `/logistica` + Client Island interactiva con lazy-loading de modales).
- **RNF-02 (Rendimiento)**: Carga inicial de la vista de logística < 100 kB First Load JS; revalidación reactiva mediante `revalidatePath('/logistica')`.
- **RNF-03 (Consistencia de Datos)**: Tablas maestras `rutas_despacho`, `ruta_paradas`, `zonas_flete_bucaramanga` respaldadas con RLS multi-tenant y auditoría en `AuditLogger`.
- **RNF-04 (UI/UX Linear High-Density)**: Cumplir con tokens de `DESIGN.md`, tipografía `tabular-nums` para tarifas y estados semánticos de transporte (`bg-emerald-500/10 text-emerald-400`, `bg-amber-500/10 text-amber-400`, `bg-blue-500/10 text-blue-400`).
