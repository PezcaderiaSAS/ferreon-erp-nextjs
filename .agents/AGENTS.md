# Protocolo de Gobernanza y Verificación Documental (FerreOn ERP Next.js)

Este repositorio contiene la evolución desacoplada de **FerreOn ERP** migrado a **Next.js (App Router), Supabase (PostgreSQL, Auth, RLS) y Vercel**. Todo agente de IA o desarrollador que trabaje en este código DEBE seguir estrictamente las directrices aquí especificadas.

---

## 1. Reglas de Oro Ineludibles (Anti-Alucinaciones)

1. **GROUNDING DOCUMENTAL OBLIGATORIO:**
   - **NUNCA** asumas la firma de un caso de uso, el esquema DDL o el comportamiento de un endpoint sin consultar primero la documentación en `docs/` y las definiciones en `supabase/migrations/`.
   - Consulta `docs/dictionaries/function-mapping.md` para entender cómo se mapearon las funciones legacy de Google Apps Script hacia la Arquitectura Hexagonal en TypeScript.

2. **REGLA DE CONVERSIÓN DE UNIDADES (GRAMOS vs. KILOS):**
   - En la base de datos de Supabase PostgreSQL (`public.alquileres_detalle`), la columna `peso_gramos` se almacena estrictamente como **gramos enteros (`BIGINT`)** para garantizar precisión aritmética y evitar errores de punto flotante.
   - **Al leer desde DB hacia Presentación/UI:** Convertir a kilos dividiendo entre `1000` (`kilos = peso_gramos / 1000`).
   - **Al escribir en DB desde Presentación/UI:** Convertir a gramos multiplicando por `1000` y redondeando a entero (`peso_gramos = Math.round(kilos * 1000)`).

3. **RESPETO A LA ARQUITECTURA HEXAGONAL (PUERTOS Y ADAPTADORES):**
   - La capa de Dominio (`src/core/domain`) es pura TypeScript y **NO DEBE** importar librerías de infraestructura (ni `@supabase/supabase-js`, ni componentes de Next.js/React).
   - Los Casos de Uso (`src/core/application/use-cases`) dependen de Interfaces de Repositorios (Puertos), nunca de implementaciones concretas.

4. **ALINEACIÓN DE MIGRACIÓN HISTÓRICA DE GOOGLE SHEETS:**
   - El script de migración ETL debe respetar la asignación física de columnas históricas de Google Sheets documentada en `.agents/skills/frios-pezca-doc-compliance/SKILL.md`:
     - Columna 14 (`deposito`), Columna 15 (`observaciones_generales`), Columna 16 (`creado_por`), Columna 21 (`garantia`), Columna 27 (`Garantia_Tipo`), Columna 28 (`Garantia_Monto`), Columna 29 (`Garantia_Estado`).

5. **PRESERVACIÓN DE ESTADO EN REDISEÑOS UI (STITCH/TAILWIND):**
   - **NUNCA** reemplaces mapeos dinámicos (`Zustand`, `map` de arrays, Modales) con datos estáticos (mockups) al aplicar rediseños estéticos. El embellecimiento UI debe ser un envoltorio de la lógica de negocio existente, **no un reemplazo**.
   - Todo botón de "acción rápida" o Dashboard debe usar estrictamente `next/link` (`<Link href="...">`) en lugar de `<button>` huérfanos.
   - Formularios complejos (ej. `AlquilerForm`): Usa `flex-wrap` con anchos mínimos (`min-w`) en lugar de grillas estrictas (`grid-cols`) para evitar que inputs como `date` o `select` queden ilegibles en modales.
   - **Idempotencia Obligatoria**: Todo botón de envío en modales transaccionales (pagos, devoluciones, creación) DEBE estar protegido por un estado `isSubmitting` y `disabled={isSubmitting}` para prevenir latencia o doble clic.

6. **INVOCACIÓN ASÍNCRONA DE SUPABASE SSR (NEXT.JS 15):**
   - En Next.js 15, `cookies()` es asíncrono. Toda Server Action (`'use server'`) y Route Handler (`route.ts`) DEBE invocar obligatoriamente `const supabase = await createServerSupabaseClient()` con `await` explícito para prevenir fallos silenciosos y rollbacks optimistas indebidos.

7. **ATOMICIDAD Y PROCEDIMIENTOS RPC TRANSACCIONALES (POSTGRES):**
   - Las operaciones multi-tabla que involucren inventario y valores monetarios (contratos de alquiler, pagos de cartera y devoluciones) DEBEN ejecutarse mediante procedimientos almacenados en PostgreSQL (`RPC`) con bloqueos de fila (`SELECT ... FOR UPDATE`), triggers de actualización de saldos y `ROLLBACK` atómico ante cualquier falta de stock o inconsistencia.

---

## 2. Convención de Archivos y Cobertura de Pruebas

- **Firma de Tipos y Validaciones:** Todas las entradas de API deben ser validadas usando esquemas **Zod** antes de ser procesadas por la capa de aplicación.
- **Cobertura Mínima de Pruebas:** 80% en casos de uso de dominio y componentes de calculadoras de tarifas.
- **Formato Commits:** Sigue el estándar Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
