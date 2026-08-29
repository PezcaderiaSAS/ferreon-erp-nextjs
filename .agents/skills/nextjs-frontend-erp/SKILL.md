---
name: nextjs-frontend-erp
description: >
  Diseña y mantiene la arquitectura frontend en Next.js 15 App Router para FerreOn ERP:
  Server Actions asíncronas con cookies y @supabase/ssr, validación con esquemas Zod,
  idempotencia, gestión de estado con Zustand e hidratación reactiva con Supabase Realtime.
---

# Next.js Frontend ERP — FerreOn ERP

Esta skill define los estándares y patrones para el desarrollo del frontend y la capa de aplicación en Next.js 15 App Router.

## 1. Reglas de Invocación Asíncrona en Next.js 15

1. **Async Server Supabase Client (`await createServerSupabaseClient()`):**
   - En Next.js 15, `cookies()` es asíncrono.
   - En toda Server Action (`'use server'`) y Route Handler (`route.ts`), la llamada **DEBE** incluir `await`:
     ```typescript
     'use server';
     import { createServerSupabaseClient } from '@/infrastructure/persistence/supabase/server';
     
     export async function miAccion(payload: InputType) {
       const supabase = await createServerSupabaseClient(); // Obligatorio await
       const { data, error } = await supabase.from('tabla').insert(...);
       if (error) return { success: false, error: error.message };
       return { success: true, data };
     }
     ```

2. **Validación Obligatoria con Zod:**
   - Toda Server Action y API Route debe parsear sus entradas usando `schema.safeParse()` o `.parse()` antes de procesarlas o enviarlas a la base de datos.

3. **Protección de Idempotencia y Doble Clic:**
   - Los formularios transaccionales (creación de contratos, pagos, devoluciones) deben generar una llave de idempotencia y deshabilitar los botones de envío mientras `isSubmitting` esté activo (`disabled={isSubmitting}`).

4. **Preservación de Estado Dinámico (Zustand + Realtime):**
   - No utilizar datos estáticos o mockups al aplicar rediseños visuales.
   - Hidratar los stores de Zustand en el montaje inicial (`useEffect`) desde Supabase y suscribirse a cambios con `setupRealtimeSubscriptions`.

5. **Regla de Conversión de Unidades:**
   - La base de datos almacena `peso_gramos BIGINT`. La UI muestra Kilos (`peso_gramos / 1000`) y al guardar convierte a gramos (`Math.round(kilos * 1000)`).
