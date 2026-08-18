# Especificación de Infraestructura Tecnológica (TID) — `alquileres_app`

**Módulo Core:** `alquileres_app`  
**Proyecto:** FerreOn ERP  
**Versión:** 1.0.0  
**Estándar:** Spec-Driven Development ($0 USD Cost Tier Architecture)  
**Fecha:** 2026-08-18  

---

## 1. Arquitectura de Infraestructura Serverless ($0 USD Cost Tier)

### 1.1 Diagrama de Topología Cloud (Vercel + Supabase)

```text
[ Cliente Web / Mobile Browser ]
             │
             │ HTTPS (TLS 1.3 / HSTS)
             ▼
[ Vercel Edge Network / Serverless ] ───> [ Vercel Cron Jobs ]
   │ Next.js App Router (Middleware)          (/api/cron/rotar-logs)
   │
   ├─────── JWT Auth Check ───────┐
   │                              │
   ▼                              ▼
[ Supabase Auth ]        [ Supabase PostgreSQL ]
(Email/Pass + OAuth)     (DDL + RLS Policies + ACID)
   │                              │
   └──────────────┬───────────────┘
                  ▼
       [ Supabase Storage ]
       (Bucket 'documentos-pdf')
```

---

## 2. Definición de Capacidad y Cuotas Gratuitas ($0 USD)

| Componente | Servicio / Provider | Cuota Gratuita Incluida | Consumo Estimado FerreOn ERP | Estado de Capacidad |
|---|---|---|---|---|
| Cómputo API & Frontend | Vercel Hobby Tier | 100 GB Bandwidth, Serverless Functions (10s limit) | ~ 5 GB Bandwidth / mes, peticiones API < 300 ms | 🟢 holgado (5% cuota) |
| Base de Datos Relacional | Supabase PostgreSQL | 500 MB Almacenamiento DB, Conexiones Directas / Pooler | ~ 25 MB / año (Operación PYME local) | 🟢 Holgado (5% cuota) |
| Autenticación | Supabase Auth | 50,000 Usuarios Activos Mensuales (MAU) | < 50 Usuarios Operativos | 🟢 Holgado (< 1% cuota) |
| Almacenamiento de PDFs | Supabase Storage | 1 GB Bucket Storage, 2 GB Egress | ~ 200 MB / año (PDFs generados en memoria) | 🟢 Holgado (20% cuota) |
| Automatizaciones Background | Vercel Cron / Supabase `pg_cron` | 1 Cron / día (Vercel Hobby) o `pg_cron` nativo SQL | 1 ejecución diaria (Mantenimiento y Logs) | 🟢 Cumple Tier $0 |

---

## 3. Seguridad por Diseño y Modelo Supabase RLS

### 3.1 Flujo de Autenticación y Autorización JWT
1. El usuario se autentica en la UI mediante `supabase.auth.signInWithPassword()`.
2. Supabase Auth emite un token JWT que contiene los claims del usuario y su UUID en `auth.uid()`.
3. Todas las API Routes de Next.js leen la sesión utilizando `@supabase/ssr`.
4. Cada consulta SQL enviada a Supabase inyecta el token Bearer JWT. El motor de PostgreSQL evalúa la política **Row Level Security (RLS)** antes de retornar o mutar registros.

---

## 4. Pipeline de Integración y Despliegue Continuo (CI/CD)

### 4.1 Workflow de GitHub Actions (`.github/workflows/ci.yml`)
```yaml
name: Continuous Integration - FerreOn ERP

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Code Quality & Formatting Check
        run: npm run lint

      - name: Typecheck TypeScript
        run: npm run typecheck

      - name: Run Unit Tests
        run: npm run test

      - name: Next.js Production Build Test
        run: npm run build
```

---

## 5. Estrategia de Copias de Seguridad (Backups)
* **Backups Automáticos Supabase:** Copias semanales automatizadas en la capa gratuita de Supabase.
* **Exportación de Datos (Script ETL Inverso):** Tarea periódica `/api/cron/backup-export` que genera una exportación cifrada JSON en Supabase Storage.
