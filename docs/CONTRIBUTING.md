# Contribuyendo a Alquileres ERP

Bienvenido al repositorio de **Alquileres ERP**. Este documento contiene directivas generadas automáticamente sobre el entorno de desarrollo y scripts disponibles.

## Comandos Disponibles

Extraídos automáticamente de `package.json`:

| Comando | Descripción (Auto-generada) |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo local de Next.js (`next dev`) |
| `npm run build` | Compila la aplicación Next.js para producción (`next build`) |
| `npm run start` | Inicia el servidor de producción compilado (`next start`) |
| `npm run lint` | Ejecuta el linter integrado de Next.js (`next lint`) |
| `npm run typecheck` | Ejecuta el chequeo estricto de tipos de TypeScript sin emitir archivos (`tsc --noEmit`) |
| `npm run test` | Ejecuta la suite de pruebas unitarias usando Vitest (`vitest run`) |
| `npm run test:watch` | Ejecuta Vitest en modo interactivo (`vitest`) |
| `npm run test:coverage` | Calcula la cobertura de las pruebas con Vitest (`vitest run --coverage`) |
| `npm run test:e2e` | Ejecuta pruebas End-to-End con Playwright (`playwright test`) |
| `npm run supabase:gen-types` | Genera los tipos de la BD desde el backend local de Supabase a `database.types.ts` |

<!-- AUTO-GENERATED -->

## Variables de Entorno

Basado en la configuración actual del proyecto, se requieren estas variables de entorno en `.env.local`:

| Variable | Requerida | Descripción | Ejemplo |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL de tu instancia de Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Llave anónima para acceso del frontend | `eyJh...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Llave de administración (Backend/API) | `eyJh...` |

<!-- AUTO-GENERATED -->

## Reglas de Arquitectura
- **Inmutabilidad:** Evita mutar el estado de Zustand directamente.
- **Autorización:** Todo acceso restringido debe verificarse en el Middleware a nivel del servidor (Edge).
- **Tipado Estricto:** Usa Zod para validar entradas antes de guardar en Base de Datos.
