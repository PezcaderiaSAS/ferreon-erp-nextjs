-- ==============================================================================
-- Migración: 20260924120400_fix_rls_infinite_recursion.sql
-- Descripción: Corrección de recursión infinita en las políticas RLS de empresa_usuarios
--              y empresas reemplazando subconsultas cíclicas por la función
--              SECURITY DEFINER public.is_ultra_admin().
-- ==============================================================================

-- 1. Asegurar función is_ultra_admin() como SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_ultra_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- 2. Corregir política en empresa_usuarios para evitar subconsultas directas a empresa_usuarios
DROP POLICY IF EXISTS ultraadmin_full_access_empresa_usuarios ON public.empresa_usuarios;

CREATE POLICY ultraadmin_full_access_empresa_usuarios ON public.empresa_usuarios
FOR ALL TO authenticated
USING (public.is_ultra_admin())
WITH CHECK (public.is_ultra_admin());

-- 3. Corregir política en empresas para evitar recursión innecesaria
DROP POLICY IF EXISTS ultraadmin_full_access_empresas ON public.empresas;

CREATE POLICY ultraadmin_full_access_empresas ON public.empresas
FOR ALL TO authenticated
USING (public.is_ultra_admin())
WITH CHECK (public.is_ultra_admin());
