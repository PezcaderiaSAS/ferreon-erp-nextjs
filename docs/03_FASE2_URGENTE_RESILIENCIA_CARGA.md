# FASE 2: RESILIENCIA Y CARGA (CRÍTICO - URGENTE)

> [!CAUTION]
> **ESTADO: CRÍTICO URGENTE**
> Este documento contiene el plan de acción técnico de máxima prioridad para asegurar la estabilidad en producción de FerreOn ERP bajo alta carga. Debe ser ejecutado tan pronto se retome el desarrollo.

## Objetivo Principal
Proteger el límite de conexiones de la base de datos (PostgreSQL/Supabase) y blindar la aplicación contra fallos silenciosos por discrepancias de formato de datos entre el Frontend y el Backend.

---

## 1. Reactivación y Configuración de Caché (Upstash Redis)
**Problema:** Cada carga de catálogo (clientes/equipos) impacta directamente la base de datos, lo que agota el pool de conexiones.
**Solución:**
- Integrar `@upstash/redis` como caché de lectura (Read-Through Cache).
- Almacenar temporalmente respuestas inmutables o de lenta actualización.
- **Acción requerida:**
  1. Revisar y solucionar advertencias de compilación ligadas a `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en Vercel.
  2. Implementar middleware o utilidades en el Server (Next.js) que intercepten la lectura, verifiquen si existe en Redis, y solo de ser necesario, consulten a Supabase.
  3. Establecer políticas de invalidación (Cache Invalidation) cuando se cree/edite un equipo o cliente.

---

## 2. Implementación de Validadores DTO Estrictos (Data Transfer Objects)
**Problema:** Discrepancias de tipado y formato (ej. `snake_case` desde la DB vs `camelCase` en UI) que generan bugs lógicos difíciles de rastrear y fallos asintomáticos.
**Solución:**
- Utilizar esquemas de validación estricta (`Zod`) inmediatamente después del fetch a Supabase en los Server Actions.
- **Acción requerida:**
  1. Crear esquemas Zod de salida (Output DTOs) en la capa de infraestructura (`src/infrastructure/dtos/`).
  2. Aplicar validación estricta `schema.parse(data)` para garantizar que el objeto cumple los requisitos exactos de la UI antes de retornarlo en el Server Action.
  3. Mapear explícitamente atributos (ej. `stock_disponible` -> `stockDisponible`) durante la validación para abstraer a la interfaz de usuario de las implementaciones subyacentes de la DB.

---

## Próximos Pasos (Ciclo Spec-Kit) al retomar:
Al iniciar sesión desde el nuevo equipo, el usuario (o el Agente) debe invocar la siguiente secuencia:
1. `/speckit.specify` -> Usando este archivo como base.
2. `/speckit.plan` -> Para diseñar el código y esquemas.
3. `/speckit.tasks` -> Para dividirlo en unidades granulares a implementar secuencialmente.
