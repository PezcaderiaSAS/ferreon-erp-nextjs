# Speckit Tasks: Aprovisionamiento de Tenant Multi-Tenant y Dummy Data

## Tarea 1: Actualización de Prisma Schema [✅ COMPLETADA]
- [x] Modificar `prisma/schema.prisma` para agregar los nuevos campos al modelo `Tenant` (`telefono`, `ciudad`, `tamanoEmpresa`, `autorizado`).

## Tarea 2: Migración DDL - Función de Dummy Data Seeding [✅ COMPLETADA]
- [x] Crear archivo SQL `20260924120200_tenant_dummy_data_seeder.sql`.
- [x] Implementar la función `seed_dummy_tenant_data(p_empresa_id uuid, p_user_id uuid)` que inserte atómicamente:
  - 2 Clientes (Persona Natural y Jurídica).
  - 5 Equipos (Andamios, Taladros, etc.) y 1 Proveedor.
  - 1 Caja chica abierta con saldo inicial.
  - 1 Contrato de Alquiler activo asociado a un cliente y equipo.
  - 1 Orden de Compra o Subcontratación.
- [x] Asegurar que todos los registros tengan el `empresa_id` correcto y referencial.

## Tarea 3: Migración DDL - Trigger de Registro [✅ COMPLETADA]
- [x] Crear archivo SQL `20260924120300_tenant_onboarding_trigger.sql`.
- [x] Implementar la función `handle_new_tenant_registration()`:
  - Crear la empresa en `public.empresas` (`autorizado = false`, `trialing`).
  - Crear el acceso en `public.empresa_usuarios` como `ADMIN`.
  - **Llamar a la función de sembrado:** `PERFORM seed_dummy_tenant_data(v_empresa_id, new.id);`
- [x] Asociar el Trigger `AFTER INSERT` en `auth.users`.
- [x] Ejecutar las migraciones vía MCP. (✅ *Ejecutadas con éxito directamente vía Supabase MCP*).

## Tarea 4: Interfaz de Usuario (UI de Sign Up y Banner Global) [✅ COMPLETADA]
- [x] Editar `src/app/auth/login/page.tsx` para agregar los inputs: NIT, Teléfono, Ciudad, Tamaño de Empresa.
- [x] Crear/Editar un layout o componente global (ej. `TopBanner.tsx` / `AppShell.tsx`) que lea si `autorizado === false` y muestre: *"Modo Prueba - Esperando Activación Oficial"*.
- [x] Asegurar que el middleware permita el paso, y que las páginas funcionen.

## Tarea 5: Marca de Agua en PDFs [✅ COMPLETADA]
- [x] Modificar el generador de PDFs (Liquidaciones/Cotizaciones) para inyectar una marca de agua *"DOCUMENTO DE PRUEBA - NO VÁLIDO"* si el Tenant tiene `autorizado = false`.

---

# Speckit Tasks: Panel de Gobernanza UltraAdmin (SaaS Tenant Management)

## Tarea 6: Server Actions para Gobernanza (Backend) [✅ COMPLETADA]
- [x] Implementar `aprobarTenantAction` en `src/app/actions/ultraadmin.ts` (Actualiza `autorizado = true`).
- [x] Implementar `extenderLicenciaAction` (Actualiza `subscription_ends_at`).
- [x] Implementar `suspenderUsuarioAction` en (Actualiza estado de `empresa_usuarios`).
- [x] Asegurar que todas validen el rol `ULTRAADMIN` y usen bloqueos transaccionales e idempotencia.

## Tarea 7: Estado Global (Zustand) [✅ COMPLETADA]
- [x] Crear el archivo `src/infrastructure/state/ultraAdminStore.ts`.
- [x] Definir la interfaz de estado (`empresas`, `filtroEstado`, `tenantSeleccionado`, `drawerAbierto`).
- [x] Configurar las funciones de Optimistic UI y control de Loading/Mutating para prevenir Memory Leaks y doble clics.

