<!-- AUTO-GENERATED: Script Reference -->
# Guía de Contribución y Desarrollo

## Configuración del Entorno
1. Instalar Node.js (v20+) y dependencias: `npm install`
2. Configurar `.env.local` basado en `.env.example`.
3. Iniciar entorno local Supabase (opcional): `supabase start`

## Comandos Disponibles (Scripts)
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo (Next.js con Fast Refresh) |
| `npm run build` | Compila la aplicación para producción (Next.js 14 App Router, 22 rutas) |
| `npm run start` | Inicia el servidor de producción compilado |
| `npm run lint` | Ejecuta el linter de código (ESLint) |
| `npm run typecheck` | Ejecuta validación estricta de TypeScript (`tsc --noEmit`) |
| `npm run test` | Ejecuta la suite de pruebas unitarias (Vitest, 26 suites, 94 tests) |
| `npm run test:watch` | Modo interactivo continuo para desarrollo guiado por pruebas (TDD) |
| `npm run test:coverage` | Genera el reporte de cobertura de código con V8 |
| `npm run test:e2e` | Ejecuta pruebas End-to-End en navegadores reales (Playwright) |
| `npm run supabase:gen-types` | Genera tipos TypeScript a partir del esquema de Supabase |

<!-- AUTO-GENERATED END -->

## Reglas del Ecosistema Poka-Yoke, Contabilidad y UI/UX
Cualquier PR o contribución debe asegurar que las interfaces, servicios y migraciones cumplan con las siguientes directrices obligatorias:

### 1. Gobernanza Contable y Partida Doble en Ledger
- **Invariante Matemática:** Todo asiento contable en `journal_entries` debe sumar exactamente cero:
  $$\sum \text{Débitos} + \sum \text{Créditos} = 0$$
- **Cálculo Tributario Exacto:** Las compras y alquileres con retenciones (IVA 19%, ReteFuente 2.5%/3.5%, ReteICA 9.66‰) deben redondearse a números enteros en pesos colombianos (COP sin centavos) antes de impactar el Ledger.
- **Trazabilidad de Kardex:** Toda entrada o salida de inventario debe registrarse de manera inmutable en `kardex_inventario` (`INGRESO_COMPRA`, `ALQUILER_SALIDA`, `DEVOLUCION_ENTRADA`).

### 2. Seguridad en los Límites (Security-First)
- **Validación Dual-Layer con Zod:** Toda Server Action o API Route debe sanitizar y validar las entradas mediante esquemas Zod con `validateActionInput`.
- **Aislamiento Multitenant (RLS):** Toda consulta debe filtrar por `tenant_id` resuelto desde la sesión autenticada. Prohibido omitir RLS salvo en funciones administrativas de auditoría con `createAdminSupabaseClient()`.
- **Auditoría Sistemática:** Operaciones financieras, cambios de inventario o modificaciones de proveedores deben registrarse asíncronamente con `AuditLogger.logAsync`.

### 3. Frontend UI/UX y Patrones de Alta Ergonomía
- **Búsquedas Asistidas & Creación On-The-Fly:** Grillas y selectores complejos (`SelectorProveedorAsistido`, `EquipoCombobox`) deben permitir búsqueda predictiva instantánea y botón de creación rápida sin cerrar el modal principal ni perder borradores.
- **Navegación Teclado-Primero:** Los menús de autocompletado deben responder a `ArrowUp`, `ArrowDown`, `Enter` y `Escape` con estándar WAI-ARIA 1.2.
- **Rango Maestro de Fechas:** En formularios de transacción multi-ítem, las fechas maestras deben definirse a nivel de cabecera y propagarse automáticamente en cascada a los renglones.
- **Gobernanza de Apilamiento (Z-Index):** Cuando un componente desplegable se expanda dentro de una fila repetitiva, la fila activa debe elevar su `z-index` (`zIndex: 100`) para evitar que filas precedentes lo oculten.
- **Estabilidad de Hooks React (`useCallback`):** Funciones consumidas en `useEffect` deben encapsularse con `useCallback` para evitar bucles de renderizado.
- **Compresión de Assets:** Logos corporativos deben redimensionarse mediante Canvas API (<150KB / máx 400×120px) antes de almacenarse en base de datos.
