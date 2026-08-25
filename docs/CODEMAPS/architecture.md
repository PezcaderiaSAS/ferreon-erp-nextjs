<!-- Generated: 2026-08-24 | Files scanned: ~50 | Token estimate: ~500 -->
# Backend Architecture

## Routes
POST /api/auth/callback → Exchange OAuth code for Supabase Session
GET  /api/usuarios → Admin Client (Service Role) → listUsers()
POST /api/usuarios → Admin Client (Service Role) → createUser()
PUT  /api/usuarios → Admin Client (Service Role) → updateUserById()

## Key Files
- `src/middleware.ts` (RBAC routing, Edge runtime)
- `src/app/api/usuarios/route.ts` (User Management with Service Role, 150 lines)
- `src/infrastructure/persistence/supabase/server.ts` (SSR Supabase Client, 50 lines)

## Dependencies
- Supabase Auth (SSO, Magic Links, Users)
- PostgreSQL via Supabase (Primary Datastore)
- Next.js App Router
