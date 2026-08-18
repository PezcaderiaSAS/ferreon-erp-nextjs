# FerreOn ERP — `alquileres_app` (Next.js + Supabase + Vercel)

![License](https://img.shields.io/badge/License-Proprietary-blue.svg)
![Stack](https://img.shields.io/badge/Stack-Next.js%2014%20%7C%20Supabase%20%7C%20Vercel-black.svg)
![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Hexagonal-green.svg)
![Spec-Driven](https://img.shields.io/badge/Methodology-Spec--Driven%20Development-purple.svg)
![Cost Tier](https://img.shields.io/badge/Cost-%240%20USD%20Free%20Tiers-success.svg)

Sistema ERP desacoplado para la gestión de alquiler de equipos de construcción, facturación, cuentas de cobro y administración de clientes mediante el módulo central **`alquileres_app`**.

---

## 📌 Tabla de Contenido Documental

1. [Especificaciones Oficiales (Spec-Driven Development)](#-especificaciones-oficiales-spec-driven-development)
2. [Funcionamiento y Estándares Técnicos (`alquileres_app`)](#-funcionamiento-y-estándares-técnicos)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Gobernanza de IA y Skills (.agents/)](#-gobernanza-de-ia-y-skills-agents)
5. [Diccionario de Funciones (GAS ➔ Next.js)](#-diccionario-de-funciones-gas--nextjs)
6. [Esquema de Base de Datos (Supabase PostgreSQL)](#-esquema-de-base-de-datos-supabase-postgresql)
7. [Instrucciones de Instalación y Ejecución](#-instrucciones-de-instalación-y-ejecución)

---

## 📄 Especificaciones Oficiales (Spec-Driven Development)

El proyecto cuenta con 3 documentos técnicos oficiales de especificación previa al desarrollo:
- 📋 **[PRD — Documento de Requerimientos del Producto](docs/specs/prd-requirements-spec.md):** Historias de usuario, Requerimientos Funcionales (`RF-xxx`) y No Funcionales (`RNF-xxx`) con criterios de aceptación en formato **Gherkin (Given-When-Then)**.
- 📐 **[BRD — Especificación de Reglas de Negocio](docs/specs/brd-business-rules.md):** Reglas financieras `NUMERIC(12, 2)`, estándar inmutable de peso (`peso_gramos BIGINT`), cálculo de días efectivos y horas de corte (5:00 PM).
- ☁️ **[TID — Documento de Infraestructura Tecnológica](docs/specs/tid-infrastructure-spec.md):** Topología Vercel + Supabase, seguridad RLS/JWT, validación de cuotas $0 USD y pipeline de CI/CD.

---

## 🏗️ Funcionamiento y Estándares Técnicos (`alquileres_app`)

Consulte la especificación en [`docs/architecture/standards-dictionary.md`](docs/architecture/standards-dictionary.md) para revisar las convenciones estrictas del sistema:
- **Pesos y Medidas:** Almacenamiento exclusivo como gramos enteros (`peso_gramos BIGINT`). Presentación en UI en Kilos (`0.000 Kg`).
- **Fechas y Agendas:** ISO 8601 UTC en DB, hora de corte de devoluciones 5:00 PM (`America/Bogota`).
- **Moneda y Decimales:** Pesos Colombianos `COP` en `NUMERIC(12, 2)`, formato UI `$ 1.500.000,00`.
- **Identificaciones y Nombres:** Sanitizados en `UPPERCASE.trim()`, NITs con dígito de verificación (`900123456-1`).

---

## 📁 Estructura del Proyecto

```text
ferreon-erp-nextjs/
├── .agents/                        # Gobernanza, Skills e Instrucciones de IA
│   ├── skills/
│   │   ├── frios-pezca-doc-compliance/ # Verificación Documental Grounding
│   │   ├── frios-pezca-data-types/     # Conversión Gramos/Kilos (peso_gramos)
│   │   └── frios-pezca-api/            # Convenciones de API Routes & RLS
│   └── AGENTS.md                   # Reglas del Agente y Anti-Alucinaciones
├── docs/                           # Documentación Técnica y Especificaciones
│   ├── architecture/
│   │   ├── clean-architecture.md   # Especificación Hexagonal Puertos y Adaptadores
│   │   └── standards-dictionary.md # Diccionario de Estándares Iniciales (alquileres_app)
│   ├── dictionaries/
│   │   └── function-mapping.md     # Diccionario Completo de Mapeo (GAS ➔ Next.js)
│   └── specs/
│       ├── prd-requirements-spec.md    # PRD Oficial (Requerimientos & Gherkin)
│       ├── brd-business-rules.md       # BRD Oficial (Reglas de Negocio & Fórmulas)
│       └── tid-infrastructure-spec.md  # TID Oficial (Infraestructura & CI/CD)
├── supabase/                       # Infraestructura de Base de Datos
│   ├── migrations/
│   │   └── 20260818000000_init_schema.sql # DDL con Tablas, Enums, Triggers y RLS
│   └── seed.sql                    # Catálogo de prueba e Items
├── src/                            # Código Fuente (Clean Architecture)
│   ├── core/
│   │   ├── domain/                 # Entidades, Value Objects e Interfaces Repositorio
│   │   └── application/            # Casos de Uso y DTOs
│   ├── infrastructure/             # Adaptadores Supabase, PDF Generator, Storage
│   └── presentation/               # Next.js App Router (API Routes & UI Components)
├── .env.example                    # Plantilla Segura de Variables de Entorno
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Instrucciones de Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local

# 3. Iniciar entorno de desarrollo
npm run dev

# 4. Ejecutar suite de pruebas
npm run test
```