## Tarea 8: Componente de Lista y Filtros (UI/UX) [✅ COMPLETADA]
- [x] Construir `<TenantListTable />` con Radix/Shadcn UI o Tailwind puro.
- [x] Crear los "Pills" interactivos para filtrar (Pendientes, Activas, Suspendidas, Expiradas).
- [x] Integrar el trigger para abrir el Drawer al hacer clic en una fila.

## Tarea 9: Componente Drawer Lateral de Detalles (UI/UX) [✅ COMPLETADA]
- [x] Construir `<TenantDetailDrawer />` (Cajón lateral deslizante).
- [x] Crear Tab: **Info & Estado** (Switch para Autorizar, mostrar datos corporativos y contacto).
- [x] Crear Tab: **Licencias** (Fecha de expiración y botón para extender).
- [x] Crear Tab: **Usuarios (IAM)** (Listado de usuarios de la empresa y botón de suspensión).

## Tarea 10: Integración Final en Ruta /admin/empresas [✅ COMPLETADA]
- [x] Modificar `src/app/admin/empresas/page.tsx` para importar el Store y renderizar `<TenantListTable />` y `<TenantDetailDrawer />`.
- [x] Conectar los Server Actions a los eventos UI utilizando llaves criptográficas (Idempotencia UUID v4).

---

# Speckit Tasks: Formalización 1-Clic Polimórfica y Stock Dinámico (SPEC-2026-COTIZACION-FORMALIZACION-002)

## Tarea 11: Función RPC / Migración SQL de Formalización In-Situ [✅ COMPLETADA]
- [x] Crear migración SQL con función transaccional `formalizar_alquiler_cotizacion_transaccional(p_payload JSONB)` para registros en `alquileres` con ID entero (`BIGINT`).
- [x] Aplicar bloqueo pesimista `SELECT ... FOR UPDATE` ordenado por ID ascendente para prevenir deadlocks.
- [x] Validar curva de ocupación concurrente en el rango de fechas `[fecha_inicio, fecha_fin]`.
- [x] Si no hay overbooking, actualizar `estado = 'ACTIVO'` (o `'ACTIVO_EN_OBRA'`), descontar stock disponible y registrar auditoría.

## Tarea 12: Server Action Polimórfica 'convertirCotizacionAContratoAction' [✅ COMPLETADA]
- [x] Refactorizar `convertirCotizacionAContratoAction` en `src/app/actions/cotizaciones.ts`.
- [x] Detectar tipo de ID: si es numérico (alquiler existente), invocar `formalizar_alquiler_cotizacion_transaccional`; si es UUID, invocar `convertir_cotizacion_a_alquiler_transaccional`.
- [x] Implementar soporte para ratificación de nueva fecha de inicio si la fecha original expiró.
- [x] Mapear errores de overbooking para retornar código `ERR_OVERBOOKING_CONCURRENTE` con detalle de día pico y déficit.

## Tarea 13: Adaptación de 'ConvertirCotizacionModal.tsx' [✅ COMPLETADA]
- [x] Eliminar validación estática engañosa contra `equipoEnBodega.stock_disponible` actual.
- [x] Excluir de la verificación ítems con `es_subcontratado: true`.
- [x] Detectar si `fecha_inicio` es anterior a hoy (`CURRENT_DATE`); en caso afirmativo, mostrar selector de ratificación de fecha de despacho antes de formalizar.
- [x] Manejar respuesta de overbooking conectando fluidamente con `ModalResolucionOverbooking` para derivar faltantes a subcontratación o PIN gerencial.

## Tarea 14: Sincronización en 'AlquileresInteractiveIsland.tsx' [✅ COMPLETADA]
- [x] Asegurar que al pulsar "Formalizar Contrato (1-Clic)" se entregue el objeto completo con fechas, detalles y tipo de origen.
- [x] Manejar la actualización reactiva en el store de Zustand e invalidar caché de cotizaciones y contratos.

