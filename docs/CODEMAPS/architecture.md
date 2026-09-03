<!-- Generated: 2026-09-03 | Files scanned: ~65 | Token estimate: ~390 -->
# High-Level Architecture

## Overview
FerreOn-ERP is a Multi-tenant SaaS built using Next.js (App Router), leveraging a Hexagonal Architecture pattern to decouple business rules from framework details, combined with Supabase for Auth, PostgreSQL Database & Realtime WebSockets, and Upstash Redis for multi-tenant caching and edge rate limiting.

## High-Level Boundaries
- **Domain Layer (`src/core/domain`)**: Core business logic and entities (`AlquilerEntity`, `Cliente`, `Equipo`, `EmpresaConfig`). Enforces strict rules (e.g. Split Line technique for partial returns and idempotency).
- **Application Layer (`src/core/application`)**: Use cases orchestrating domain entities (e.g., `CrearEquipo`, `CrearAlquiler`).
- **Infrastructure Layer (`src/infrastructure`)**:
  - Zustand state stores (`alquilerStore`, `clienteStore`, `bodegaStore`, `empresaStore`, `tenantStore`).
  - Adapters & Persistence (`SupabaseClienteRepository`, `server.ts` con cookies `getAll`/`setAll`, `realtimeSync.ts`).
- **Presentation Layer (`src/app`, `src/components`)**: Next.js App Router for views, modular React components for forms, interactive tours, and Neumorphism/Glassmorphism UI ecosystem.

## Data Flow & Multi-Device Sync
1. `User Action (UI)` → `Zustand Optimistic Update` → `Server Action / API Route (SSR Cookies getAll/setAll)` → `PostgreSQL RPC Transaction (FOR UPDATE)`
2. `Supabase Realtime (WebSockets)` → `postgres_changes (equipos, alquileres, clientes)` → `Reactive Zustand Synchronization across all connected devices (<100ms)`
3. `Window Focus / Visibility Change` → `Automated WebSockets Reconnect & Cache-Busted Refresh (Apple Mac / Safari App Nap Protection)`

## Deployment Topology
- **Frontend / API Edge**: Vercel Serverless & Edge Functions.
- **Database & Auth**: Supabase PostgreSQL + Realtime Channels.
- **Cache & Rate Limit**: Upstash Redis (Serverless Multi-Tenant Cache).
