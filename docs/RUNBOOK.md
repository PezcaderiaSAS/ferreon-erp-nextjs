# Runbook Operativo - FerreOn ERP

## Procedimientos de Despliegue
1. **Verificación de Tipos y Tests:** Asegurarse de que `npm run typecheck` reporte 0 errores y `npm run test` apruebe las 41 suites de pruebas unitarias (178 tests aprobados, 100% verde).
2. **Compilación de Producción:** Ejecutar `npm run build` (`prisma generate && next build`) para validar que las 23 rutas estáticas/dinámicas y el middleware de seguridad compilen con código 0.
3. **Migración de Base de Datos (Supabase):**
   Las migraciones deben ejecutarse en orden cronológico en el SQL Editor del dashboard de Supabase o mediante CLI:
   - `supabase/migrations/20260910_cotizaciones_y_facturas_pdf.sql` (Cotizaciones de obra, columnas tributarias y facturas).
   - `supabase/migrations/20260910_modulo_compras_y_asientos_contables.sql` (Estructura base de órdenes de compra y detalles).
   - `supabase/migrations/20260910_proveedores_y_retenciones_compras.sql` (Catálogo maestro de proveedores, retenciones y cuentas contables auxiliares).
   - `supabase/migrations/20260911_modulo_wms_bodegas_y_stocks.sql` (Bodegas múltiples y stock por almacén).
   - `supabase/migrations/20260914_modulo_caja_movimientos_y_arqueo.sql` (Control de turnos de caja, movimientos y arqueos).
   - `supabase/migrations/20260915_idempotencia_alquileres.sql` (Columna `idempotency_key`, índice único condicional `idx_alquileres_empresa_idempotency_key` y reemplazo atómico de RPC `crear_alquiler_transaccional`).
4. **Despliegue Continuo (CI/CD):** Al hacer push o merge a la rama `main`, Vercel ejecuta la compilación y despliegue a los edge networks automáticamente.

---

## Mantenimiento y Operaciones Críticas

### 1. Protocolo de Idempotencia y Blindaje Poka-Yoke en Alquileres
- **Escudo Visual Poka-Yoke:** Ante cualquier clic del usuario en "Guardar Alquiler", el componente `AlquilerBlockingOverlay.tsx` cubre la pantalla completa con un backdrop difuminado (`backdrop-blur-md`), spinner sincronizado y bloqueo físico absoluto de clics y teclas (`pointer-events-none`).
- **Idempotency Key:** Cada transacción genera un UUID v4 antes del envío. Si la Server Action `crearAlquilerAction` recibe una clave ya existente, retorna inmediatamente `{ success: true, data: existente, idempotent: true }` sin duplicar registros.
- **Índice Único en PostgreSQL:** La base de datos rechaza cualquier inserción duplicada mediante:
  ```sql
  CREATE UNIQUE INDEX idx_alquileres_empresa_idempotency_key 
  ON public.alquileres (empresa_id, idempotency_key) 
  WHERE idempotency_key IS NOT NULL;
  ```

### 2. Procedimiento de Diagnóstico Forense y Saneamiento de Datos
- **Detección de Duplicados:** Si se reportan anomalías en contratos o renglones de alquiler, ejecutar la herramienta forense:
  ```bash
  node scripts/diagnosticar_duplicados.mjs
  ```
- **Auditoría Forense:** Toda depuración o corrección manual de datos debe registrarse en `public.audit_logs` con la acción `DEPURACION_DUPLICADOS` para garantizar la trazabilidad inmutable del sistema.

### 3. Gestión de Caja, Turnos y Arqueo
- **Apertura de Turno:** Antes de registrar pagos en efectivo, el operador debe abrir caja en `/caja` especificando el monto base inicial.
- **Arqueo y Cierre:** Al finalizar el turno, se utiliza la calculadora de denominaciones de COP en `ArqueoCierreModal.tsx`. El sistema calcula la diferencia (sobrante/faltante) y genera el Comprobante Oficial de Arqueo imprimible.

