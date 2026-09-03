<!-- AUTO-GENERATED: Environment Documentation from .env.example -->
# Environment Variables Reference

Las siguientes variables son necesarias para levantar el entorno de FerreOn-ERP localmente o en Vercel.

| Variable | Requerido | Descripción | Ejemplo |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL Pública del proyecto en Supabase (API endpoint). | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima pública JWT de Supabase (Frontend). | `eyJhbGciOiJIUz...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave de servicio para omitir RLS (Backend/Edge/Servidor SOLAMENTE). NUNCA exponer al cliente. | `eyJhbGciOiJIUz...` |
| `CRON_SECRET` | No | Token secreto de seguridad para evitar ejecución no autorizada de Edge Cron Jobs en Vercel. | `token_secreto_cron` |
| `NODE_ENV` | Sí | Entorno de despliegue (`development` o `production`). | `development` |
| `NEXT_PUBLIC_APP_URL` | Sí | URL absoluta del frontend para callbacks (OAuth, webhooks). | `http://localhost:3000` |
| `UPSTASH_REDIS_REST_URL` | Sí | URL REST API de Upstash Redis (Serverless Cache y Rate Limit). | `https://tu-endpoint-upstash.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token REST de Upstash Redis. | `tu-token-seguro-upstash` |

## Notas Importantes
- Asegúrate de cargar estas variables tanto en tu `.env.local` como en el Dashboard de entorno de Vercel.
- Cualquier variable prefijada con `NEXT_PUBLIC_` se compila directamente en el paquete de JavaScript del navegador. Nunca guardes secretos bajo este prefijo.
<!-- END AUTO-GENERATED -->
