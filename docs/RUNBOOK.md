# Runbook Operativo - Alquileres System

## Procedimientos de Despliegue y Validación

1. **Verificación Estricta de Tipos:**
   Ejecutar validación estricta de TypeScript sin emisión de artefactos:
   ```bash
   npm run typecheck
   ```
   *Criterio de éxito:* 0 errores reportados (`Exit code 0`).

2. **Ejecución de Suites de Pruebas Unitarias e Integración:**
   Ejecutar la suite completa con Vitest:
   ```bash
   npm run test
   ```
   *Criterio de éxito:* **53 suites pasadas, 272 tests aprobados (100% verde)**.

3. **Compilación de Producción:**
   Compilar la aplicación completa con generación del cliente Prisma:
   ```bash
   npm run build
   ```
   *Criterio de éxito:* **24 rutas estáticas y dinámicas prerenderizadas con éxito (`Exit code 0`)**.

4. **Migraciones de Base de Datos (Supabase):**
   Las migraciones deben ejecutarse en orden cronológico en el SQL Editor de Supabase o mediante CLI:
   - `supabase/migrations/20260910_cotizaciones_y_facturas_pdf.sql` (Cotizaciones de obra, columnas tributarias y facturas).
   - `supabase/migrations/20260910_modulo_compras_y_asientos_contables.sql` (Estructura base de órdenes de compra y detalles).
   - `supabase/migrations/20260910_proveedores_y_retenciones_compras.sql` (Catálogo maestro de proveedores, retenciones y cuentas contables auxiliares).
   - `supabase/migrations/20260911_modulo_wms_bodegas_y_stocks.sql` (Bodegas múltiples y stock por almacén).
   - `supabase/migrations/20260914_modulo_caja_movimientos_y_arqueo.sql` (Control de turnos de caja, movimientos y arqueos).
   - `supabase/migrations/20260915_idempotencia_alquileres.sql` (Columna `idempotency_key`, índice único condicional `idx_alquileres_empresa_idempotency_key` y reemplazo atómico de RPC `crear_alquiler_transaccional`).
   - `supabase/migrations/20260916_cotizaciones_pesimistas_y_pagos_mixtos.sql` (Tablas `cliente_movimientos_saldo`, `pago_metodos_detalle`, columna `clientes.saldo_a_favor`).
   - `supabase/migrations/20260916_devoluciones_avanzadas_y_subcontrataciones.sql` (Tablas `devoluciones`, `devolucion_detalles`, Split-Line y RPC `procesar_devolucion_avanzada`).
   - `supabase/migrations/20260917_compras_costo_promedio_y_cxp.sql` (Costo Promedio Ponderado PMP, Cuentas por Pagar y RPC `recibir_compra_y_actualizar_pmp_transaccional`).
   - `supabase/migrations/20260917_ultraadmin_licencias_modulos_y_permisos.sql` (Columnas `subscription_ends_at`, `dias_gracia`, `modulos_activos` en `empresas` y `permisos_custom` en `empresa_usuarios`).

5. **Despliegue Continuo (CI/CD en Vercel):**
   Al hacer push o merge a la rama principal `main`, Vercel ejecuta la compilación automática e inyecta las cabeceras CSP dinámicas.

---

## Mantenimiento y Operaciones Críticas

### 1. Verificación en Vivo y Flujo E2E (Landing Page → Login → Dashboard)
- **Acceso Público:** La ruta `/` expone la Landing Page corporativa con 12 componentes visuales sin requerir sesión activa.
- **Acceso a ERP:** Enlace superior "Ingresar al ERP" redirige a `/auth/login`.
- **Usuario Demo Predeterminado:**
  - **Email:** `demo@alquileres-system.com`
  - **Contraseña:** `Alquileres2026*`
  - **Tenant Vinculado:** `ac8719ea-f16a-4538-b308-40d9511a14cb` (`ferreon-principal`).
- **Redirección:** Tras autenticación válida, el middleware y la acción de login transfieren al usuario al panel principal en `/dashboard`.
- **Re-aprovisionamiento de Usuario Demo:** Si la cuenta demo se elimina o desconfigura, ejecutar:
  ```bash
  node scripts/setup_demo_user.mjs
  ```

### 2. Protocolo de Idempotencia y Blindaje Poka-Yoke en Alquileres
- **Escudo Visual Poka-Yoke:** Ante cualquier clic del usuario en "Guardar Alquiler", el componente `AlquilerBlockingOverlay.tsx` cubre la pantalla completa con un backdrop difuminado (`backdrop-blur-md`), spinner sincronizado y bloqueo físico absoluto de clics y teclas (`pointer-events-none`).
- **Idempotency Key:** Cada transacción genera un UUID v4 antes del envío. Si la Server Action `crearAlquilerAction` recibe una clave ya existente, retorna inmediatamente `{ success: true, data: existente, idempotent: true }` sin duplicar registros.
- **Índice Único en PostgreSQL:** La base de datos rechaza cualquier inserción duplicada mediante:
  ```sql
  CREATE UNIQUE INDEX idx_alquileres_empresa_idempotency_key 
  ON public.alquileres (empresa_id, idempotency_key) 
  WHERE idempotency_key IS NOT NULL;
  ```

