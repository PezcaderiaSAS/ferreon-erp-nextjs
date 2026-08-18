---
name: supabase-rls-postgresql
description: Estándares para el cliente Supabase SSR, Row Level Security (RLS) en PostgreSQL, BigInt peso_gramos y migraciones DDL.
---

# Supabase PostgreSQL & Row Level Security (`alquileres_app`)

## 1. Cliente Supabase SSR (@supabase/ssr)
- **Browser Client (`src/infrastructure/persistence/supabase/client.ts`):** Utilizar `createBrowserClient` para operaciones desde el cliente React.
- **Server Client (`src/infrastructure/persistence/supabase/server.ts`):** Utilizar `createServerClient` con lectura de cookies en API Routes y Server Components.

## 2. Invariante de Unidades y Tipado SQL
- **Peso de Equipos:** Guardar en `peso_gramos BIGINT`. Prohibido usar `FLOAT` o `REAL`.
- **Monedas:** Guardar en `NUMERIC(12, 2)`.
- **Fechas:** Usar `TIMESTAMPTZ` con zona horaria UTC (`America/Bogota`).

## 3. Ejemplo de Políticas RLS Estrictas
```sql
-- Habilitar RLS obligatoriamente
ALTER TABLE public.alquileres ENABLE ROW LEVEL SECURITY;

-- Política de lectura para cualquier usuario autenticado
CREATE POLICY "Lectura de alquileres" ON public.alquileres
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política de mutación solo para usuarios con rol ADMIN u OPERADOR
CREATE POLICY "Escritura de alquileres" ON public.alquileres
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = auth.uid() AND rol IN ('ADMIN', 'OPERADOR') AND activo = true
        )
    );
```
