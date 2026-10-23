# Guía de Reactivación y Roadmap — Alquileres System
**Alquileres System (FerreOn ERP & WMS)**  
*Última Actualización: 2026-10-23 — Certificación POS y Despliegue Producción Vercel*

---

## 1. Estado Consolidado al Día de Hoy

- **Base de Datos (Supabase `eqruvswlpsttuyuglwts`)**:
  - Migración canónica registrada: `20261022221833_pos_core_suite_and_dbre_optimizations`.
  - 4 RPCs activas con prevención de deadlocks (`ORDER BY id ASC FOR UPDATE`):
    1. `alquiler_crear_pos_rapido_v1`
    2. `cotizacion_convertir_pos_1clic`
    3. `devolucion_pos_inspeccion_rapida_v1`
    4. `alquiler_generar_adenda_transaccional_v1`
  - Tablas operativas con RLS: `alquiler_adendas` y `catalogo_averias_equipos`.
  - Tipos TypeScript sincronizados en `src/infrastructure/persistence/supabase/database.types.ts`.
- **Frontend & Producción Vercel (`https://alquileres-erp-nextjs-ruby.vercel.app`)**:
  - Despliegue en producción completado vía Vercel CLI (`readyState: READY`).
  - 0 Errores de TypeScript (`tsc --noEmit`) y `npm run build` en código 0 (32/32 páginas).
  - 5/5 tests unitarios en verde (59 ms) con tipado tributario `CUENTA_COBRO` Art. 616-1 del E.T.
- **Firma Digital & Documentos Oficiales**:
  - Interfaz en `/configuracion` activa en Vercel producción con selector de rúbrica PNG transparente.
  - Persistencia certificada en Supabase y `localStorage`.
  - Estampa de rúbrica validada en visor `VisorDocumentoPDFModal` en formatos Carta y Media Carta (A5).
- **Core Operativo POS**:
  - Modal `EditarContratoAdendaModal` probado con incremento versionado `v1.0 -> v1.1`.
  - Vista `DevolucionPosChecklistView` validada con semáforo táctil, catálogo de averías y liquidación reactiva de depósito en garantía.

---

## 2. Checklist de Tareas del Ciclo Anterior (100% Completadas)

- [x] **TAREA 1: Verificación Visual de la Firma Digital en Vercel**:
  - Despliegue forzado con `vercel --prod --yes` y certificado en `https://alquileres-erp-nextjs-ruby.vercel.app/configuracion`.
- [x] **TAREA 2: Prueba de Carga y Persistencia de la Rúbrica**:
  - Rúbrica cargada, guardada y persistente tras recargas forzadas.
- [x] **TAREA 3: Prueba de Generación y Renderizado en PDF**:
  - Documentos generados con estampa en Carta y Media Carta (A5) en `VisorDocumentoPDFModal`.
- [x] **TAREA 4: Validación de Adendas y Averías en Vivo**:
  - Adenda versionada formalizada (`v1.0 -> v1.1`) y recepción de averías con cobro/abono automático en caja.

---

## 3. Lista de Tareas Pendientes y Nuevas Prioridades del Roadmap

### Bloque A: Certificación y Tooling de Agentes (Técnico / Infraestructura)
- [ ] **TAREA A1: Ejecución y Validación de Harness²**:
  - Activar entorno Python en `harness2/` (`.\.venv\Scripts\Activate.ps1`) y correr suite de tests `pytest tests/ -v`.
- [ ] **TAREA A2: Re-indexación de GitNexus**:
  - Ejecutar `node .gitnexus/run.cjs analyze` para actualizar el grafo de símbolos con las nuevas rutas y componentes POS.

### Bloque B: Nuevas Funcionalidades del Roadmap de Negocio (Alquileres System)
- [ ] **TAREA B1: Módulo de Mantenimiento Preventivo & Alertas de Horómetros**:
  - Seguimiento de horas de uso o días de alquiler por equipo.
  - Alerta visual en Bodega cuando un equipo supere el ciclo de uso recomendado tras devoluciones.
  - Bloqueo Poka-Yoke para no despachar maquinaria en estado de revisión técnica pendiente.
- [ ] **TAREA B2: Firma Touch Digital del Cliente en Recepción / Despacho (Móvil & Mostrador)**:
  - Captura de firma manual táctil (Canvas) del cliente receptor o conductor al momento de entrega/devolución física.
  - Estampa en el Acta de Entrega y Devolución con hash inmutable.
- [ ] **TAREA B3: Módulo de Rutas, Logística y Fletes Bucaramanga**:
  - Planificación de ruta de camión de entrega y recogida diaria.
  - Estado de entrega en obra con confirmación fotográfica y geolocalización.
