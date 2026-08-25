<!-- Generated: 2026-08-25 | Files scanned: ~60 | Token estimate: ~600 -->
# Arquitectura del Sistema (FerreOn ERP)

## Rutas API Principales
POST /api/auth/callback → Exchange OAuth code for Supabase Session
GET  /api/usuarios → Admin Client (Service Role) → listUsers()
GET/POST/PUT/DELETE /api/clientes → Supabase + Upstash Redis Cache (Cache-Aside)
GET/POST/PUT/DELETE /api/equipos → Supabase + Upstash Redis Cache (Cache-Aside)
GET/POST/PUT/DELETE /api/alquileres → Supabase + Upstash Redis Cache (Cache-Aside)

## Archivos Clave
- `src/middleware.ts` (RBAC routing, Edge runtime)
- `src/infrastructure/persistence/supabase/server.ts` (SSR Supabase Client)
- `src/lib/redis.ts` (Upstash Redis Client)
- `src/lib/idempotency.ts` (IdempotencyManager para evitar double-clicks en UI)
- `src/infrastructure/state/*Store.ts` (Zustand Stores con Rollback Optimista 0ms)

## Dependencias y Servicios Externos
- Supabase Auth (SSO, Magic Links, Users)
- PostgreSQL via Supabase (Primary Datastore)
- Upstash Redis (Serverless Caching)
- Next.js App Router
- Zustand (Global State Management)
