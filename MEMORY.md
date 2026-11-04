# Memoria de Sesión Persistente — Alquileres System

## Estado actual

- **Auditoría Forense y Plan de Mejoras DB Completado (Supabase PostgreSQL)**:
  - Investigación estructural profunda ejecutada con subagente forense, desmintiendo falsos positivos de `harness2` (5/5 tests pasando al 100% con `uv run`).
  - Aislada vulnerabilidad crítica P0 en RLS: clave anónima con permisos de lectura y escritura en `clientes`, `equipos` y `alquileres`.
  - Diseñado y aprobado plan de 6 fases en sesión `/grill-me`, iniciando con Fase 0 (Hotfix RLS Zero-Trust) y reconciliación de 21 contratos históricos.
  - Artefacto generado: `auditoria-estructural-db-plan-mejoras.md`.

## Decisiones (y por qué)

- **Zero-Trust para anonKey (Fase 0)**: Bloqueo total de lectura y escritura anónima en tablas operativas para proteger datos sensibles de clientes y contratos.
- **Unificación Canónica en `empresa_id` (Fase 1)**: Purgar `tenant_id` obsoleto en 11 tablas y blindar contabilidad con scoping multi-tenant.
- **Separación Presupuestado vs Liquidado (Fase 2)**: Soporte nativo para contratos devengados en tiempo real con garantía en custodia y backfill histórico.
- **Sincronización de Prisma (Fase 4)**: Alinear `schema.prisma` con `db pull` sin modelos fantasma de bodegas.

## Aprendizajes y errores a evitar

- El workspace `ferreon-erp-nextjs/harness2` debe ejecutarse siempre con `uv run --project ferreon-erp-nextjs/harness2 --extra dev pytest ...`, no con el venv raíz.
- En PostgreSQL las políticas RLS se acumulan con `OR`: agregar una política restrictiva no revoca una previa con `USING (true)`. Se debe usar `DROP POLICY` explícito.

## Próximos pasos

1. Ejecutar **Fase 0 (P0 Hotfix RLS)** aplicando el script SQL de sellado hermético en Supabase.
2. Validar el bloqueo de peticiones anónimas y verificar con `harness2`.
