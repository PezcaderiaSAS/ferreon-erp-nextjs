# Tech Context — Alquileres System (FerreOn ERP & WMS)

## 1. Stack Tecnológico Principal

| Componente | Tecnología / Versión | Propósito Arquitectónico |
| :--- | :--- | :--- |
| **Framework Fullstack** | Next.js 14.2.5 (App Router) | Servidor de aplicaciones, RSC, Server Actions y enrutamiento perimetral. |
| **Biblioteca UI** | React 18.3.1 | Motor reactivo para renderizado concurrente y streaming con Suspense. |
| **Motor de Base de Datos** | PostgreSQL (Supabase) | Base de datos relacional multi-tenant con Row Level Security (RLS). |
| **ORM / Acceso a Datos** | Prisma 7.10 & Supabase JS 2.112 | Prisma para migraciones y tipado fuerte; Supabase client para auth y RPCs. |
| **Caché y Mensajería** | Upstash Redis 1.34 | Caché distribuida de baja latencia y llaves de bloqueo para idempotencia. |
| **Gestión de Formularios** | React Hook Form 7.85 + Zod 3.23 | Formularios de alto rendimiento y validación de esquemas tipada. |
| **Estilos y Diseño** | Tailwind CSS 3.4.9 + Lucide React | Sistema de diseño atómico basado en tokens CSS de `DESIGN.md`. |
| **Testing** | Vitest 2.0.5 & Playwright 1.46 | Pruebas unitarias de cobertura 80%+ y pruebas E2E de flujos críticos. |

---

## 2. Topología de Conexión a Base de Datos (Supabase)

- **Puerto 6543 (Transaction Pooler - PgBouncer):**
  - **Uso Obligatorio:** Todas las Server Actions, Route Handlers y consultas en tiempo de ejecución en Vercel Serverless.
  - **Propósito:** Evita el agotamiento de conexiones en entornos de alta concurrencia o escalado horizontal efímero.
- **Puerto 5432 (Session Direct):**
  - **Uso Exclusivo:** Scripts de migración, comandos Prisma CLI (`prisma migrate`, `prisma db push`) y conexiones administrativas de UltraAdmin.

---

## 3. Seguridad Multi-Tenant y Políticas RLS

1. **Aislamiento por Fila (Tenant Isolation):**
   - Toda tabla transaccional (`alquileres`, `equipos`, `clientes`, `facturas`, `caja_movimientos`) contiene la columna `empresa_id UUID NOT NULL`.
   - Las políticas SQL de Row Level Security (RLS) impiden que un usuario autenticado lea o modifique registros de otra empresa.
2. **Validación Dual-Layer:**
   - Capa 1: Validación en el servidor de aplicaciones mediante esquemas Zod estrictos.
   - Capa 2: Restricciones de integridad referencial, enums tipados y políticas RLS en PostgreSQL.
3. **Auditoría Inmutable:**
   - Toda operación destructiva o de cambio de estado se registra en la tabla `auditoria_logs` a través de `AuditLogger`.

---

## 4. Estrategia de Caché Distribuida (Redis Upstash)

- **Prefijos de Clave Estructurados:**
  `ferreon:tenant:{empresa_id}:alquileres:active`
  `ferreon:tenant:{empresa_id}:inventario:resumen`
- **Invalidación Automática:**
  Toda mutación de alquiler o stock invoca `invalidateTenantCache(empresaId, prefix)`.
- **TTL Defensivo:**
  Máximo 300 segundos (5 minutos) para catálogos y 60 segundos para resúmenes de KPI.

---

## 5. Convenciones de Fechas y Persistencia Temporal (PostgreSQL)

1. **Campos de Calendario Puro (`DATE`):**
   - Fechas de entrega, inicio de contrato, fin estimado y vencimiento se almacenan como `DATE` (`YYYY-MM-DD`).
   - Sin componente de hora para blindar la fecha contra conversiones implícitas de huso horario en serialización JSON.
2. **Marcas Temporales de Auditoría (`TIMESTAMPTZ`):**
   - Columnas `created_at`, `updated_at`, `auditoria_logs.timestamp` utilizan `TIMESTAMPTZ` en UTC.
   - En frontend y PDFs, se formatean a zona horaria local (`America/Bogota`) con `resolverFechaYHoraDocumento()`.
3. **Módulo Canónico de Utilidades:**
   - Todo cálculo y serialización temporal debe provenir estrictamente de `src/core/utils/fechas.ts`. Prohibido el uso de `moment` o invocaciones no ancladas de `new Date()`.

