# 🧠 STATUS.md — Repositorio de Conciencia (`C://GHOST v3.0 Universal`)

> **Regla de Ventana Deslizante (Protocolos 0 y 4):** Escritura exclusiva del Estratega Principal. **Máximo estricto: 100 líneas** (validado automáticamente por `stop-gate.sh`). Conservar solo las últimas 5 tareas completadas; archivar el historial anterior en `CHANGELOG.md`.

## 📍 Estado Global del Proyecto
- **Proyecto:** Alquileres System (FerreOn ERP & WMS SaaS Multi-Tenant)
- **Fase Actual:** 🟢 FASE CERTIFICADA: SPEC-018 — Logística, Rutas y Matriz de Fletes Bucaramanga
- **Estado del Gate (Protocolo 7):** 🟢 Build y Pruebas en Verde (0 errores TS, 13/13 Vitest, 5/5 Harness², Prisma Válido)

## 🎯 Tarea Activa (En Curso)
- [x] **TASK-018 (Módulo Completo):** SPEC-018 completado al 100% (Fases 1 a 4). UI `/logistica`, Hojas de Ruta, Evidencia GPS y Asistente en Wizard.
- [ ] **TASK-SIGUIENTE:** Revisión de despliegue a producción o siguiente hito del backlog WMS.

## 🗺️ Mapa de Módulos del Sistema
| Módulo / Capa | Estado | Skill Asociada | Notas |
| :--- | :---: | :--- | :--- |
| **1. Alquileres & Contratos** | 🟢 Certificado | `nextjs-frontend-erp` | RSC + Client Island + Asistente Fletes BGA |
| **2. Maquinaria & Inventario** | 🟢 Certificado | `postgres-transaction-guard` | Stock entero, Kardex inmutable y Bodega |
| **3. Caja & Arqueos POS** | 🟢 Certificado | `postgres-transaction-guard` | Sesiones de caja y arqueos ciegos |
| **4. Devoluciones & Taller** | 🟢 Certificado | `ferreon-split-line-and-modals`| Split-line, multas y reparación |
| **5. Facturación & Cuentas Cobro**| 🟢 Certificado | `alquileres-pdf-engine` | COP entero estricto, Art. 616-1 / 437 |
| **6. Compras & Proveedores** | 🟢 Certificado | `nextjs-frontend-erp` | Orden de compra, PMP y ledger pasivos |
| **7. Subcontrataciones** | 🟢 Certificado | `ferreon-split-line-and-modals`| Re-renting On-The-Fly ante overbooking |
| **8. Logística & Rutas BGA** | 🟢 Certificado | `speckit-workflow` | SPEC-018: Dominio TDD, DDL, Server Actions y UI/UX `/logistica` |

## 📋 Backlog Priorizado
1. **TASK-SIG-01:** Verificación de despliegue de rutas en producción Supabase Cloud.
2. **TASK-SIG-02:** Reportes de rendimiento de combustible y fletes mensuales en PDF.
3. **TASK-SIG-03:** Notificación por WhatsApp al cliente al iniciar cargue y ruta hacia obra.

## ✅ Últimas 5 Tareas Completadas (Ventana Deslizante)
1. **[2026-11-25] [SPEC-018-F4]:** UI/UX Linear High-Density `/logistica`, Hojas de Ruta, Evidencia GPS/Fotos y Asistente WMS Bucaramanga en Wizard.
2. **[2026-11-25] [SPEC-018-F3]:** Implementadas Server Actions de Logística en `src/app/actions/logistica.ts` (Zod + AuditLogger + Redis) y 0 errores de compilación TS.
3. **[2026-11-25] [C-GHOST-V3]:** Siembra y adaptación universal de C://GHOST Brain v3.0 (Memoria Viva, Protocolos 0-10, Zero-Trust Gate y ADR-0006).
4. **[2026-11-10] [DESPLIEGUE-PROD]:** Ejecución exitosa de migraciones P0-P2 en Supabase Cloud (`eqruvswlpsttuyuglwts`) y push a `main` (commit `ad9a26d` / `9c78bff`).
5. **[2026-11-10] [SPEC-018-F2]:** Capa de Base de Datos y Prisma para Rutas y Zonas de Bucaramanga (`20261110_modulo_rutas_y_fletes_bucaramanga.sql` + Prisma Client).
