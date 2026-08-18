# Especificación de Arquitectura Clean / Hexagonal (FerreOn ERP)

## 1. Visión General de Arquitectura Hexagonal (Puertos y Adaptadores)

FerreOn ERP adopta el patrón de **Clean Architecture (Arquitectura Hexagonal)** para aislar la lógica de negocio central (Dominio y Casos de Uso) de las dependencias externas (Supabase, Vercel Serverless, React UI, motores de generación de PDF).

```text
+-----------------------------------------------------------------------+
|                         CAPA DE PRESENTACIÓN                          |
|         (Next.js App Router API Routes, React UI Components)          |
|                                                                       |
|   +---------------------------------------------------------------+   |
|   |                     CAPA DE APLICACIÓN                        |   |
|   |         (Casos de Uso: CrearAlquiler, GenerarFactura)         |   |
|   |                                                               |   |
|   |   +-------------------------------------------------------+   |   |
|   |   |                   CAPA DE DOMINIO                     |   |   |
|   |   |     (Entidades, Value Objects, Reglas Financieras)    |   |   |
|   |   +-------------------------------------------------------+   |   |
|   |                                                               |   |
|   +---------------------------------------------------------------+   |
|                                                                       |
|                         CAPA DE INFRAESTRUCTURA                       |
|   (Supabase PostgreSQL Client, Supabase Storage, @react-pdf/renderer) |
+-----------------------------------------------------------------------+
```

---

## 2. Reglas Estrictas de Dependencia de Capas

1. **Capa de Dominio (`src/core/domain/`):**
   - **Cero dependencias externas:** No importa Next.js, React, Supabase ni paquetes NPM de infraestructura.
   - Contiene Entidades de Negocio (`Alquiler`, `Cliente`, `Factura`, `Item`), Value Objects (`PesoGramos`, `MonedaCOP`) e Interfaces de Repositorios (Puertos).

2. **Capa de Aplicación (`src/core/application/`):**
   - Implementa los **Casos de Uso** (Orquestadores de la lógica de negocio).
   - Consume los Puertos de Repositorio a través de Inyección de Dependencias.
   - Define los Objetos de Transferencia de Datos (DTOs).

3. **Capa de Infraestructura (`src/infrastructure/`):**
   - Implementa los Adaptadores concretos para tecnologías externas:
     - `SupabaseAlquilerRepository` implementa `IAlquilerRepository`.
     - `ReactPdfAdapter` implementa `IPdfGenerator`.
     - `SupabaseStorageAdapter` implementa `IFileStorage`.

4. **Capa de Presentación (`src/presentation/`):**
   - Next.js App Router (Rutas de Servidor en `/api/` y Componentes React de Dashboard).
   - Valida la entrada HTTP usando **Zod** e invoca los Casos de Uso de la Capa de Aplicación.

---

## 3. Seguridad por Diseño y Supabase Row Level Security (RLS)

- **Identidad:** Todos los usuarios autenticados son mapeados a `auth.users` y sincronizados con `public.usuarios`.
- **Claims en JWT:** El rol del usuario (`ADMIN`, `OPERADOR`, `LECTOR`) se inyecta en la sesión de Supabase Auth.
- **Control de Acceso (RLS):** Supabase evalúa las políticas SQL antes de ejecutar cualquier consulta, bloqueando operaciones de mutación (`INSERT`/`UPDATE`/`DELETE`) si el rol del usuario es `LECTOR`.
