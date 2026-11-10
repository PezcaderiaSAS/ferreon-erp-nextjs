# Plan de Arquitectura e Implementación: SPEC-018
## Módulo de Rutas, Logística y Matriz de Fletes Bucaramanga

## 1. Resumen de Arquitectura
- **Especificación Asociada**: [spec.md](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/Alquileres_Erp/specs/018-rutas-logistica-fletes-bucaramanga/spec.md)
- **Módulo**: Logística, Rutas y Flota WMS
- **Autor**: @planner (Software Architect + Data Engineer)
- **Alcance**:
  - DDL de Supabase y esquema Prisma para zonas metropolitanas, rutas diarias y paradas de entrega/recogida.
  - Dominio puro `LogisticaRutasService` (TDD) para tarificación y secuenciación.
  - Server Actions delgadas (`src/app/actions/logistica.ts`) con Zod, `AuditLogger` e invalidación Upstash Redis.
  - Interfaz de usuario Linear High-Density (`/logistica`) con RSC + Suspense + Client Island.
  - Integración en el Wizard de Alquileres (`StepEquiposLogistica.tsx`) con selector de zonas de Bucaramanga.

---

## 2. Modelo de Datos y Esquema Relacional (PostgreSQL)

```sql
-- 1. Catálogo de Zonas de Flete del Área Metropolitana de Bucaramanga
CREATE TABLE IF NOT EXISTS public.zonas_flete_bucaramanga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    municipio VARCHAR(50) NOT NULL, -- 'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Lebrija'
    tarifa_base_motocarro NUMERIC(12,2) NOT NULL DEFAULT 20000,
    tarifa_base_camioneta NUMERIC(12,2) NOT NULL DEFAULT 45000,
    tarifa_base_turbo NUMERIC(12,2) NOT NULL DEFAULT 90000,
    tiempo_estimado_minutos INT NOT NULL DEFAULT 45,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Hoja de Ruta Diaria de Transporte
CREATE TABLE IF NOT EXISTS public.rutas_despacho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo_ruta VARCHAR(50) NOT NULL, -- Ej: 'RUTA-20261110-01'
    fecha_programada DATE NOT NULL DEFAULT CURRENT_DATE,
    vehiculo_placa VARCHAR(20) NOT NULL,
    vehiculo_tipo VARCHAR(50) NOT NULL, -- 'MOTOCARRO', 'CAMIONETA', 'TURBO_NPR'
    conductor_nombre VARCHAR(100) NOT NULL,
    conductor_telefono VARCHAR(50),
    estado VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA', -- 'PROGRAMADA', 'EN_CARGUE', 'EN_RUTA', 'FINALIZADA', 'CANCELADA'
    kilometros_estimados INT DEFAULT 0,
    total_fletes NUMERIC(14,2) NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Paradas de la Ruta (Entregas y Recogidas en Obra)
CREATE TABLE IF NOT EXISTS public.ruta_paradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    ruta_id UUID NOT NULL REFERENCES public.rutas_despacho(id) ON DELETE CASCADE,
    alquiler_id BIGINT REFERENCES public.alquileres(id) ON DELETE RESTRICT,
    cliente_id BIGINT REFERENCES public.clientes(id) ON DELETE RESTRICT,
    tipo_parada VARCHAR(30) NOT NULL, -- 'ENTREGA_DESPACHO', 'RECOGIDA_DEVOLUCION'
    orden_secuencia INT NOT NULL DEFAULT 1,
    direccion_obra TEXT NOT NULL,
    zona_id UUID REFERENCES public.zonas_flete_bucaramanga(id),
    estado_parada VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'EN_SITIO', 'COMPLETADA', 'FALLIDA'
    hora_llegada_estimada TIME,
    hora_completada TIMESTAMPTZ,
    receptor_nombre VARCHAR(100),
    receptor_telefono VARCHAR(50),
    observaciones TEXT,
    evidencia_fotos TEXT[] DEFAULT ARRAY[]::TEXT[],
    latitud NUMERIC(10,8),
    longitud NUMERIC(11,8),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Capa de Dominio Puro (TDD)
- Archivo: `src/core/services/logistica-rutas.service.ts`
- Métodos funcionales:
  - `calcularTarifaFlete(zona: ZonaFlete, vehiculo: TipoVehiculo): number`
  - `recomendarVehiculo(pesoTotalKg: number, volumenEstimadoM3: number): TipoVehiculo`
  - `secuenciarParadas(paradas: ParadaInput[]): ParadaSecuenciada[]`
  - `calcularProgresoRuta(paradas: ParadaEstado[]): { total: number, completadas: number, porcentaje: number }`

---

## 4. Server Actions Delgadas
- Archivo: `src/app/actions/logistica.ts`
- Funciones:
  - `obtenerZonasFleteAction()`
  - `obtenerRutasDespachoAction(fecha?: string)`
  - `crearRutaDespachoAction(input: CrearRutaSchema)`
  - `cambiarEstadoRutaAction(rutaId: string, nuevoEstado: string)`
  - `actualizarParadaAction(paradaId: string, input: ActualizarParadaSchema)`
  - Revalidación con `safeRevalidatePath('/logistica')` e invalidación en Redis.

---

## 5. UI/UX Linear High-Density
- Ruta: `/logistica` (Server Component conciso con prefetching).
- Client Island: `src/components/logistica/LogisticaInteractiveIsland.tsx`
- Modales diferidos (`next/dynamic`):
  - `CrearRutaModal.tsx`: Asignación de conductor, vehículo y selección de contratos pendientes de entrega.
  - `DetalleRutaDrawer.tsx`: Timeline interactivo con paradas, fotos de evidencia y mapa.
  - `RegistrarEvidenciaModal.tsx`: Subida fotográfica y georreferenciación en obra.
- Integración en Wizard:
  - Selector de Zonas de Bucaramanga en `StepEquiposLogistica.tsx` actualizando el flete en vivo.
