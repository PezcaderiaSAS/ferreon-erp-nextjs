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

---

## 2. Convención de Archivos y Cobertura de Pruebas

- **Firma de Tipos y Validaciones:** Todas las entradas de API deben ser validadas usando esquemas **Zod** antes de ser procesadas por la capa de aplicación.
- **Cobertura Mínima de Pruebas:** 80% en casos de uso de dominio y componentes de calculadoras de tarifas.
- **Formato Commits:** Sigue el estándar Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