### 4. Gestión del Ledger Contable y Cuentas Financieras
- Si una orden de compra o factura presenta fallos de asiento en `journal_entries`, verificar que las cuentas maestras existan en `financial_accounts`:
  - `1520 - Equipos y Maquinaria` (ASSET)
  - `2408 - IVA Descontable en Compras` (ASSET / Pasivo fiscal)
  - `2365 - ReteFuente por Pagar (Compras)` (LIABILITY)
  - `2368 - ReteICA por Pagar (Compras)` (LIABILITY)
  - `2205 - Cuentas por Pagar (Proveedores)` (LIABILITY)
  - `1105 - Caja Principal` (ASSET)
  - `1110 - Bancolombia Ahorros` (ASSET)
- La función de liquidación (`calculo-compras-tributario.ts`) rechaza automáticamente transacciones descuadradas ($\sum D \neq \sum C$) para blindar la contabilidad de la empresa.

### 5. Caché Distribuida y Resiliencia (Upstash Redis)
- **Invalidación Atómica:** Al registrar un alquiler, compra o proveedor, las Server Actions invalidan automáticamente las claves `compras:${tenantId}`, `proveedores:${tenantId}` y `cache:equipos`.
- **Modo Resiliente:** Si la base de datos presenta fluctuaciones de conectividad, el sistema mantiene lectura fluida a través de Upstash Redis, garantizando continuidad de servicio.

### 6. Emisión de Documentos PDF y Formatos de Impresión
- **Contratos de Alquiler:** Generación vectorial vía `@react-pdf/renderer` (`ContratoAlquilerPDF.tsx`) con logo dinámico del tenant.
- **Órdenes de Compra, Facturas y Arqueos:** Componentes modales con estilos `@media print` (`ComprobanteEntradaPDFModal.tsx`, `VisorDocumentoPDFModal.tsx`, `ComprobanteArqueoModal.tsx`) para impresión térmica o Carta/A4.

### 7. Supervisión y Seguridad UltraAdmin
- El panel `/admin/empresas` permite a los usuarios con rol `ULTRAADMIN` (evaluado con `public.is_ultra_admin()`) auditar eventos inmutables en `audit_logs`, suspender usuarios o gestionar tenants de forma centralizada.

---

## Troubleshooting Común

- **Error de ESLint en Scripts de Node:**
  - *Síntoma:* El editor o linter reporta `Cannot find module 'next/babel'` en archivos `.mjs` dentro de `scripts/`.
  - *Solución:* Los scripts utilitarios están excluidos en `.eslintignore` y en `ignorePatterns` de `.eslintrc.json`.
- **Caché de Cabeceras de Seguridad (CSP):**
  - *Síntoma:* Consola arroja bloqueos de scripts o advertencias sobre `upgrade-insecure-requests`.
  - *Solución:* Recarga forzada (`Ctrl + F5` o `Cmd + Shift + R`). Verificar que `src/lib/security/csp.ts` mantenga `'unsafe-inline'` para Next.js streaming hydration.
- **Apilamiento de Desplegables en Grillas:**
  - *Síntoma:* Un popover o combobox se renderiza por debajo de la fila siguiente.
  - *Solución:* La grilla utiliza elevación dinámica `zIndex: 100` en la fila activa y umbral de colisión de 220px para abrir hacia abajo de forma ergonómica.

---

<!-- AUTO-GENERATED: Variables de Entorno -->
## Variables de Entorno Requeridas
| Variable | Requerido | Descripción |
|----------|:---------:|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Llave anónima pública de Supabase |
| `SUPABASE_SECRET_KEY` | Sí | Clave de servidor para SDK `@supabase/server` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave service_role para operaciones administrativas/bypass RLS |
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL para Prisma ORM |
| `UPSTASH_REDIS_REST_URL` | Sí | Endpoint REST de Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token de autenticación de Upstash Redis |
| `CRON_SECRET` | No | Token para proteger cron jobs en Vercel |
| `STRIPE_SECRET_KEY` | No | Llave privada de Stripe para facturación SaaS |
<!-- AUTO-GENERATED END -->
