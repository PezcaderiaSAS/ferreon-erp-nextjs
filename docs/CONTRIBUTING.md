<!-- AUTO-GENERATED: Script Reference -->
# Guía de Contribución y Desarrollo - Alquileres System

## Configuración del Entorno
1. Instalar Node.js (v20+) y dependencias del proyecto: `npm install`
2. Configurar `.env.local` basado en la plantilla oficial `.env.example`.
3. Iniciar entorno local Supabase (opcional): `supabase start`
4. Iniciar servidor de desarrollo: `npm run dev`

## Comandos Disponibles (Scripts de package.json)
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo local con Fast Refresh (Next.js 14) |
| `npm run build` | Compila para producción (`prisma generate && next build`, 24 rutas prerenderizadas) |
| `npm run postinstall` | Genera automáticamente el cliente Prisma ORM al instalar dependencias |
| `npm run start` | Inicia el servidor de producción compilado localmente |
| `npm run lint` | Ejecuta el linter de código (ESLint con exclusiones en `.eslintignore`) |
| `npm run typecheck` | Ejecuta validación estricta de tipos de TypeScript sin emitir código (`tsc --noEmit`) |
| `npm run test` | Ejecuta la suite de pruebas unitarias e integración (Vitest: 53 suites, 272 tests) |
| `npm run test:watch` | Modo interactivo continuo para desarrollo guiado por pruebas (TDD) |
| `npm run test:coverage` | Genera el reporte de cobertura de código con proveedor V8 |
| `npm run test:e2e` | Ejecuta pruebas de extremo a extremo en navegadores reales (Playwright) |
| `npm run prisma:generate` | Genera el cliente Prisma ORM (`@prisma/client`) |
| `npm run prisma:format` | Aplica formato estándar al esquema `prisma/schema.prisma` |
| `npm run supabase:gen-types` | Genera definiciones TypeScript a partir de la base de datos Supabase |
| `npm run doctor` | Auditoría de arquitectura y buenas prácticas en React (`react-doctor`) |

<!-- AUTO-GENERATED END -->

## Reglas del Ecosistema Poka-Yoke, Contabilidad y UI/UX
Cualquier PR o contribución a **Alquileres System** debe asegurar que las interfaces, servicios y migraciones cumplan con las siguientes directrices obligatorias:

### 1. Arquitectura Dual-Híbrida y Enrutamiento Perimetral
- **Separación de Mundos:** La Landing Page pública institucional reside en `/` bajo tema Dark Industrial (`#0F172A`, `#1E293B`, `#F59E0B`), mientras que el ERP operativo empresarial reside en `/dashboard` bajo tema Crisp Corporate Light (`#F8FAFC`, `#0284C7`, `#3B82F6`).
- **Aislamiento en `AppShell.tsx`:** Las rutas públicas (`/`, `/design-system`, `/auth/*`, `/unauthorized`) deben identificarse mediante `isStandaloneRoute` para renderizarse sin Sidebar ni cabecera operativa del ERP.

### 2. Idempotencia y Blindaje Poka-Yoke en Formularios Transaccionales
- **Escudo Visual Poka-Yoke:** Todo formulario crítico de mutación financiera o contractual (ej. `AlquilerForm.tsx`, `ConvertirCotizacionModal.tsx`, `InspeccionTecnicaModal.tsx`) debe implementar un overlay bloqueante (`AlquilerBlockingOverlay.tsx`, `DevolucionBlockingOverlay.tsx`, etc.) con Glassmorphism (`backdrop-blur-md`), spinner sincronizado y supresión absoluta de eventos de puntero (`pointer-events-none`) y atajos de teclado (`tabIndex`, escape).
- **Clave Criptográfica Única:** El cliente debe generar un identificador de idempotencia único (UUID v4) al iniciar el proceso y transmitirlo en el payload (`idempotency_key`).
- **Guard Síncrono:** La bandera `isSubmitting` debe activarse síncronamente antes de invocar la acción asíncrona para anular de raíz el evento de doble clic.
- **Latencia Cero (0 ms) & Rollback Optimista:** Las tiendas locales de Zustand deben reflejar los cambios de inmediato (0 ms) mediante snapshots que permitan revertir el estado si la transacción en el servidor falla.
- **Deduplicación en Base de Datos:** Las Server Actions y procedimientos almacenados (`crear_alquiler_transaccional`, `convertir_cotizacion_a_alquiler_transaccional`) deben verificar la clave de idempotencia antes de insertar registros, devolviendo `{ success: true, data, idempotent: true }` sin duplicar filas en caso de reintentos.

