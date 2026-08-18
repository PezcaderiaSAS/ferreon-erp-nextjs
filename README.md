# FerreOn ERP (Next.js + Supabase + Vercel)

![License](https://img.shields.io/badge/License-Proprietary-blue.svg)
![Stack](https://img.shields.io/badge/Stack-Next.js%2014%20%7C%20Supabase%20%7C%20Vercel-black.svg)
![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Hexagonal-green.svg)
![Cost Tier](https://img.shields.io/badge/Cost-%240%20USD%20Free%20Tiers-success.svg)

Sistema ERP desacoplado para la gestión de alquiler de equipos de construcción, facturación, cuentas de cobro y administración de clientes.

---

## 📌 Tabla de Contenido Documental

1. [Estructura del Proyecto](#-estructura-del-proyecto)
2. [Gobernanza de IA y Skills (.agents/)](#-gobernanza-de-ia-y-skills-agents)
3. [Diccionario de Funciones (GAS ➔ Next.js)](#-diccionario-de-funciones-gas--nextjs)
4. [Esquema de Base de Datos (Supabase PostgreSQL)](#-esquema-de-base-de-datos-supabase-postgresql)
5. [Instrucciones de Instalación y Ejecución](#-instrucciones-de-instalación-y-ejecución)
6. [Publicación en GitHub](#-publicación-en-github)

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
│   │   └── clean-architecture.md   # Especificación Hexagonal Puertos y Adaptadores
│   ├── dictionaries/
│   │   └── function-mapping.md     # Diccionario Completo de Mapeo (GAS ➔ Next.js)
│   └── specs/
│       └── functional-requirements.md # PRD y Requerimientos Funcionales
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

## 🤖 Gobernanza de IA y Skills (`.agents/`)

Este repositorio incluye una suite de **Skills** de agente para garantizar la integridad del código:
- **`frios-pezca-doc-compliance`**: Exige revisar las especificaciones antes de editar código y prohíbe índices numéricos duros.
- **`frios-pezca-data-types`**: Exige almacenar el peso de los equipos como gramos enteros en la DB (`peso_gramos BIGINT`) dividiendo entre `1000` solo para la interfaz de usuario.
- **`frios-pezca-api`**: Define los estándares RESTful, Supabase SSR Auth y envoltorios JSON para API Routes.

---

## 📖 Diccionario de Funciones (GAS ➔ Next.js)

Consulte el documento exhaustivo [`docs/dictionaries/function-mapping.md`](docs/dictionaries/function-mapping.md) para revisar la equivalencia exacta de cada script legacy de Google Apps Script:
- `doGetApi_` / `doPostApi_` ➔ `src/presentation/app/api/` (Next.js API Routes).
- `crearNuevoAlquiler()` ➔ `CrearAlquilerUseCase.execute()`.
- `server_pdf.js` ➔ `@react-pdf/renderer` + `Supabase Storage`.
- `withLock()` ➔ Transacciones Nativas ACID en PostgreSQL.

---

## 🗄️ Esquema de Base de Datos (Supabase PostgreSQL)

El script DDL [`supabase/migrations/20260818000000_init_schema.sql`](supabase/migrations/20260818000000_init_schema.sql) implementa:
- 7 Tablas relacionales con claves foráneas (`FOREIGN KEY`) y borrado en cascada configurado.
- Control de acceso **Row Level Security (RLS)** activado en todas las tablas para roles `ADMIN`, `OPERADOR` y `LECTOR`.
- Tipos de datos financieros `NUMERIC(12, 2)` y peso `BIGINT`.

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

# 5. Generar tipado TypeScript desde Supabase
npm run supabase:gen-types
```

---

## 🌐 Publicación en GitHub

Para inicializar y vincular este repositorio con GitHub:

```bash
# Inicializar repositorio local
git init
git add .
git commit -m "feat: inicializacion de repositorio ferreon-erp-nextjs con documentacion y clean architecture"

# Crear y vincular repositorio remoto en GitHub CLI
gh repo create ferreon-erp-nextjs --private --source=. --remote=origin

# Empujar cambios a la rama principal
git branch -M main
git push -u origin main
```
