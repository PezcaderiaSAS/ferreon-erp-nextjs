# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **SPEC-010 Desplegado en Producción (100% Completado)**:
  - **Fase 1 (Mostrador POS <30s)**: RPC `alquiler_crear_pos_rapido_v1`, `MostradorPosModal` con escaneo de código/SKU (7/7 tests).
  - **Fase 2 (Cotizaciones 1-Clic POS)**: RPC `cotizacion_convertir_pos_1clic`, `QuickConvertModal` con `Ctrl+Enter` (7/7 tests).
  - **Fase 3 (Adendas Versionadas v1.0 -> v1.1)**: Tabla `alquiler_adendas`, RPC `alquiler_generar_adenda_transaccional_v1`, `EditarContratoAdendaModal` (7/7 tests).
  - **Fase 4 (Devoluciones & Averías)**: Tabla `catalogo_averias_equipos`, RPC `devolucion_pos_inspeccion_rapida_v1`, `DevolucionPosChecklistView` con semáforo táctil y cruce de garantía (8/8 tests).
  - **Fase 5 (QA & Despliegue)**: Inspección DevTools 1366x768 y 375px certificada, 29/29 tests unitarios aprobados, commit `e3ee4b5` y `git push origin main` exitoso.
- **Framework harness2**: Inicializado localmente en Python 3.12 (`uv venv`), 5/5 tests pytest aprobados.
- **Seguridad y Tipado**: 0 errores en `tsc --noEmit`, PostgreSQL RLS y auditoría inmutable en `AuditLogger`.

## Decisiones (y por qué)
- **Adendas In-Place con Snapshots JSONB**: Preserva el histórico contractual sin fragmentar el consecutivo del contrato padre.
- **Semáforo Táctil de Recepción**: Permite liquidar devoluciones en < 1 minuto cruzando averías directamente contra el depósito en garantía y caja (reembolso o cobro).
- **Bloqueo Pesimista en Equipos**: `SELECT ... FOR UPDATE` a nivel de fila asegura tolerancia cero a sobreventa concurrente.

## Aprendizajes y errores a evitar
- En `useToastStore`, usar `addToast({ title, message, type })` o los métodos tipados `showSuccessToast/showErrorToast`.
- Proteger siempre aserciones de test con optional chaining (`response.data?.id`).
- Mantener siempre `MEMORY.md` en $\le 50$ líneas.

## Próximos pasos
- Monitorear el despliegue automático en Vercel y verificar logs en producción.
- Proceder con los siguientes requerimientos o módulos según prioridades del usuario.
