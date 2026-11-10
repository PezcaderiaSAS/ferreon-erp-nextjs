-- ============================================================================
-- MIGRACIÓN CANÓNICA: 20261110_modulo_rutas_y_fletes_bucaramanga.sql
-- Módulo: Rutas de Transporte, Despachos, Recogidas y Matriz de Fletes
-- Proyecto: Alquileres System (FerreOn ERP & WMS)
-- Región: Bucaramanga y Área Metropolitana (Floridablanca, Girón, Piedecuesta, Lebrija)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLA: ZONAS DE FLETE DEL ÁREA METROPOLITANA DE BUCARAMANGA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zonas_flete_bucaramanga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    municipio VARCHAR(50) NOT NULL, -- 'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Lebrija'
    tarifa_base_motocarro NUMERIC(12,2) NOT NULL DEFAULT 20000 CHECK (tarifa_base_motocarro = TRUNC(tarifa_base_motocarro)),
    tarifa_base_camioneta NUMERIC(12,2) NOT NULL DEFAULT 45000 CHECK (tarifa_base_camioneta = TRUNC(tarifa_base_camioneta)),
    tarifa_base_turbo NUMERIC(12,2) NOT NULL DEFAULT 90000 CHECK (tarifa_base_turbo = TRUNC(tarifa_base_turbo)),
    tiempo_estimado_minutos INT NOT NULL DEFAULT 45,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_zona_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- ----------------------------------------------------------------------------
-- 2. TABLA: HOJAS DE RUTA DIARIA DE DESPACHO / TRANSPORTE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rutas_despacho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo_ruta VARCHAR(50) NOT NULL, -- Ej: 'RUTA-20261110-01'
    fecha_programada DATE NOT NULL DEFAULT CURRENT_DATE,
    vehiculo_placa VARCHAR(20) NOT NULL,
    vehiculo_tipo VARCHAR(50) NOT NULL DEFAULT 'CAMIONETA' CHECK (vehiculo_tipo IN ('MOTOCARRO', 'CAMIONETA', 'TURBO_NPR')),
    conductor_nombre VARCHAR(100) NOT NULL,
    conductor_telefono VARCHAR(50),
    estado VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA' CHECK (estado IN ('PROGRAMADA', 'EN_CARGUE', 'EN_RUTA', 'FINALIZADA', 'CANCELADA')),
    kilometros_estimados INT DEFAULT 0,
    total_fletes NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_fletes = TRUNC(total_fletes)),
    observaciones TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_ruta_empresa_codigo UNIQUE (empresa_id, codigo_ruta)
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: PARADAS DE RUTA (ENTREGAS Y RECOGIDAS EN OBRA)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ruta_paradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    ruta_id UUID NOT NULL REFERENCES public.rutas_despacho(id) ON DELETE CASCADE,
    alquiler_id BIGINT REFERENCES public.alquileres(id) ON DELETE RESTRICT,
    cliente_id BIGINT REFERENCES public.clientes(id) ON DELETE RESTRICT,
    tipo_parada VARCHAR(30) NOT NULL DEFAULT 'ENTREGA_DESPACHO' CHECK (tipo_parada IN ('ENTREGA_DESPACHO', 'RECOGIDA_DEVOLUCION')),
    orden_secuencia INT NOT NULL DEFAULT 1,
    direccion_obra TEXT NOT NULL,
    zona_id UUID REFERENCES public.zonas_flete_bucaramanga(id) ON DELETE SET NULL,
    estado_parada VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_parada IN ('PENDIENTE', 'EN_SITIO', 'COMPLETADA', 'FALLIDA')),
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

-- ----------------------------------------------------------------------------
-- 4. ÍNDICES DE RENDIMIENTO (DBRE)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rutas_empresa_fecha ON public.rutas_despacho (empresa_id, fecha_programada DESC);
CREATE INDEX IF NOT EXISTS idx_paradas_ruta_secuencia ON public.ruta_paradas (ruta_id, orden_secuencia ASC);
CREATE INDEX IF NOT EXISTS idx_paradas_alquiler ON public.ruta_paradas (alquiler_id);
CREATE INDEX IF NOT EXISTS idx_zonas_empresa_municipio ON public.zonas_flete_bucaramanga (empresa_id, municipio);

-- ----------------------------------------------------------------------------
-- 5. HABILITACIÓN DE RLS Y POLÍTICAS ZERO-TRUST
-- ----------------------------------------------------------------------------
ALTER TABLE public.zonas_flete_bucaramanga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutas_despacho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ruta_paradas ENABLE ROW LEVEL SECURITY;

-- 5.1 Políticas Zonas de Flete
CREATE POLICY "p0_strict_tenant_isolation_zonas_flete"
ON public.zonas_flete_bucaramanga
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 5.2 Políticas Rutas Despacho
CREATE POLICY "p0_strict_tenant_isolation_rutas_despacho"
ON public.rutas_despacho
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- 5.3 Políticas Paradas de Ruta
CREATE POLICY "p0_strict_tenant_isolation_ruta_paradas"
ON public.ruta_paradas
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (
        empresa_id = public.get_current_tenant_id()
        AND public.get_current_tenant_id() IS NOT NULL
    )
);

