-- ==============================================================================
-- MIGRACIÓN: AUDIT LOGS INMUTABLES Y GOBERNANZA ULTRAADMIN MULTI-TENANT
-- Proyecto: FerreOn ERP (alquileres-erp-nextjs)
-- Fecha: 2026-09-08
-- ==============================================================================

-- 1. ACTUALIZAR RESTRICCIÓN DE ROLES PARA ADMITIR ULTRAADMIN
DO $$ 
BEGIN
    ALTER TABLE public.empresa_usuarios DROP CONSTRAINT IF EXISTS empresa_usuarios_rol_check;
    ALTER TABLE public.empresa_usuarios ADD CONSTRAINT empresa_usuarios_rol_check 
        CHECK (rol IN (
            'ULTRAADMIN', 
            'SUPERADMIN', 
            'ADMIN', 
            'OPERADOR_BODEGA', 
            'FACTURACION_CARTERA', 
            'CONSULTOR_AUDITOR', 
            'VENDEDOR'
        ));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo actualizar el check de rol o ya está actualizado: %', SQLERRM;
END $$;

-- 2. FUNCIÓN DE SEGURIDAD ULTRAADMIN (CROSS-TENANT SUPERVISION)
CREATE OR REPLACE FUNCTION public.is_ultra_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.empresa_usuarios
        WHERE user_id = auth.uid()
          AND rol IN ('ULTRAADMIN', 'SUPERADMIN')
          AND estado = 'ACTIVO'
          AND deleted_at IS NULL
    ) OR (
        auth.jwt() -> 'user_metadata' ->> 'rol' IN ('ULTRAADMIN', 'SUPERADMIN')
    ) OR (
        auth.jwt() ->> 'role' = 'service_role'
    );
$$;

-- 3. TABLA DE REGISTRO DE AUDITORÍA INTEGRAL (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usuario_nombre VARCHAR(255) NOT NULL DEFAULT 'Sistema',
    usuario_email VARCHAR(255) NOT NULL DEFAULT 'sistema@ferreon.com',
    usuario_rol VARCHAR(50) NOT NULL DEFAULT 'SISTEMA',
    modulo VARCHAR(50) NOT NULL, -- 'SEGURIDAD', 'BODEGA', 'ALQUILERES', 'DEVOLUCIONES', 'FACTURACION', 'CARTERA', 'CLIENTES', 'CONFIGURACION', 'TENANTS'
    accion VARCHAR(100) NOT NULL, -- 'CREAR_ALQUILER', 'REGISTRAR_PAGO', 'LOGIN', 'LOGOUT', 'FALLO_ACCESO', 'CREAR_EMPRESA', 'CAMBIO_ESTADO_USUARIO', etc.
    entidad_id VARCHAR(100),
    descripcion TEXT NOT NULL,
    detalles JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de alto rendimiento para búsquedas y filtros forenses
CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_fecha ON public.audit_logs (empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modulo_accion ON public.audit_logs (modulo, accion);
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON public.audit_logs (usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- 4. POLÍTICAS ROW LEVEL SECURITY (RLS) EN AUDIT_LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
FOR INSERT WITH CHECK (
    empresa_id = public.get_current_tenant_id()
    OR auth.jwt() ->> 'role' = 'service_role'
    OR public.is_ultra_admin()
    OR empresa_id IS NULL
);

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
FOR SELECT USING (
    -- UltraAdmin y Service Role tienen visibilidad global
    public.is_ultra_admin()
    OR auth.jwt() ->> 'role' = 'service_role'
    -- Administrador de empresa sólo ve los registros de su empresa
    OR (
        empresa_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.empresa_usuarios
            WHERE user_id = auth.uid()
              AND empresa_id = public.audit_logs.empresa_id
              AND rol IN ('ADMIN', 'SUPERADMIN', 'CONSULTOR_AUDITOR')
              AND estado = 'ACTIVO'
              AND deleted_at IS NULL
        )
    )
);

-- 5. EXTENSIÓN DE RLS PARA PERMITIR SUPERVISIÓN ULTRAADMIN EN EMPRESAS Y USUARIOS
DROP POLICY IF EXISTS "empresas_tenant_isolation" ON public.empresas;
CREATE POLICY "empresas_tenant_isolation" ON public.empresas
FOR ALL USING (
    id IN (
        SELECT empresa_id 
        FROM public.empresa_usuarios 
        WHERE user_id = auth.uid() 
          AND estado = 'ACTIVO' 
          AND deleted_at IS NULL
    )
    OR public.is_ultra_admin()
    OR auth.jwt() ->> 'role' = 'service_role'
);

DROP POLICY IF EXISTS "empresa_usuarios_tenant_isolation" ON public.empresa_usuarios;
CREATE POLICY "empresa_usuarios_tenant_isolation" ON public.empresa_usuarios
FOR ALL USING (
    empresa_id = public.get_current_tenant_id()
    OR user_id = auth.uid()
    OR public.is_ultra_admin()
    OR auth.jwt() ->> 'role' = 'service_role'
);
