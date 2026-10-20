# Plan de Arquitectura e Implementación: SPEC-004 Academia Alquileres System & Gamificación

## 1. Resumen de Arquitectura
- **Especificación Asociada**: [spec.md](file:///specs/004-gamification-academia/spec.md)
- **Autor**: @planner (Software Architect + Data Engineer)
- **Alcance**: 
  - Capa de Estado y Dominio: `src/infrastructure/state/gamificationStore.ts` y servicio de cálculo puro `src/core/services/gamification.service.ts`.
  - Capa Pedagógica (Currículum): `src/core/constants/academia-curriculum.ts` con el catálogo completo de botones, acciones, metáforas y flujos de los 12 módulos.
  - Capa de Interfaz (UI): Widget flotante `AcademiaIsland.tsx`, modal enriquecido `AcademiaModal.tsx`, modal pedagógico `GuiaBotonesFlujosModal.tsx` y motor de confeti ligero.
  - Capa de Persistencia Asíncrona: Server Action opcional `sincronizarProgresoGamificationAction` con tabla `gamification_progress` y fallback a `LocalStorage` en Zustand.

---

## 2. Modelo de Datos y Esquemas Zod

### 2.1. Tipos de Dominio y Gamificación
```typescript
export interface InsigniaGamification {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string; // Emoji o Lucide icon name
  puntosXP: number;
  desbloqueada: boolean;
  fechaDesbloqueo?: string;
  modulo: string;
}

export type RangoMaestria = 
  | 'APRENDIZ_TALLER'      // Nivel 1 (0-200 XP)
  | 'OPERADOR_BODEGA'      // Nivel 2 (201-500 XP)
  | 'ASESOR_COMERCIAL'     // Nivel 3 (501-900 XP)
  | 'MAESTRO_CONTRATOS'    // Nivel 4 (901-1400 XP)
  | 'GERENTE_MAQUINARIA';  // Nivel 5 (1401+ XP)

export interface MisionAprendizaje {
  id: string;
  modulo: string;
  titulo: string;
  descripcionApta12: string;
  recompensaXP: number;
  tourId: string;
  ruta: string;
  completada: boolean;
  duracionMinutos: number;
}
```

### 2.2. Esquema de Persistencia Supabase
```sql
CREATE TABLE IF NOT EXISTS gamification_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  puntos_xp INTEGER NOT NULL DEFAULT 0,
  rango_actual VARCHAR(50) NOT NULL DEFAULT 'APRENDIZ_TALLER',
  misiones_completadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  insignias_desbloqueadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  tours_vistos JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_gamification_tenant_user UNIQUE(tenant_id, user_id)
);

ALTER TABLE gamification_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gamification_tenant_isolation" ON gamification_progress
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

---

## 3. Análisis de Impacto y Dependencias
- **Blast Radius**: **Bajo**. Se trata de una capa aditiva de aprendizaje que complementa la interfaz sin alterar la lógica de negocio de los contratos, facturas, caja ni inventario.
- **Componentes Modificados/Integrados**:
  - `src/components/ui/TopNav.tsx`: Integración del badge interactivo de la Academia con XP y rango.
  - `src/components/layout/AppShell.tsx`: Inyección global del widget flotante `AcademiaIsland` y el orquestador de tours.
  - `src/components/alquileres/AlquileresInteractiveIsland.tsx` y `GuiaBotonesModal.tsx`: Reemplazo del modal limitado de botones por el nuevo `GuiaBotonesFlujosModal` que cubre los 12 módulos.
- **Flujos de Ejecución Afectados**:
  - `OnboardingFlow`: Ahora ofrece tours guiados no invasivos y progreso gamificado.

---

## 4. Estructura de Fases y Tareas de Implementación

### Fase 1: Motor de Gamificación & Academia (Core Engine)
- Servicio puro `gamification.service.ts` con funciones de cálculo de nivel, validación de umbrales y adición de XP.
- Suite de pruebas unitarias TDD en `tests/unit/gamification.service.test.ts`.
- Store reactivo `gamificationStore.ts` con persistencia en `LocalStorage` y sincronización asíncrona.
- Componente `AcademiaIsland.tsx` (widget flotante expandible con nivel, barra de progreso y botón de misiones).
- Componente `CelebracionConfetti.tsx` utilizando micro-animaciones CSS y `canvas-confetti` diferido.

### Fase 2: Currículum Pedagógico 360° (Los 12 Módulos Apto 12+)
- Archivo de verdad pedagógica `src/core/constants/academia-curriculum.ts` detallando:
  - 12 Módulos con sus rutas, objetivos y metáforas del mundo real.
  - Más de 40 botones y acciones operativas estructuradas bajo la tríada: 1) ¿Qué hace?, 2) ¿Cuándo usarlo?, 3) ¿Qué pasa tras bambalinas? (inventario y caja).
  - 6 Flujos integrales ("El Viaje de la Maquinaria"):
    1. Del Prospecto a la Cotización Rápida en WhatsApp.
    2. De la Cotización al Contrato y Reserva de Stock.
    3. Despacho y Entrega en Obra.
    4. Retorno e Inspección Técnica Split-Line.
    5. Facturación Periódica Pro-Rata y Cobro.
    6. Caja, Arqueos y Asientos Contables.
- Modal `GuiaBotonesFlujosModal.tsx` con tabs, buscador instantáneo typeahead, atajos de teclado y simulador de conceptos.

### Fase 3: Tours Guiados Interactivos por Módulo
- Integración de los 12 tours paso a paso enlazados a las misiones de la Academia:
  - `tour-dashboard`: Visión de control, KPIs y calendario operativo.
  - `tour-cotizaciones`: Creación de cotización rápida y envío a cliente.
  - `tour-alquileres`: Contratos, líneas de maquinaria y ficha 360°.
  - `tour-bodega`: Kardex, stock disponible y estados de mantenimiento.
  - `tour-devoluciones`: Split-Line y actas de retorno.
  - `tour-facturacion`: Cuentas de cobro y cortes quincenales.
  - `tour-caja`: Apertura, egresos de patio y arqueo de cierre.
  - `tour-subcontrataciones`: Re-renting con aliados y margen de ganancia.
  - `tour-clientes`: Gestión de clientes y cupo de crédito.
  - `tour-ultraadmin`: Gobernanza y directivas de seguridad.
- Conexión del evento `completarTour(tourId)` para acreditar XP (+100 XP) y desbloquear insignias automáticamente.

---

## 5. Estrategia de Pruebas (TDD)
- **Pruebas Unitarias (Vitest)**:
  - `tests/unit/gamification.service.test.ts`: Validación de cálculo de rangos según XP, desbloqueo idempotente de insignias, no duplicación de puntos por tours repetidos y progreso porcentual exacto.
  - `tests/components/AcademiaIsland.test.tsx`: Renderizado del widget, apertura de misiones y visualización de progreso.
  - `tests/components/GuiaBotonesFlujosModal.test.tsx`: Búsqueda reactiva de botones y renderizado de las 3 preguntas pedagógicas.
