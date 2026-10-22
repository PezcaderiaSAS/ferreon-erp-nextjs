# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **Fase 1 de SPEC-010 Completada (Mostrador POS <30s)**:
  - `TASK-010-01`: Migración `20261022_pos_rapido_rpc.sql` (`alquiler_crear_pos_rapido_v1`) con inserción de cliente On-The-Fly, bloqueo pesimista `FOR UPDATE` y registro en `movimientos_caja`.
  - `TASK-010-02`: Server Action `crearAlquilerRapidoPosAction` con Zod, auditoría `AuditLogger` e invalidación Redis.
  - `TASK-010-03`: Modal reactivo `MostradorPosModal` con escaneo de SKU/código de barras, atajos `F2`, `F4`, `F9` e integrado a `AlquileresInteractiveIsland`.
  - `TASK-010-04`: Suite TDD `tests/unit/pos-alquiler-rapido.test.ts` (7/7 tests aprobados en 16ms). 0 errores en `tsc --noEmit`.
- **Fase 2 de SPEC-010 Completada (Cotizaciones & Conversión 1-Clic POS)**:
  - `TASK-010-05`: Migración `20261022_cotizacion_convertir_pos_1clic.sql` con bloqueo `FOR UPDATE`, descuento atómico de stock y abono en `movimientos_caja`.
  - `TASK-010-06`: Server Action `convertirCotizacionAContratoPosAction` con Zod, `safeRevalidatePath`, `AuditLogger` y Redis.
  - `TASK-010-07`: Componente `QuickConvertModal` integrado a `CotizacionesInteractiveIsland` con atajo `Ctrl+Enter`.
  - `TASK-010-08`: Suite TDD `tests/unit/cotizaciones-conversion-pos.test.ts` (7/7 tests aprobados en 23ms). 0 errores en `tsc --noEmit`.
- **Firma Digital del Emisor (TASK-011)**: Operativa en cuentas de cobro y contratos con toggle interactivo y canvas alfa.
- **Aislamiento Multi-Tenant (SPEC-009)**: Dual-Layer Defense activa en producción.

## Decisiones (y por qué)
- **Inserción On-The-Fly en RPC**: Elimina viajes de red permitiendo despachar en <30s clientes nuevos en mostrador.
- **Bloqueo Pesimista en Equipos**: `SELECT ... FOR UPDATE` a nivel de fila asegura tolerancia cero a sobreventa concurrente.
- **safeRevalidatePath**: Aísla revalidaciones de Next.js en entornos de test sin distorsionar el RequestStore.

## Aprendizajes y errores a evitar
- Los objetos `ClienteUI` usan la convención `nit_cedula` (snake_case) de la base de datos; evitar mezclar con `nitCedula` en filtros.
- Siempre proteger con optional chaining (`response.data?.id`) las aserciones de pruebas donde el tipo de respuesta sea una unión de éxito/error.

## Próximos pasos
- Iniciar la **Fase 3 de SPEC-010 (Ediciones In-Place y Control de Adendas Versionadas)**:
  - `TASK-010-09`: DDL `alquiler_adendas` y RPC `alquiler_generar_adenda_transaccional_v1`.
  - `TASK-010-10`: Server Action `generarAdendaContratoAction` en `alquileres.ts`.
  - `TASK-010-11`: Componente UI `EditarContratoAdendaModal`.
  - `TASK-010-12`: Suite TDD `tests/unit/alquiler-adendas-versionadas.test.ts`.
