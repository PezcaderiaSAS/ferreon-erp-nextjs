# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **SPEC-010: Fases 1, 2, 3 y 4 Completadas (Core Operativo POS 100% Funcional)**:
  - **Fase 1 (Mostrador POS <30s)**: RPC `alquiler_crear_pos_rapido_v1`, `MostradorPosModal` con escaneo de código/SKU y suite TDD (7/7 tests).
  - **Fase 2 (Cotizaciones 1-Clic POS)**: RPC `cotizacion_convertir_pos_1clic`, `QuickConvertModal` con `Ctrl+Enter` y suite TDD (7/7 tests).
  - **Fase 3 (Adendas Versionadas v1.0 -> v1.1)**: Tabla `alquiler_adendas`, RPC `alquiler_generar_adenda_transaccional_v1`, `EditarContratoAdendaModal` y suite TDD (7/7 tests).
  - **Fase 4 (Devoluciones & Averías)**: Tabla `catalogo_averias_equipos`, RPC `devolucion_pos_inspeccion_rapida_v1`, `DevolucionPosChecklistView` con semáforo táctil (🟢🟡🟠🔴) y liquidación de garantía contra caja (8/8 tests).
- **Cobertura de Pruebas**: 29/29 tests unitarios aprobados en 84ms. 0 errores en `tsc --noEmit`.
- **Aislamiento Multi-Tenant & Seguridad**: Dual-Layer Defense activa con auditoría inmutable en `AuditLogger`.

## Decisiones (y por qué)
- **Adendas In-Place con Snapshots JSONB**: Preserva el histórico contractual sin fragmentar el consecutivo del contrato padre.
- **Semáforo Táctil de Recepción**: Permite liquidar devoluciones en < 1 minuto cruzando averías directamente contra el depósito en garantía y caja (reembolso o cobro).
- **Bloqueo Pesimista en Equipos**: `SELECT ... FOR UPDATE` a nivel de fila asegura tolerancia cero a sobreventa concurrente en despachos, conversiones y adendas.
- **safeRevalidatePath**: Aísla revalidaciones de Next.js en entornos de test sin distorsionar el RequestStore.

## Aprendizajes y errores a evitar
- Los objetos `ClienteUI` usan la convención `nit_cedula` (snake_case) de la base de datos; evitar mezclar con `nitCedula` en filtros.
- Siempre proteger con optional chaining (`response.data?.id`) las aserciones de pruebas donde el tipo de respuesta sea una unión de éxito/error.
- En `useToastStore`, usar `addToast({ title, message, type })` o los métodos tipados `showSuccessToast/showErrorToast`.

## Próximos pasos
- Ejecutar Fase 5 de SPEC-010:
  - `TASK-010-17`: Inspección Chrome DevTools en 1366x768 (mostrador) y 375px (móvil bodega).
  - `TASK-010-18`: Verificación E2E y compilación global.
  - `TASK-010-19 & 20`: Actualización de gobernanza, commit formal de Fases 3 y 4, y preparación para despliegue productivo.
