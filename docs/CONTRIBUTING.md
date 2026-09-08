<!-- AUTO-GENERATED: Script Reference -->
# Guía de Contribución y Desarrollo

## Configuración del Entorno
1. Instalar Node.js y dependencias: `npm install`
2. Configurar `.env.local` basado en el `.env.example`.
3. Iniciar entorno local Supabase (opcional): `supabase start`

## Comandos Disponibles (Scripts)
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo (Next.js) |
| `npm run build` | Compila la aplicación para producción |
| `npm run start` | Inicia la versión compilada de producción |
| `npm run lint` | Ejecuta el linter (ESLint) |
| `npm run typecheck` | Ejecuta validación estricta de TypeScript (`tsc --noEmit`) |
| `npm run test` | Ejecuta la suite de pruebas unitarias (Vitest) |
| `npm run test:watch` | Modo interactivo para pruebas unitarias |
| `npm run test:coverage` | Genera el reporte de cobertura de pruebas |
| `npm run test:e2e` | Ejecuta pruebas End-to-End (Playwright) |
| `npm run supabase:gen-types` | Genera los tipos de la BD a partir de Supabase Local |

<!-- AUTO-GENERATED END -->

## Reglas del Ecosistema Poka-Yoke
Cualquier PR nuevo debe asegurar que las interfaces no confíen ciegamente en el input:
- **Mutaciones Backend:** Deben validar la existencia de condiciones necesarias (ej: caja abierta, stock suficiente, contrato no finalizado).
- **Frontend UI:** Ocultar botones de acción inválidos, mostrar modales de confirmación con Deltas (no sobreescritura ciega).
- **Bloqueo en Edición:** Al editar entidades vinculadas (ej: contratos de alquiler), los datos clave como el cliente deben bloquearse en modo Solo Lectura (*Read-Only*), proveyendo fallbacks resilientes con `initialData` para evitar pérdidas por latencia de red.
- **Ciclo de Vida de Modales:** Todo modal con formularios debe renderizarse con una clave dinámica (`key={activo ? id : 'new'}`) para forzar un remonte limpio y erradicar el estado zombie entre aperturas.
- **Compresión de Assets:** Cualquier imagen subida en cliente (ej: logos) debe redimensionarse mediante Canvas API (máx 400×120px / <150KB) antes de almacenarse en `localStorage` o en columnas JSONB.
