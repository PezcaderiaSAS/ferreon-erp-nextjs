# 🧠 STATUS.md — Repositorio de Conciencia (`C://GHOST v3.0 Universal`)

> **Regla de Ventana Deslizante (Protocolos 0 y 4):** Escritura exclusiva del Estratega Principal. **Máximo estricto: 100 líneas** (validado automáticamente por `stop-gate.sh`). Conservar solo las últimas 5 tareas completadas; archivar el historial anterior en `CHANGELOG.md`.

## 📍 Estado Global del Proyecto
- **Proyecto:** Alquileres System (FerreOn ERP & WMS SaaS Multi-Tenant)
- **Fase Actual:** 🟢 FASE ACTIVA: SPEC-018 — Logística, Rutas y Matriz de Fletes Bucaramanga
- **Estado del Gate (Protocolo 7):** 🟢 Build y Pruebas en Verde (32/32 rutas, 13/13 Vitest, 3/3 RLS Cloud, 5/5 Harness²)

## 🎯 Tarea Activa (En Curso)
- [ ] **TASK-018-05 (Server Actions):** Desarrollar `src/app/actions/logistica.ts` (< 80 líneas por acción) con validación Zod, `AuditLogger.logAsync`, revalidación de ruta y caché Upstash Redis.

## 🗺️ Mapa de Módulos del Sistema
| Módulo / Capa | Estado | Skill Asociada | Notas |
| :--- | :---: | :--- | :--- |
| **1. Alquileres & Contratos** | 🟢 Certificado | `nextjs-frontend-erp` | RSC + Client Island + RPC pesimista WMS |
| **2. Maquinaria & Inventario** | 🟢 Certificado | `postgres-transaction-guard` | Stock entero, Kardex inmutable y Bodega |
| **3. Caja & Arqueos POS** | 🟢 Certificado | `postgres-transaction-guard` | Sesiones de caja y arqueos ciegos |
| **4. Devoluciones & Taller** | 🟢 Certificado | `ferreon-split-line-and-modals`| Split-line, multas y reparación |
| **5. Facturación & Cuentas Cobro**| 🟢 Certificado | `alquileres-pdf-engine` | COP entero estricto, Art. 616-1 / 437 |
| **6. Compras & Proveedores** | 🟢 Certificado | `nextjs-frontend-erp` | Orden de compra, PMP y ledger pasivos |
| **7. Subcontrataciones** | 🟢 Certificado | `ferreon-split-line-and-modals`| Re-renting On-The-Fly ante overbooking |
| **8. Logística & Rutas BGA** | 🟡 En Desarrollo | `speckit-workflow` | SPEC-018: Fase 1 (TDD) y Fase 2 (DDL) listas |

## 📋 Backlog Priorizado
1. **TASK-018-05:** Server Actions en `src/app/actions/logistica.ts`.
2. **TASK-018-06:** RSC y Skeleton en `src/app/logistica/page.tsx` con Suspense.
3. **TASK-018-07:** Client Island `LogisticaInteractiveIsland.tsx` con timeline de paradas.
4. **TASK-018-08:** Modales operativos `CrearRutaModal.tsx` y `RegistrarEvidenciaModal.tsx`.
5. **TASK-018-09:** Integración de zonas de Bucaramanga en Wizard `StepEquiposLogistica.tsx`.

## ✅ Últimas 5 Tareas Completadas (Ventana Deslizante)
1. **[2026-11-25] [C-GHOST-V3]:** Siembra y adaptación universal de C://GHOST Brain v3.0 (Memoria Viva, Protocolos 0-10, Zero-Trust Gate y ADR-0006).
2. **[2026-11-10] [DESPLIEGUE-PROD]:** Ejecución exitosa de migraciones P0-P2 en Supabase Cloud (`eqruvswlpsttuyuglwts`) y push a `main` (commit `ad9a26d` / `9c78bff`).
3. **[2026-11-10] [SPEC-018-F2]:** Capa de Base de Datos y Prisma para Rutas y Zonas de Bucaramanga (`20261110_modulo_rutas_y_fletes_bucaramanga.sql` + Prisma Client).
4. **[2026-11-10] [SPEC-018-F1]:** Dominio puro TDD `LogisticaRutasService` con tarificación COP, cubicaje y secuenciación (13/13 tests en verde).
5. **[2026-11-04] [HARDENING-P0-P2]:** Blindaje RLS Zero-Trust, tenencia referencial y constraints COP enteros en todas las tablas transaccionales.
