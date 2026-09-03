# RUNBOOK & Procedimientos de Despliegue

Este runbook detalla los procedimientos operativos estándar para el proyecto FerreOn-ERP, orquestado en Vercel, Supabase y Stripe.

## 1. Procedimiento de Despliegue (Vercel)
Actualmente, el proyecto se despliega conectando Vercel al flujo de Git o usando Vercel CLI.
- **Despliegue a Producción (CLI)**: 
  ```bash
  npx vercel --prod
  ```
- **Pre-requisitos**:
  1. Confirmar que el linter, TypeScript y las pruebas unitarias pasan sin errores (`npm run build`).
  2. Variables de entorno actualizadas en el Dashboard de Vercel (Supabase, Upstash, Stripe).

## 2. Monitoreo y Health Checks
- **Vercel Logs**: Usar `npx vercel logs` o el dashboard de Vercel (Pestaña "Logs" del despliegue en producción) para capturar caídas de middlewares Edge y rate-limiting (Upstash Redis).
- **Supabase Dashboard**: Monitoreo directo del consumo de base de datos, tiempo real (Realtime WebSockets), y Edge Functions.

## 3. Procedimiento de Rollback Rápido
Si la versión desplegada a producción quiebra (Error crítico, React Hydration mismatch masivo o caída en Edge API):
1. **Identificar último despliegue estable**:
   ```bash
   npx vercel ls
   ```
2. **Revertir despliegue (Instant Rollback)**:
   Entrar al Dashboard de Vercel > Proyecto `alquileres-erp-nextjs` > Deployments > Buscar el ID exitoso previo > Click en los tres puntos (`...`) > "Promote to Production" (Revert).
   Alternativa CLI:
   ```bash
   npx vercel promote [DEPLOYMENT_ID]
   ```
3. **Purgar caché de Redis**:
   Si el fallo involucró una corrupción de caché en perfiles o configuración multi-tenant, vaciar la DB de Upstash desde la consola (`FLUSHDB` o flush manual).

## 4. Troubleshooting Frecuente
- **Error: "Text content did not match" (Hydration Error)**:
  - Ocurre típicamente si el componente asume estados del cliente en primer render (ej. Zustand reading localStorage en render SSR).
  - *Mitigación*: Asegurarse de envolver el renderizado condicionado del LocalStorage con variables de estado de montaje (ej. `const [mounted, setMounted] = useState(false)`).
- **Error: Limitación de Cuotas API Stripe/Supabase**:
  - Revisar las reglas de Rate Limiting del middleware (`src/middleware.ts`) para ver si el Upstash Redis está filtrando tráfico genuino o si se ha activado una DDoS.
