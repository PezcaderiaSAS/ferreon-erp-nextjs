# Runbook Operativo - FerreOn ERP

## Procedimientos de Despliegue
1. **Verificación de Tipos y Tests:** Asegurarse de que `npm run typecheck` reporte 0 errores y `npm run test` apruebe las 26 suites de pruebas unitarias (94 tests).
2. **Compilación de Producción:** Ejecutar `npm run build` para validar que las 22 rutas estáticas/dinámicas y el middleware de seguridad compilen con código 0.
3. **Migración de Base de Datos (Supabase):**
   Las migraciones deben ejecutarse en orden cronológico en el SQL Editor del dashboard de Supabase o mediante CLI:
   - `supabase/migrations/20260910_cotizaciones_y_facturas_pdf.sql` (Cotizaciones de obra, columnas tributarias y facturas).
   - `supabase/migrations/20260910_modulo_compras_y_asientos_contables.sql` (Estructura base de órdenes de compra y detalles).
   - `supabase/migrations/20260910_proveedores_y_retenciones_compras.sql` (Catálogo maestro de proveedores, retenciones comerciales y cuentas contables auxiliares).
4. **Despliegue Continuo (CI/CD):** Al hacer push o merge a la rama `main`, Vercel ejecuta la compilación y despliegue a los edge networks automáticamente.

---

## Mantenimiento y Operaciones Críticas

### 1. Gestión del Ledger Contable y Cuentas Financieras
- Si una orden de compra o factura presenta fallos de asiento en `journal_entries`, verificar que las cuentas maestras existan en `financial_accounts`:
  - `1520 - Equipos y Maquinaria` (ASSET)
  - `2408 - IVA Descontable en Compras` (ASSET / Pasivo fiscal)
  - `2365 - ReteFuente por Pagar (Compras)` (LIABILITY)
  - `2368 - ReteICA por Pagar (Compras)` (LIABILITY)
  - `2205 - Cuentas por Pagar (Proveedores)` (LIABILITY)
  - `1105 - Caja Principal` (ASSET)
  - `1110 - Bancolombia Ahorros` (ASSET)
- La función de liquidación (`calculo-compras-tributario.ts`) rechaza automáticamente transacciones descuadradas ($\sum D \neq \sum C$) para blindar la contabilidad de la empresa.

### 2. Caché Distribuida y Resiliencia (Upstash Redis)
- **Invalidación Atómica:** Al registrar una compra o proveedor, las Server Actions invalidan automáticamente las claves `compras:${tenantId}`, `proveedores:${tenantId}` y `cache:equipos`.
- **Modo Resiliente:** Si la base de datos de Supabase no tiene creadas físicamente las tablas nuevas en un entorno local, el sistema mantiene persistencia y lectura fluida a través de Upstash Redis, evitando caídas del servicio para los operadores.

### 3. Emisión de Documentos PDF y Formatos de Impresión
- **Órdenes de Compra y Entradas:** El componente `ComprobanteEntradaPDFModal.tsx` genera el documento corporativo optimizado para impresión térmica o formato Carta/A4 mediante estilos `@media print`.
- **Facturas y Cotizaciones:** El componente `VisorDocumentoPDFModal.tsx` permite previsualizar y descargar documentos fiscales con desglose de IVA (19%) y retenciones comerciales.

### 4. Supervisión y Seguridad UltraAdmin
- El panel `/admin/empresas` permite a los usuarios con rol `ULTRAADMIN` (evaluado con `public.is_ultra_admin()`) auditar eventos inmutables en `audit_logs`, suspender usuarios o cambiar membresías de tenants de forma centralizada.

---

## Troubleshooting Común

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
| `UPSTASH_REDIS_REST_URL` | Sí | Endpoint REST de Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token de autenticación de Upstash Redis |
| `STRIPE_SECRET_KEY` | No | Llave privada de Stripe para facturación SaaS |
<!-- AUTO-GENERATED END -->
