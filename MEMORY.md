# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- **Tarea B1 Completada (SPEC-012 Mantenimiento Preventivo y Horómetros)**:
  - `MantenimientoPreventivoService` con 12 tests unitarios pasando al 100% en Vitest (semáforos `OK`, `PROXIMO`, `VENCIDO`, porcentajes, liquidación de devoluciones y reseteo).
  - Server Action `registrarMantenimientoPreventivoAction` con validación Zod desacoplada, traspaso atómico de `stock_mantenimiento` a `stock_disponible`, asiento inmutable en `kardex_inventario` (`MANTENIMIENTO_PREVENTIVO`), invalidación de caché y `AuditLogger`.
  - Componentes UI: `BarraVidaUtilEquipo` y `RegistrarMantenimientoModal` con diseño responsive integrados en `BodegaInteractiveIsland` y Poka-Yoke en `MostradorPosModal`.
  - Verificado con Chrome DevTools en Laptop (1366x768) y Móvil (375px) con 0 errores de consola.
  - Compilación `tsc --noEmit` y `npm run build` en código 0. Commit `23d8968f` pusheado a `main`.

## Decisiones (y por qué)
- **Desacoplar Esquemas Zod de Actions**: Ubicar esquemas en `src/core/domain/schemas/` previene la restricción del compilador `'use server'` en Next.js.
- **Asiento Inmutable de Mantenimiento en Kardex**: Registrar `MANTENIMIENTO_PREVENTIVO` en `kardex_inventario` garantiza auditoría WMS completa de la vida útil del activo.
- **Semáforo Poka-Yoke en POS**: Advertir en el mostrador si un equipo tiene service vencido previene despachos de maquinaria con desgaste crítico.

## Aprendizajes y errores a evitar
- Los scripts MSYS/sh de Git (pre-commit hooks) fallan con `NtCreateDirectoryObject: 0xC0000022` en el sandbox de Windows; siempre ejecutar `git commit` y `git push` con `BypassSandbox: true`.
- Recordar añadir nuevos tipos de acción a `AuditActionType` en `src/core/domain/entities/audit-log.ts` para mantener coherencia de tipos estricta.

## Próximos pasos
1. Proceder con la **Tarea B2**: Módulo de Firma Digital Touch en Pantalla para el Cliente en Alquileres y Mostrador POS.
2. Proceder con la **Tarea B3**: Motor de Tarifas Dinámicas por Días Hábiles vs Calendario con Exclusión de Domingos/Festivos.
