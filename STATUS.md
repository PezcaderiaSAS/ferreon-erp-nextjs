# 🧠 STATUS.md — Repositorio de Conciencia (`C://GHOST v3.0 Universal`)

> **Regla de Ventana Deslizante (Protocolos 0 y 4):** Escritura exclusiva del Estratega Principal. **Máximo estricto: 100 líneas** (validado automáticamente por `stop-gate.sh`). Conservar solo las últimas 5 tareas completadas; archivar el historial anterior en `CHANGELOG.md`.

## 📍 Estado Global del Proyecto
- **Proyecto:** Alquileres System (FerreOn ERP & WMS SaaS Multi-Tenant)
- **Fase Actual:** 🟢 FASE CERTIFICADA: Sprint de Remediación, Seguridad, UX & Hardening DevOps (FE-001..OPS-001 & SUB-001..SUB-004)
- **Estado del Gate (Protocolo 7):** 🟢 Build y Pruebas en Verde (0 errores TS, 30/30 Vitest, 5/5 Harness², Prisma Válido)

## 🎯 Tarea Activa (En Curso)
- [x] **DESPLIEGUE-MAIN:** Despliegue a producción ejecutado en GitHub `main` (`a3391f4`), disparando CI/CD automático en Vercel.
- [ ] **TASK-SIGUIENTE:** Ejecución de migraciones DDL (`20261126_*.sql`) en Supabase Cloud producción.

## 🗺️ Mapa de Módulos del Sistema
| Módulo / Capa | Estado | Skill Asociada | Notas |
| :--- | :---: | :--- | :--- |
| **1. Alquileres & Contratos** | 🟢 Certificado | `nextjs-frontend-erp` | RSC + Client Island + Consecutivos `COT-YYYY-XXXX` |
| **2. Maquinaria & Inventario** | 🟢 Certificado | `postgres-transaction-guard` | Stock entero, RLS blindada y Kardex inmutable |
| **3. Caja & Arqueos POS** | 🟢 Certificado | `postgres-transaction-guard` | Sesiones de caja y arqueos ciegos |
| **4. Devoluciones & Taller** | 🟢 Certificado | `ferreon-split-line-and-modals`| Split-line, multas y sincronización bodega aliado |
| **5. Facturación & Cuentas Cobro**| 🟢 Certificado | `alquileres-pdf-engine` | COP entero estricto, Art. 616-1 / 437 |
| **6. Compras & Proveedores** | 🟢 Certificado | `nextjs-frontend-erp` | Orden de compra, PMP y ledger pasivos |
| **7. Subcontrataciones** | 🟢 Certificado | `ferreon-split-line-and-modals`| Rentabilidad tri-estado, seriales y moneda COP |
| **8. Logística & Rutas BGA** | 🟢 Certificado | `speckit-workflow` | SPEC-018: Dominio TDD, DDL, Server Actions y UI `/logistica` |

## 📋 Backlog Priorizado
1. **TASK-SIG-01:** Ejecución de migraciones DDL (`20261126_*.sql`) en Supabase Cloud producción.
2. **TASK-SIG-02:** Despliegue de producción con variables de entorno validadas en Vercel.
3. **TASK-SIG-03:** Reportes de rendimiento de combustible y fletes mensuales en PDF.

## ✅ Últimas 5 Tareas Completadas (Ventana Deslizante)
1. **[2026-11-26] [REMEDIACION-OPS]:** Corrección FE-001 (paginador cotizaciones), DB-001 (consecutivos correlativos), SUB-001..004 (rentabilidad, seriales, sincronización retorno, COP), BE-001 (RLS inventario) y OPS-001 (robots/headers/env).
2. **[2026-11-25] [SPEC-018-F4]:** UI/UX Linear High-Density `/logistica`, Hojas de Ruta, Evidencia GPS/Fotos y Asistente WMS Bucaramanga en Wizard.
3. **[2026-11-25] [SPEC-018-F3]:** Implementadas Server Actions de Logística en `src/app/actions/logistica.ts` (Zod + AuditLogger + Redis) y 0 errores de compilación TS.
4. **[2026-11-25] [C-GHOST-V3]:** Siembra y adaptación universal de C://GHOST Brain v3.0 (Memoria Viva, Protocolos 0-10, Zero-Trust Gate y ADR-0006).
5. **[2026-11-10] [DESPLIEGUE-PROD]:** Ejecución exitosa de migraciones P0-P2 en Supabase Cloud (`eqruvswlpsttuyuglwts`) y push a `main` (commit `ad9a26d` / `9c78bff`).