## Tarea 15: Pruebas Unitarias y de Integración [✅ COMPLETADA]
- [x] Crear test en `tests/unit/formalizar-cotizacion-polimorfica.test.ts` validando la formalización exitosa de ID numérico y UUID.
- [x] Validar prevención de overbooking por curva de fechas y resolución asistida.

---

# Speckit Tasks: Blindaje Legal, Licencias y Ciberseguridad (SPEC-2026-LEGAL-APPSEC-BLINDAJE-001)

## Tarea 16: Infraestructura Legal — Cláusulas en /terminos y /privacidad [✅ COMPLETADA]
- [x] Actualizar `src/app/terminos/page.tsx` agregando la Cláusula 6 (Límites de responsabilidad, As Is, Liability Cap de 3 meses, supervisión humana obligatoria) y Cláusula 7 (Transparencia en uso de IA, mitigación de sesgos, confidencialidad de datos).
- [x] Actualizar `src/app/privacidad/page.tsx` detallando la separación Responsable vs Encargado (Multi-Tenant), aislamiento lógico RLS en Supabase y política de cookies de sesión estrictamente necesarias.

## Tarea 17: UI de Consentimiento Expreso y Modal Intersticial para Existentes [✅ COMPLETADA]
- [x] Crear `src/components/legal/ConsentCheckbox.tsx` con soporte ARIA, feedback de error y enlace a términos.
- [x] Crear `src/components/legal/TermsReacceptanceModal.tsx` para interceptar usuarios en Dashboard si no tienen aceptada la versión `1.0.0`.
- [x] Crear Server Action `registrarAceptacionTerminosAction()` con registro inmutable en `audit_logs` y conectarlo a Dashboard y Onboarding.

## Tarea 18: Auditoría de Dependencias y Script Anti-Copyleft (Node.js) [✅ COMPLETADA]
- [x] Crear el script `scripts/audit-licenses.mjs` con whitelist permisiva (MIT, Apache, BSD, ISC) y fallo ante licencias Copyleft (GPL, AGPL, SSPL).
- [x] Actualizar `package.json` para agregar `"audit:licenses": "node scripts/audit-licenses.mjs"`.

## Tarea 19: Migración de 'xlsx' a 'exceljs' (Erradicación de Riesgo IP/CVE) [✅ COMPLETADA]
- [x] Instalar `exceljs` en `package.json`.
- [x] Refactorizar `src/components/ui/neumorphism/NeuExcelImportWizard.tsx` para usar `exceljs`.
- [x] Desinstalar la dependencia legada `xlsx`.

## Tarea 20: Higiene de Secretos y Validación Fail-Fast de Entorno [✅ COMPLETADA]
- [x] Crear `src/config/env.ts` con validación Zod en tiempo de ejecución para `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `CRON_SECRET` y variables públicas.
- [x] Comprobar que ninguna clave privada esté expuesta en `NEXT_PUBLIC_*`.

## Tarea 21: Wrapper de Server Actions 'safeServerAction' y Anti-Injection [✅ COMPLETADA]
- [x] Crear `src/infrastructure/security/safeServerAction.ts` con Correlation ID, log privado y respuestas opacas sin filtración de schemas ni stack traces.
- [x] Crear `src/core/security/promptSanitizer.ts` para encapsular entradas no confiables con tags XML ante procesamiento por agentes.
- [x] Aplicar sanitización de errores y Correlation IDs en Server Actions clave en `src/app/actions/caja.ts` y `src/app/actions/onboarding.ts`.

## Tarea 22: Verificación Integral de Seguridad y Pruebas Unitarias [✅ COMPLETADA]
- [x] Ejecutar `npm run audit:licenses` y verificar 0 infracciones (758 paquetes auditados, 0 violaciones copyleft).
- [x] Ejecutar `npm run typecheck` (`tsc --noEmit`) asegurando 0 errores de TypeScript.
- [x] Ejecutar `npm run test` (`vitest run`) validando que las 60 suites sigan pasando al 100% (334/334 tests en verde).
