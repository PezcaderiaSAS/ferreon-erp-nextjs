# Guía de Contribución para FerreOn ERP

Bienvenido a la guía de desarrollo del sistema FerreOn ERP. Siga estas instrucciones para levantar el proyecto localmente y aportar código.

## Entorno de Desarrollo

1. Clona el repositorio.
2. Copia el archivo `.env.example` a `.env.local` e inyecta tus credenciales.
3. Instala dependencias: `npm install` (usar Node >= 18).
4. Inicia el servidor de desarrollo: `npm run dev`.

## Referencia de Scripts (Auto-generada)

<!-- AUTO-GENERATED -->
| Comando | Descripción (Inferencia) |
|---------|-------------|
| `npm run dev` | Inicia el servidor Next.js en modo desarrollo con recarga en vivo. |
| `npm run build` | Compila la aplicación Next.js para producción. |
| `npm run start` | Inicia el servidor de producción con los archivos compilados. |
| `npm run lint` | Ejecuta ESLint para asegurar la calidad de código. |
| `npm run typecheck` | Ejecuta TypeScript (`tsc`) sin emitir archivos, solo valida tipos. |
| `npm run test` | Ejecuta la suite de pruebas unitarias con Vitest. |
| `npm run test:watch` | Ejecuta Vitest en modo vigilancia para TDD. |
| `npm run test:coverage`| Ejecuta Vitest generando reporte de cobertura de código. |
| `npm run test:e2e` | Ejecuta pruebas End-to-End con Playwright. |
| `npm run supabase:gen-types` | Genera los tipos TS locales conectándose al CLI de Supabase. |
<!-- AUTO-GENERATED -->

## Estilo de Código (ECC Standards)
- **Inmutabilidad:** Jamás mutar el estado directamente (usar Zustand o retornar clones en Dominio).
- **Control de Componentes:** No exceder las 400 líneas.
- **Testing Obligatorio:** Escribir tests (Vitest) antes de integrar lógica compleja financiera.
