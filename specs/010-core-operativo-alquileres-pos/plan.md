# Plan de Arquitectura Técnica: SPEC-010 (Core Operativo POS)

## 1. Arquitectura de Componentes & Flujos

```
[Mostrador POS (UI / Atajos F2-F9 / Escáner QR)]
             │
             ├──> [Motor de Cotizaciones & Conversión 1-Clic]
             │         │
             │         └──> [Servicio Transaccional de Alquileres (RPC Supabase)]
             │                   │
             ├──> [Motor de Adendas Versionadas (v1.0 -> v1.1)]
             │         │
             │         └──> [Kardex & Curvas de Stock Concurrente]
             │
             └──> [Módulo de Devoluciones & Inspección con Semáforo]
                       │
                       ├──> [Catálogo de Daños & Tarifas de Avería]
                       └──> [Liquidación Dual contra Depósito & Sesión de Caja]
```

---

## 2. Modelado de Datos y Contratos de Base de Datos

### 2.1 Tabla: `alquiler_adendas` (Control de Versiones y Extensiones In-Place)
```sql
CREATE TABLE IF NOT EXISTS alquiler_adendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  alquiler_id BIGINT NOT NULL REFERENCES alquileres(id) ON DELETE CASCADE,
  numero_version VARCHAR(20) NOT NULL, -- 'v1.1', 'v1.2', etc.
  motivo VARCHAR(100) NOT NULL,        -- 'PRORROGA', 'ADICION_EQUIPOS', 'RETIRO_EQUIPOS', 'AJUSTE_TARIFA'
  dias_adicionales INT DEFAULT 0,
  monto_adicional DECIMAL(14,2) NOT NULL DEFAULT 0,
  datos_previos JSONB NOT NULL,        -- Snapshot del contrato antes de la adenda
  datos_nuevos JSONB NOT NULL,         -- Snapshot del contrato resultante
  creado_por VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Tabla: `catalogo_averias_equipos` (Costos Paramétricos para Inspección)
```sql
CREATE TABLE IF NOT EXISTS catalogo_averias_equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria_equipo VARCHAR(50),        -- 'ANDAMIOS', 'ROTOMARTILLOS', 'MEZCLADORAS', 'GENERAL'
  nombre_averia VARCHAR(100) NOT NULL, -- 'Limpieza profunda de mezcla', 'Cable cortado', 'Fisura menor', 'Pérdida total'
  gravedad VARCHAR(20) NOT NULL,       -- 'LEVE', 'MODERADA', 'GRAVE', 'REPOSICION'
  costo_sugerido DECIMAL(12,2) NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Contratos de Server Actions (Frontera de Aplicación)

### 3.1 `crearAlquilerRapidoPosAction(input: CrearAlquilerPosInput)`
- Entrada optimizada para mostrador: cliente seleccionado o creación on-the-fly, ítems agregados por código de barras/código rápido, método de pago del depósito y fletes.
- Ejecución atómica en una única transacción PostgreSQL (bloqueo `FOR UPDATE` de stock).

### 3.2 `convertirCotizacionAContratoPosAction(cotizacionId, metodoPagoDeposito, montoDeposito)`
- Valida stock en 1 paso, descuenta inventario, actualiza cotización a `CONVERTIDA`, crea el contrato y registra el abono inicial en la sesión de caja abierta.

### 3.3 `generarAdendaContratoAction(input: CrearAdendaInput)`
- Modifica el contrato existente, calcula el nuevo subtotal y saldo pendiente, genera el registro histórico en `alquiler_adendas` y emite comprobante de adenda.

### 3.4 `liquidarDevolucionPosAction(input: LiquidarDevolucionPosInput)`
- Procesa el checklist de cada ítem (Bueno/Sucio/Dañado), calcula cargos de avería y genera el ingreso o egreso en caja automáticamente.
