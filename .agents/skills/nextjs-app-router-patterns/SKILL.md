---
name: nextjs-app-router-patterns
description: Patrones de desarrollo para Next.js 14 App Router, Server/Client Components, Zod API Route Validation y Server Actions.
---

# Patrones de Desarrollo Next.js 14 App Router (`alquileres_app`)

## 1. Estructura de Enrutamiento (`src/app/`)
- **Root Layout (`src/app/layout.tsx`):** Provee la estructura HTML5 global, proveedores de estado, metadatos SEO y clases base de Tailwind CSS.
- **Páginas de Vista (`src/app/page.tsx`, `src/app/alquileres/page.tsx`):** Componentes Server o Client con diseño responsivo y Glassmorphism.
- **API Routes Serverless (`src/app/api/[recurso]/route.ts`):** Endpoints HTTP independientes tokenizados.

## 2. Validación de Entrada con Zod
Todas las peticiones a API Routes MUST ser validadas usando esquemas Zod antes de invocar la capa de aplicación:

```typescript
import { z } from "zod";

export const CrearAlquilerSchema = z.object({
  clienteId: z.string().uuid("ID de cliente inválido"),
  deposito: z.number().min(0, "El depósito debe ser mayor o igual a 0"),
  garantiaMonto: z.number().min(0),
  garantiaTipo: z.string().default("Efectivo"),
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      cantidad: z.number().positive(),
      tarifaAplicada: z.number().positive(),
      pesoKilos: z.number().positive(),
      diasContratados: z.number().positive(),
      fechaInicio: z.string().datetime(),
    })
  ).min(1, "Debe incluir al menos un ítem"),
});
```

## 3. Manejo de Respuestas JSON Estándar
```typescript
import { NextResponse } from "next/server";

export function createSuccessResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data, error: null }, { status });
}

export function createErrorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error: message }, { status });
}
```
