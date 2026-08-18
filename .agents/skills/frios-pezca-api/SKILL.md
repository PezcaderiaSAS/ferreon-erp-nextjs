---
name: frios-pezca-api
description: Convenciones para API Routes en Next.js (App Router), Middlewares, Autenticación Supabase y Manejo de Errores.
---

# API Routes y Protocolo HTTP (FerreOn ERP Next.js)

## 1. Convención de Rutas y Métodos HTTP
Las API Routes residen en `src/presentation/app/api/` siguiendo la estructura RESTful / Clean Architecture:
- `GET /api/alquileres`: Listado de contratos con paginación y filtros.
- `POST /api/alquileres`: Creación de contrato de alquiler y sus renglones.
- `GET /api/alquileres/[id]`: Detalle del alquiler por UUID.
- `POST /api/facturas/[id]/pdf`: Endpoint serverless para generar y almacenar el PDF de la factura/cuenta de cobro.
- `POST /api/cron/rotar-logs`: Endpoint de mantenimiento invocado periódicamente por Vercel Cron.

## 2. Involución de Middleware y Autenticación Supabase
- Cada petición protegida extrae el token JWT mediante `@supabase/ssr`.
- Si el usuario no está autenticado, la API Route retorna `401 Unauthorized`.
- Si el rol del usuario no tiene permisos en RLS, PostgreSQL rechaza la transacción y la API Route retorna `403 Forbidden`.

## 3. Envelope Estándar de Respuesta HTTP
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-08-18T07:00:00Z"
  }
}
```
