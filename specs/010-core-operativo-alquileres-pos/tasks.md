# Tareas de Implementación Atómica (TDD): SPEC-010
## Plan Maestro Empresarial: Core Operativo de Alquileres de Inicio a Fin (Modo POS)

## Fase 1: Motor Mostrador POS & Captura Rápida (< 30 Segundos) [x]
- [x] **TASK-010-01 (Backend/RPC)**: Crear función RPC `alquiler_crear_pos_rapido_v1` en Supabase con inserción atómica de cliente On-The-Fly, líneas de equipos con descuento inmediato de stock y movimiento de depósito en sesión de caja abierta.
- [x] **TASK-010-02 (Server Action & Zod)**: Implementar `crearAlquilerRapidoPosAction` en `src/app/actions/alquileres.ts` con validación Zod ultra-rápida, caché Redis y auditoría `AuditLogger`.
- [x] **TASK-010-03 (UI Component)**: Construir la vista y modal `MostradorPosModal` con barra de búsqueda rápida por Código de Barras / SKU (`EQ-xxx`), selector instantáneo de cliente y atajos de teclado (`F2: Cliente`, `F4: Equipos`, `F9: Cobrar`).
- [x] **TASK-010-04 (TDD)**: Escribir suite de pruebas unitarias `tests/unit/pos-alquiler-rapido.test.ts` validando respuesta en < 200ms y atomicidad de caja.

## Fase 2: Flujo Comercial de Cotizaciones & Conversión 1-Clic POS [ ]
- [ ] **TASK-010-05 (Backend/RPC)**: Diseñar y desplegar la RPC `cotizacion_convertir_pos_1clic` que valide stock concurrente, cambie estado a `CONVERTIDA`, genere contrato y registre el depósito en caja en una sola transacción.
- [ ] **TASK-010-06 (Server Action)**: Implementar `convertirCotizacionAContratoPosAction` en `src/app/actions/cotizaciones.ts` blindada con `empresa_id` estricto e invalidación de caché por tenant.
- [ ] **TASK-010-07 (UI)**: Diseñar el modal compacto `QuickConvertModal` en el listado de cotizaciones con preview de disponibilidad de equipos y selector de método de pago del depósito en 1 clic.
- [ ] **TASK-010-08 (TDD)**: Crear suite `tests/unit/cotizaciones-conversion-pos.test.ts` probando prevención de overbooking y generación simultánea de contrato + comprobante.

## Fase 3: Ediciones In-Place y Control de Adendas Versionadas [ ]
- [ ] **TASK-010-09 (Migración BD)**: Crear tabla `alquiler_adendas` y función RPC `alquiler_generar_adenda_transaccional_v1` para registrar prórrogas y adición/retiro de equipos sin romper el contrato original.
- [ ] **TASK-010-10 (Server Action)**: Desarrollar `generarAdendaContratoAction` en `src/app/actions/alquileres.ts` recalculando saldos pendientes, fletes y stock en obra.
- [ ] **TASK-010-11 (UI)**: Implementar el modal de edición `EditarContratoAdendaModal` con historial visual de versiones (`v1.0 -> v1.1`) y desglose claro de cargos adicionales.
- [ ] **TASK-010-12 (TDD)**: Escribir pruebas en `tests/unit/alquiler-adendas-versionadas.test.ts` verificando integridad de saldos y trazabilidad de snapshots JSONB.

## Fase 4: Devoluciones de Equipos con Checklist de Averías & Liquidación [ ]
- [ ] **TASK-010-13 (Migración BD)**: Crear tabla `catalogo_averias_equipos` con costos sugeridos para limpieza, daños mecánicos y reposiciones.
- [ ] **TASK-010-14 (Backend/RPC)**: Extender `procesar_devolucion_avanzada` para incorporar el desglose paramétrico de averías y el cruce financiero directo contra el depósito en garantía.
- [ ] **TASK-010-15 (UI Component)**: Construir `DevolucionPosChecklistView` con semáforo táctil por ítem (Verde: Bueno, Amarillo: Sucio, Naranja: Dañado, Rojo: Pérdida) y cálculo instantáneo de saldo a favor o en contra del cliente.
- [ ] **TASK-010-16 (TDD)**: Implementar `tests/unit/devolucion-pos-inspeccion.test.ts` validando cálculos de retención de garantía y movimientos de egreso/ingreso en caja.

## Fase 5: QA Integral, Chrome DevTools y Certificación de Producción [ ]
- [ ] **TASK-010-17 (QA Laptop & Móvil)**: Inspección visual y operativa en vivo con Chrome DevTools MCP en resoluciones 1366x768 (mostrador) y 375px (móvil bodega) garantizando 0 errores y 0 desbordamientos.
- [ ] **TASK-010-18 (TypeScript & E2E)**: Ejecutar `npx tsc --noEmit` y suite global de Vitest asegurando 100% de tests aprobados.
- [ ] **TASK-010-19 (Gobernanza & Memoria)**: Actualizar Hindsight MCP (`retain`) y `MEMORY.md`.
- [ ] **TASK-010-20 (Despliegue)**: Commit formal y push a producción en Vercel y Supabase.
