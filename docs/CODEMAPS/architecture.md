<!-- Generated: 2026-09-03 | Files scanned: ~60 | Token estimate: ~350 -->
# High-Level Architecture

## Overview
FerreOn-ERP is a Multi-tenant SaaS built using Next.js 14 (App Router), leveraging a Hexagonal Architecture pattern to decouple business rules from framework details, combined with Supabase for Auth & Database, and Upstash Redis for global caching/rate limiting.

## High-Level Boundaries
- **Domain Layer (`src/core/domain`)**: Core business logic and entities (`AlquilerEntity`, `Cliente`, `Equipo`, `EmpresaConfig`). Enforces strict rules (e.g. Split Line technique for partial returns).
- **Application Layer (`src/core/application`)**: Use cases orchestrating domain entities (e.g., `CrearEquipo`).
- **Infrastructure Layer (`src/infrastructure`)**: Zustand state stores (`alquilerStore`, `clienteStore`, `empresaStore`) and Adapters (e.g., Supabase repositories).
- **Presentation Layer (`src/app`, `src/components`)**: Next.js App Router for views, modular React components for forms, interactive nested tours, and Neumorphism UI ecosystem.

## Data Flow
`User Action (UI)` → `Zustand Store` → `Domain Entity` → `Zustand Update` → `Infrastructure Adapter (Supabase)`

## Deployment Topology
- **Frontend / API Edge**: Vercel Serverless & Edge Functions.
- **Database & Auth**: Supabase PostgreSQL.
- **Cache**: Upstash Redis (Serverless).
