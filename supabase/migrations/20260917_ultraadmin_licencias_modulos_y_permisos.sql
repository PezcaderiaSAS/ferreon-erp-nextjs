-- ==============================================================================
-- MIGRACIÓN: GOBERNANZA ULTRAADMIN, LICENCIAMIENTO & FEATURE FLAGS DE MÓDULOS
-- Archivo: 20260917_ultraadmin_licencias_modulos_y_permisos.sql
-- Descripción: 
--   1. Agrega soporte para fecha de expiración contractual de licencias (subscription_ends_at),
--      días de gracia contractual y matriz de módulos activos por tenant en la tabla empresas.
--   2. Agrega soporte para permisos custom y auditoría de cambios de estado en empresa_usuarios.
--   3. Índices de búsqueda y políticas RLS optimizadas para UltraAdmin.
-- ==============================================================================

-- 1. EXTENSIÓN DE LA TABLA EMPRESAS (TENANTS)
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS dias_gracia INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS modulos_activos JSONB DEFAULT '["ALQUILERES", "COTIZACIONES", "BODEGA", "COMPRAS", "CXP", "CAJA", "DEVOLUCIONES", "SUBCONTRATACIONES", "FACTURACION"]'::jsonb;

-- Inicializar valores nulos existentes en empresas
UPDATE public.empresas 
SET subscription_ends_at = COALESCE(trial_ends_at, NOW() + INTERVAL '30 days')
WHERE subscription_ends_at IS NULL;

UPDATE public.empresas 
SET modulos_activos = '["ALQUILERES", "COTIZACIONES", "BODEGA", "COMPRAS", "CXP", "CAJA", "DEVOLUCIONES", "SUBCONTRATACIONES", "FACTURACION"]'::jsonb
WHERE modulos_activos IS NULL;

-- 2. EXTENSIÓN DE LA TABLA EMPRESA_USUARIOS (MEMBERSHIPS)
ALTER TABLE public.empresa_usuarios
ADD COLUMN IF NOT EXISTS permisos_custom JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ultimo_cambio_estado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS fecha_ultimo_cambio_estado TIMESTAMPTZ;

-- 3. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_empresas_subscription_ends ON public.empresas (subscription_ends_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_empresa_usuarios_permisos ON public.empresa_usuarios USING gin (permisos_custom);

-- 4. ACTUALIZACIÓN DE POLÍTICAS ROW LEVEL SECURITY (RLS)
-- Asegurar que los roles ULTRAADMIN y SUPERADMIN puedan consultar y gestionar cross-tenant
DROP POLICY IF EXISTS "ultraadmin_full_access_empresas" ON public.empresas;
CREATE POLICY "ultraadmin_full_access_empresas" ON public.empresas
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.empresa_usuarios eu
            WHERE eu.user_id = auth.uid()
              AND eu.rol IN ('ULTRAADMIN', 'SUPERADMIN')
              AND eu.estado = 'ACTIVO'
              AND eu.deleted_at IS NULL
        )
        OR id IN (
            SELECT empresa_id FROM public.empresa_usuarios
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "ultraadmin_full_access_empresa_usuarios" ON public.empresa_usuarios;
CREATE POLICY "ultraadmin_full_access_empresa_usuarios" ON public.empresa_usuarios
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.empresa_usuarios eu
            WHERE eu.user_id = auth.uid()
              AND eu.rol IN ('ULTRAADMIN', 'SUPERADMIN')
              AND eu.estado = 'ACTIVO'
              AND eu.deleted_at IS NULL
        )
        OR empresa_id IN (
            SELECT empresa_id FROM public.empresa_usuarios
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
    );