### 3. Procedimiento de Diagnóstico Forense de Datos
- **Detección de Duplicados:** Si se reportan anomalías en contratos o renglones de alquiler, ejecutar la herramienta forense:
  ```bash
  node scripts/diagnosticar_duplicados.mjs
  ```
- **Auditoría Forense:** Toda depuración manual de datos debe registrarse en `public.audit_logs` con la acción `DEPURACION_DUPLICADOS` para garantizar trazabilidad inmutable.

### 4. Gestión de Caja, Turnos y Arqueo
- **Apertura de Turno:** Antes de registrar pagos en efectivo, el operador debe abrir caja en `/caja` especificando el monto base inicial.
- **Arqueo y Cierre:** Al finalizar el turno, se utiliza la calculadora de denominaciones de COP en `ArqueoCierreModal.tsx`. El sistema calcula la diferencia (sobrante/faltante) y genera el Comprobante Oficial de Arqueo imprimible.

### 5. Gestión del Ledger Contable y Cuentas Financieras
- Si una orden de compra o factura presenta fallos de asiento en `journal_entries`, verificar que las cuentas maestras existan en `financial_accounts`:
  - `1520 - Equipos y Maquinaria` (ASSET)
  - `2408 - IVA Descontable en Compras` (ASSET / Pasivo fiscal)
  - `2365 - ReteFuente por Pagar (Compras)` (LIABILITY)
  - `2368 - ReteICA por Pagar (Compras)` (LIABILITY)
  - `2205 - Cuentas por Pagar (Proveedores)` (LIABILITY)
  - `1105 - Caja Principal` (ASSET)
  - `1110 - Bancolombia Ahorros` (ASSET)
- La función de liquidación (`calculo-compras-tributario.ts`) rechaza automáticamente transacciones descuadradas ($\sum D \neq \sum C$) para blindar la contabilidad de la empresa.

### 6. Caché Distribuida y Resiliencia (Upstash Redis)
- **Invalidación Atómica:** Al registrar un alquiler, compra o proveedor, las Server Actions invalidan automáticamente las claves `cache:compras:${tenantId}`, `cache:proveedores:${tenantId}` y `cache:equipos:${tenantId}`.
- **Modo Resiliente:** Si la base de datos presenta fluctuaciones de conectividad, el sistema mantiene lectura fluida a través de Upstash Redis, garantizando continuidad de servicio.

### 7. Emisión de Documentos PDF y Formatos de Impresión
- **Contratos de Alquiler:** Generación vectorial vía `@react-pdf/renderer` (`ContratoAlquilerPDF.tsx`) con logo dinámico del tenant.
- **Órdenes de Compra, Facturas y Arqueos:** Componentes modales con estilos `@media print` (`ComprobanteEntradaPDFModal.tsx`, `VisorDocumentoPDFModal.tsx`, `ComprobanteArqueoModal.tsx`) para impresión térmica o Carta/A4.

### 8. Módulo de Devoluciones Parciales, Split-Line e Inspección Física
- **Acceso:** Ruta `/devoluciones`.
- **Flujo Operativo:**
  1. Seleccionar contrato con saldo de equipos en obra (`PENDIENTE_DEVOLUCION`).
  2. El modal `InspeccionTecnicaModal` calcula en tiempo real (0 ms) el split-line de los equipos retornados sin alterar las líneas activas restantes.
  3. Clasificar cada unidad: `BUENO` (retorna a `stock_disponible`), `MANTENIMIENTO` (pasa a `stock_mantenimiento`) o `PERDIDA_TOTAL` (sale de `stock_total` y suma a `stock_perdido`).
  4. La tarjeta `LiquidacionGarantiaCard` compensa automáticamente:
     $$\text{Saldo Neto} = \text{Depósito en Garantía} - \text{Alquiler Causado} - \text{Costo Reparación/Reposición}$$
  5. El guardado es atómico vía `procesar_devolucion_avanzada` con `idempotency_key` y bloqueo visual Poka-Yoke (`DevolucionBlockingOverlay`).
  6. Al confirmar, se emite el acta de recepción oficial e imprimible en PDF (`ComprobanteDevolucionPDFModal`).

