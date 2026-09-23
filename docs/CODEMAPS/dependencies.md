<!-- Generated: 2026-09-23 | Files scanned: ~15 | Token estimate: ~620 -->
# Alquileres System - Arquitectura de Dependencias

## Core Framework & Runtime
- **Next.js 14 (v14.2.5)**: App Router, Server Actions, Server Components (RSC) y Streaming Hydration. Compilación limpia de 24 rutas estáticas y dinámicas.
- **React 18 (v18.3.1)**: Biblioteca UI, hooks de concurrencia y memoización (`useCallback`, `useMemo`, `useId`).
- **TailwindCSS (v3.4.9)**: Utilidades de estilo y componentes Glassmorphism según el sistema de diseño corporativo.

## Base de Datos & BaaS
- **Supabase BaaS (PostgreSQL 15)**:
  - `@supabase/ssr (v0.4.1)`: Manejo seguro de autenticación basada en cookies HttpOnly para Next.js App Router.
  - `@supabase/supabase-js (v2.112.4)`: Cliente JavaScript para RPCs transaccionales y mutaciones con RLS.
  - `@supabase/server (v1.4.1)`: Cliente de servidor seguro para operaciones en Server Actions y API Routes.
- **Prisma ORM (v7.10.0)**: Generación de tipos y cliente de datos (`@prisma/client`).

## Estado y Caché Distribuida
- **Zustand (v5.0.15)**: Gestión de estado global y de módulo en cliente con persistencia (`localStorage`), soporte para transiciones optimistas y reconciliación atómica.
- **Upstash Redis (@upstash/redis v1.34.0)**: Caché serverless con invalidación atómica por tenant:
  - Claves de datos: `cache:compras:${tenantId}`, `cache:proveedores:${tenantId}`, `cache:equipos:${tenantId}`, `cache:cotizaciones:${tenantId}`.
  - Gobernanza de licencias: `cache:tenant:${tenantId}:modulos`.
  - Sesiones y revocación forzada: `session:user:${userId}` (<1s tras suspensión por UltraAdmin).

## Motores de Emisión de Documentos y PDF
- **Dual PDF Architecture**:
  1. `@react-pdf/renderer (v3.4.5)`: Generación vectorial en cliente para contratos de alquiler con control estricto de fuentes y márgenes.
  2. Modales de Impresión Nativos HTML / CSS (`@media print`): Comprobantes de Pago Mixto (POS 80mm y Carta), Actas de Devolución con firma, Órdenes de Compra, Cotizaciones y Comprobantes de Arqueo.

## Validación, Seguridad y Utilidades
- **Zod (v3.23.8)**: Esquemas de validación estricta y tipado en tiempo de compilación/ejecución (Security-First) para formularios y Server Actions.
- **Lucide React (v0.428.0)**: Iconografía vectorial para la Landing Page y el ERP.
- **Date-fns (v3.6.0)**: Manipulación de fechas complementaria a las utilidades canónicas de `fechas.ts`.
- **Recharts (v3.10.1)**: Visualización de métricas y gráficas financieras en dashboards.
- **Stripe (v16.8.0)**: Facturación de suscripciones SaaS para empresas clientes.

## Calidad, Testing y Diagnóstico
- **Vitest (v2.0.5)**: Suite de pruebas unitarias y de integración. Cobertura: 53 suites de prueba, 272 tests pasando (100% verde).
- **Playwright (@playwright/test v1.46.0)**: Pruebas End-to-End en navegadores Chromium, Firefox y WebKit.
- **React Doctor (v0.9.14)**: Auditoría de buenas prácticas y rendimiento de componentes React.
- **TypeScript (v5.5.4)**: Verificación estricta de tipos sin emisiones (`tsc --noEmit`).