-- ----------------------------------------------------------------------------
-- 6. SEEDER CANÓNICO DE ZONAS METROPOLITANAS PARA EMPRESAS EXISTENTES
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    emp RECORD;
BEGIN
    FOR emp IN (SELECT id FROM public.empresas) LOOP
        -- Bucaramanga Centro / Norte
        INSERT INTO public.zonas_flete_bucaramanga (
            empresa_id, codigo, nombre, municipio, tarifa_base_motocarro, tarifa_base_camioneta, tarifa_base_turbo, tiempo_estimado_minutos
        ) VALUES (
            emp.id, 'BGA_CENTRO_NORTE', 'Bucaramanga - Centro / San Francisco / Norte', 'Bucaramanga', 20000, 40000, 80000, 35
        ) ON CONFLICT (empresa_id, codigo) DO NOTHING;

        -- Bucaramanga Cabecera / Sur
        INSERT INTO public.zonas_flete_bucaramanga (
            empresa_id, codigo, nombre, municipio, tarifa_base_motocarro, tarifa_base_camioneta, tarifa_base_turbo, tiempo_estimado_minutos
        ) VALUES (
            emp.id, 'BGA_CABECERA_SUR', 'Bucaramanga - Cabecera / Sotomayor / Provenza / Real de Minas', 'Bucaramanga', 22000, 45000, 85000, 40
        ) ON CONFLICT (empresa_id, codigo) DO NOTHING;

        -- Floridablanca Cañaveral
        INSERT INTO public.zonas_flete_bucaramanga (
            empresa_id, codigo, nombre, municipio, tarifa_base_motocarro, tarifa_base_camioneta, tarifa_base_turbo, tiempo_estimado_minutos
        ) VALUES (
            emp.id, 'FLORIDA_CANAVERAL', 'Floridablanca - Cañaveral / El Bosque / Casco Antiguo', 'Floridablanca', 25000, 50000, 95000, 45
        ) ON CONFLICT (empresa_id, codigo) DO NOTHING;

        -- Floridablanca Ruitoque
        INSERT INTO public.zonas_flete_bucaramanga (
            empresa_id, codigo, nombre, municipio, tarifa_base_motocarro, tarifa_base_camioneta, tarifa_base_turbo, tiempo_estimado_minutos
        ) VALUES (
            emp.id, 'FLORIDA_RUITOQUE', 'Floridablanca - Ruitoque Condominio / Mesa de Ruitoque', 'Floridablanca', 35000, 70000, 130000, 60
        ) ON CONFLICT (empresa_id, codigo) DO NOTHING;

        -- Girón Chimitá
        INSERT INTO public.zonas_flete_bucaramanga (
            empresa_id, codigo, nombre, municipio, tarifa_base_motocarro, tarifa_base_camioneta, tarifa_base_turbo, tiempo_estimado_minutos
        ) VALUES (
            emp.id, 'GIRON_CHIMITA', 'Girón - Zona Industrial Chimitá / Río Frío', 'Girón', 25000, 50000, 95000, 40
        ) ON CONFLICT (empresa_id, codigo) DO NOTHING;

        -- Girón Poblado
        INSERT INTO public.zonas_flete_bucaramanga (
            empresa_id, codigo, nombre, municipio, tarifa_base_motocarro, tarifa_base_camioneta, tarifa_base_turbo, tiempo_estimado_minutos
        ) VALUES (
            emp.id, 'GIRON_POBLADO', 'Girón - El Poblado / Casco Histórico / Rincón de Girón', 'Girón', 28000, 55000, 105000, 50
        ) ON CONFLICT (empresa_id, codigo) DO NOTHING;

        -- Piedecuesta Guatiguará
        INSERT INTO public.zonas_flete_bucaramanga (
            empresa_id, codigo, nombre, municipio, tarifa_base_motocarro, tarifa_base_camioneta, tarifa_base_turbo, tiempo_estimado_minutos
        ) VALUES (
            emp.id, 'PIEDECUESTA_GUATIGUARA', 'Piedecuesta - Guatiguará / Casco Urbano / San Telmo', 'Piedecuesta', 35000, 70000, 130000, 60
        ) ON CONFLICT (empresa_id, codigo) DO NOTHING;

        -- Lebrija Palonegro
        INSERT INTO public.zonas_flete_bucaramanga (
            empresa_id, codigo, nombre, municipio, tarifa_base_motocarro, tarifa_base_camioneta, tarifa_base_turbo, tiempo_estimado_minutos
        ) VALUES (
            emp.id, 'LEBRIJA_PALONEGRO', 'Lebrija - Aeropuerto Palonegro / Casco Urbano', 'Lebrija', 40000, 85000, 160000, 75
        ) ON CONFLICT (empresa_id, codigo) DO NOTHING;
    END LOOP;
END $$;