### 9. Módulo de Subcontrataciones de Maquinaria (Cómputo a Dos Tiempos)
- **Acceso:** Ruta `/subcontrataciones`.
- **Ciclo de Vida:**
  1. `SOLICITADA` / `ORDENADA`: Orden creada con el aliado comercial.
  2. `ACTIVA`: Maquinaria despachada a la obra del cliente.
  3. `RECIBIDA_EN_BODEGA`: El cliente retorna la máquina. Se suspende la facturación al cliente y el ERP emite alerta ámbar para que bodega devuelva el equipo al aliado.
  4. `DEVUELTA_A_PROVEEDOR`: Se registra el despacho físico de retorno con `registrarRetornoAProveedorAction`, congelando el costo diario del proveedor.
  5. `LIQUIDADA`: En `LiquidarSubcontratacionModal`, se liquidan retenciones DIAN (ReteFuente 2.5%, ReteICA 9.66‰), se computa el margen comercial neto y se asienta la partida doble balanceada en el Ledger (Cuentas `6135` Débito vs `2365`, `2368`, `2205` Crédito).

### 10. Operación y Gobernanza UltraAdmin (Licencias, Módulos e Invalidación de Sesiones)
- **Acceso:** Tab `Usuarios` en `/configuracion` o `/admin/empresas` (exclusivo para `SUPER_ADMIN` o `ULTRAADMIN`).
- **Monitoreo Transversal de Tenants:**
  - Semáforo determinístico de días de licencia restantes:
    - Verde (`ACTIVA`): > 7 días.
    - Ámbar (`POR_VENCER`): $\le 7$ días.
    - Púrpura (`EN_GRACIA`): Vencida pero dentro de los días de gracia configurados.
    - Rojo (`VENCIDA`): Superado el período de gracia.
- **Gestión de Feature Flags por Empresa:**
  - El modal `GestionModulosModal.tsx` permite activar/desactivar módulos por tenant en tiempo real con invalidación de caché en Redis (`cache:tenant:${tenantId}:modulos`).
- **Extensión Rápida de Licencias:**
  - El modal `ExtenderLicenciaModal.tsx` proporciona botones de 1-clic (+15d, +30d, +90d, +365d) y selector de fecha manual con auditoría obligatoria.
- **Revocación Forzada de Sesiones en <1s:**
  - Cuando un UltraAdmin suspende un usuario (`activo: false`) o modifica sus permisos, el sistema ejecuta un borrado atómico en Upstash Redis (`session:user:${userId}`), expulsando la sesión activa al instante.

---

## Troubleshooting Común

- **Redirección tras Login no Entra al Dashboard:**
  - *Síntoma:* El usuario inicia sesión correctamente pero aterriza nuevamente en la landing page.
  - *Solución:* Asegurarse de que el formulario en `/auth/login` y `/api/auth/callback` redirijan a `/dashboard` y no a `/`.
- **Error de ESLint en Scripts de Node:**
  - *Síntoma:* El editor o linter reporta advertencias en scripts `.mjs` dentro de `scripts/`.
  - *Solución:* Los scripts utilitarios están excluidos en `.eslintignore` y en `ignorePatterns` de `.eslintrc.json`.
- **Caché de Cabeceras de Seguridad (CSP):**
  - *Síntoma:* Consola arroja bloqueos de scripts o advertencias sobre `upgrade-insecure-requests`.
  - *Solución:* Recarga forzada (`Ctrl + F5` o `Cmd + Shift + R`). Verificar que `src/lib/security/csp.ts` mantenga soporte para streaming hydration de Next.js 14.
- **Apilamiento de Desplegables en Grillas:**
  - *Síntoma:* Un popover o combobox se renderiza por debajo de la fila siguiente.
  - *Solución:* La grilla utiliza elevación dinámica `zIndex: 100` en la fila activa y umbral de colisión de 220px para abrir hacia abajo de forma ergonómica.

---

<!-- AUTO-GENERATED: Variables de Entorno -->
## Variables de Entorno Requeridas
| Variable | Requerido | Descripción |
|----------|:---------:|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase (HTTPS) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Llave anónima pública JWT de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave service_role para operaciones administrativas UltraAdmin |
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL con pooling para Prisma ORM |
| `UPSTASH_REDIS_REST_URL` | Sí | Endpoint REST de Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token de autenticación de Upstash Redis |
| `CRON_SECRET` | No | Token secreto para proteger cron jobs en Vercel |
| `STRIPE_SECRET_KEY` | No | Llave privada de Stripe para facturación SaaS |
| `NEXT_PUBLIC_APP_URL` | Sí | URL base de la aplicación para redirecciones y callbacks |
| `NODE_ENV` | Sí | Entorno de ejecución (`development`, `test`, `production`) |
<!-- AUTO-GENERATED END -->
