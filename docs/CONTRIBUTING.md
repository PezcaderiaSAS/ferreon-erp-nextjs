<!-- AUTO-GENERATED: Script Reference from package.json -->
# Guía de Contribución y Scripts

Bienvenido a la guía de contribución de FerreOn-ERP. A continuación se detallan los comandos disponibles en el entorno de desarrollo y procedimientos estándar.

## Comandos Disponibles

| Comando | Descripción (Inferencia por convención) |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:3000` con hot reload. |
| `npm run build` | Compila la aplicación para producción. |
| `npm run start` | Inicia el servidor Next.js usando la última compilación. |
| `npm run lint` | Ejecuta ESLint para analizar errores en el código estático. |
| `npm run typecheck` | Ejecuta el compilador TypeScript sin emitir código para chequear tipos. |
| `npm run test` | Ejecuta la suite de testing (Vitest). |
| `npm run test:watch` | Ejecuta Vitest en modo observación continua. |
| `npm run test:coverage` | Ejecuta la suite de testing y genera reporte de cobertura. |
| `npm run test:e2e` | Ejecuta Playwright para testing End-to-End en navegadores reales. |
| `npm run supabase:gen-types` | Genera o actualiza los tipos locales de Supabase (`database.types.ts`). |

## Reglas de Desarrollo (Ground Truth)
- **Desarrollo Guiado por Especificaciones (Spec-Kit)**: Todo cambio mayor debe preceder con un PRD y una actualización de `implementation_plan.md`.
- **UI/UX Ecosistema**: No usar colores crudos (HEX). Usar las variables de `tailwind.config.ts` (Neumorphism / Glassmorphism) documentadas en `DESIGN.md`.
- **A11y**: Asegurar que las interfaces cumplan WCAG 2.1 AA (contrastes opacos).
<!-- END AUTO-GENERATED -->
