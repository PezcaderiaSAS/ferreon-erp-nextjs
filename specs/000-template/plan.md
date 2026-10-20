# Plan de Arquitectura e Implementación: [NNN-nombre-funcionalidad]

## 1. Resumen de Arquitectura
- **Especificación Asociada**: [spec.md](file:///specs/000-template/spec.md)
- **Autor**: @planner (Software Architect + Data Engineer)
- **Alcance**: [Descripción técnica de capas afectadas: Base de datos, Server Actions, Componentes UI]

---

## 2. Modelo de Datos y Esquema Prisma/Supabase
```prisma
// Definición de cambios en el esquema si aplica
model EjemploEntidad {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  createdAt   DateTime @default(now()) @map("created_at")
  // ... campos con Integer Math para montos
  montoCentavos BigInt @map("monto_centavos")
  
  @@map("ejemplo_entidades")
}
```
- **Políticas RLS**:
  - `CREATE POLICY "tenant_isolation_policy" ON ejemplo_entidades USING (tenant_id = auth.jwt() ->> 'tenant_id');`

---

## 3. Análisis de Impacto y Dependencias (GitNexus)
- **Blast Radius**: [Bajo / Medio / Alto]
- **Símbolos Afectados**:
  - `funcionEjemplo()` en `src/lib/modulo/`
- **Flujos de Ejecución Involucrados**:
  - `CrearRegistroFlow`

---

## 4. Contratos de API / Server Actions
- **Endpoint / Action**: `crearRegistroAction(input: InputSchema)`
- **Validación Zod**: Esquema defensivo con tipado estricto.
- **Manejo de Errores**: Bloques try-catch anidados que devuelven `{ success: boolean, data?: T, error?: string }`.

---

## 5. Estrategia de Pruebas (TDD)
- **Pruebas Unitarias**: `ferreon-erp-nextjs/src/lib/__tests__/...`
- **Pruebas de Componente / UI**: Vitest + React Testing Library
- **Pruebas E2E**: Playwright para el flujo crítico de usuario
