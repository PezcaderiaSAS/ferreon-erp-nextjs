---
name: frios-pezca-doc-compliance
description: Protocolo de cumplimiento obligatorio (Grounding) y verificación documental previa a cualquier acción en FerreOn ERP (Next.js/Supabase).
---

# Verificación Documental Obligatoria y Grounding (FerreOn ERP)

Esta skill define el **protocolo ineludible de verificación previa** que todo agente de IA o desarrollador debe ejecutar **ANTES** de modificar esquemas, implementar nuevos casos de uso o proponer cambios en el proyecto FerreOn ERP.

---

## 1. Reglas de Oro Ineludibles (Anti-Alucinaciones)

1. **GROUNDING DOCUMENTAL OBLIGATORIO:**
   - Nunca asumas el comportamiento de una función o un tipo de datos.
   - Consulta `docs/dictionaries/function-mapping.md`, `docs/architecture/clean-architecture.md` y las migraciones SQL en `supabase/migrations/` antes de cualquier edición.

2. **REGLA DE MANEJO DE UNIDADES (GRAMOS vs KILOS):**
   - En Supabase PostgreSQL, la columna `peso_gramos` se almacena estrictamente como **gramos enteros (`BIGINT`)**.
   - En la UI / Frontend se presenta en Kilos (`peso_gramos / 1000`).
   - Al guardar en DB: `peso_gramos = Math.round(kilos * 1000)`.

3. **VERIFICACIÓN DE SEGURIDAD RLS:**
   - Toda nueva tabla relacional en Supabase DEBE incluir la sentencia `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` y al menos una política explícita para lectura y escritura basada en los claims de `auth.uid()`.

---

## 2. Checklist Pre-Ejecución para Agentes de IA

- [ ] **Paso 1: Localizar la Documentación**
  - Revisar `docs/dictionaries/function-mapping.md` para validar el equivalente de cualquier lógica legacy.
- [ ] **Paso 2: Validar la Capa Arquitectónica**
  - Confirmar si el cambio corresponde a Dominio (`src/core/domain`), Aplicación (`src/core/application`), Infraestructura (`src/infrastructure`) o Presentación (`src/presentation`).
- [ ] **Paso 3: Validar DTOs con Zod**
  - Asegurar que todas las peticiones a API Routes incluyan schema validation.
- [ ] **Paso 4: Ejecutar Pruebas Automáticas**
  - Garantizar que `npm run test` apruebe con 80%+ de cobertura.