### 3. Gobernanza Contable y Partida Doble en Ledger
- **Invariante Matemática:** Todo asiento contable en `journal_entries` debe sumar exactamente cero:
  $$\sum \text{Débitos} + \sum \text{Créditos} = 0$$
- **Cálculo Tributario Exacto:** Las compras y alquileres con retenciones (IVA 19%, ReteFuente 2.5%/3.5%, ReteICA 9.66‰) deben redondearse a números enteros en pesos colombianos (COP sin centavos) antes de impactar el Ledger.
- **Trazabilidad de Kardex:** Toda entrada o salida de inventario debe registrarse de manera inmutable en `kardex_inventario` (`INGRESO_COMPRA`, `ALQUILER_SALIDA`, `DEVOLUCION_ENTRADA`).

### 4. Módulo de Caja y Control de Turnos
- **Sesiones Obligatorias:** Todo recaudo o movimiento en efectivo exige una sesión de caja `ABIERTA` (`caja_sesiones`).
- **Arqueo Ciego:** Los cierres de turno deben registrar el desglose físico de billetes y monedas colombianas mediante `ArqueoCierreModal.tsx`, calculando automáticamente sobrantes o faltantes con trazabilidad contable.

### 5. Seguridad en los Límites (Security-First)
- **Validación Dual-Layer con Zod:** Toda Server Action o API Route debe sanitizar y validar las entradas mediante esquemas Zod con `validateActionInput`.
- **Aislamiento Multitenant (RLS):** Toda consulta debe filtrar por `tenant_id` / `empresa_id` resuelto desde la sesión autenticada. Prohibido omitir RLS salvo en funciones administrativas de auditoría con `createAdminSupabaseClient()`.
- **Auditoría Sistemática:** Operaciones financieras, cambios de inventario o modificaciones de proveedores deben registrarse asíncronamente con `AuditLogger.logAsync`.

### 6. Frontend UI/UX y Patrones de Alta Ergonomía
- **Búsquedas Asistidas & Creación On-The-Fly:** Grillas y selectores complejos (`SelectorProveedorAsistido`, `EquipoCombobox`) deben permitir búsqueda predictiva instantánea y botón de creación rápida sin cerrar el modal principal ni perder borradores.
- **Navegación Teclado-Primero:** Los menús de autocompletado deben responder a `ArrowUp`, `ArrowDown`, `Enter` y `Escape` con estándar WAI-ARIA 1.2.
- **Inputs Numéricos Ergonómicos:** En campos de fletes o precios, utilizar `value === 0 ? '' : value` con placeholder `0` para evitar el rebote del cero al pulsar Backspace.
- **Gobernanza de Apilamiento (Z-Index):** Cuando un componente desplegable se expanda dentro de una fila repetitiva, la fila activa debe elevar su `z-index` (`zIndex: 100`) para evitar que filas precedentes lo oculten.
- **Estabilidad de Hooks React (`useCallback`):** Funciones consumidas en `useEffect` deben encapsularse con `useCallback` para evitar bucles de renderizado.
- **Compresión de Assets:** Logos corporativos deben redimensionarse mediante Canvas API (<150KB / máx 400×120px) antes de almacenarse en base de datos.

### 7. Diagnóstico y Saneamiento Operativo
- En caso de anomalías en datos o sospechas de registros duplicados en alquileres o inventario, ejecutar la herramienta forense:
  ```bash
  node scripts/diagnosticar_duplicados.mjs
  ```
- Para aprovisionar o verificar el usuario de prueba demo en entornos de staging o evaluación:
  ```bash
  node scripts/setup_demo_user.mjs
  ```

### 8. Gobernanza UltraAdmin, Licenciamiento y Servicios Puros
- **Servicios Puros Determinísticos:** Toda lógica de negocio que calcule suscripciones, planes o feature flags (`licencias-modulos.service.ts`) debe implementarse como funciones puras sin dependencias de I/O directo, acompañadas de su suite de tests unitarios en Vitest con 100% de cobertura.
- **Server Actions con Guard Exclusivo:** Las acciones administrativas transversales (`src/app/actions/ultraadmin.ts`) deben validar obligatoriamente que el usuario emisor posea el rol `SUPER_ADMIN` o `ULTRAADMIN` antes de instanciar `createAdminSupabaseClient()`.
- **Invalidación Forzada de Sesiones:** Todo cambio que degrade el estado de un usuario (`activo: false`) o modifique sus permisos debe ejecutar una revocación síncrona en Upstash Redis (`session:user:{id}`) y registrar el evento inmutable en `audit_logs` con `AuditLogger.logAsync`.
