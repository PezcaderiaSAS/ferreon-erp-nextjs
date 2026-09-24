-- 1. Crear el Auth Hook para inyectar 'empresa_id' en el JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  user_empresa_id uuid;
BEGIN
  -- Consultar la empresa del usuario
  SELECT empresa_id INTO user_empresa_id 
  FROM public.empresa_usuarios 
  WHERE user_id = (event->>'user_id')::uuid LIMIT 1;
  
  claims := event->'claims';
  
  -- Inyectar el ID de la empresa en app_metadata
  IF user_empresa_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata, empresa_id}', to_jsonb(user_empresa_id));
  END IF;
  
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- 2. Otorgar permisos al administrador de autenticación
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- 3. Activar y Aplicar RLS a todas las tablas usando el nuevo JWT claim

DO $$ BEGIN

  -- clientes
  ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "aislamiento_tenant_clientes" ON public.clientes;
  CREATE POLICY "aislamiento_tenant_clientes" ON public.clientes
    FOR ALL USING (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid)
    WITH CHECK (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid);

  -- equipos
  ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "aislamiento_tenant_equipos" ON public.equipos;
  CREATE POLICY "aislamiento_tenant_equipos" ON public.equipos
    FOR ALL USING (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid)
    WITH CHECK (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid);

  -- alquileres
  ALTER TABLE public.alquileres ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "aislamiento_tenant_alquileres" ON public.alquileres;
  CREATE POLICY "aislamiento_tenant_alquileres" ON public.alquileres
    FOR ALL USING (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid)
    WITH CHECK (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid);

  -- alquiler_detalles
  ALTER TABLE public.alquiler_detalles ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "aislamiento_tenant_alquiler_detalles" ON public.alquiler_detalles;
  CREATE POLICY "aislamiento_tenant_alquiler_detalles" ON public.alquiler_detalles
    FOR ALL USING (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid)
    WITH CHECK (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid);

  -- facturas
  ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "aislamiento_tenant_facturas" ON public.facturas;
  CREATE POLICY "aislamiento_tenant_facturas" ON public.facturas
    FOR ALL USING (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid)
    WITH CHECK (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid);

  -- kardex_inventario
  ALTER TABLE public.kardex_inventario ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "aislamiento_tenant_kardex" ON public.kardex_inventario;
  CREATE POLICY "aislamiento_tenant_kardex" ON public.kardex_inventario
    FOR ALL USING (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid)
    WITH CHECK (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid);

  -- sesiones_caja
  ALTER TABLE public.sesiones_caja ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "aislamiento_tenant_caja" ON public.sesiones_caja;
  CREATE POLICY "aislamiento_tenant_caja" ON public.sesiones_caja
    FOR ALL USING (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid)
    WITH CHECK (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid);

  -- audit_logs
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "aislamiento_tenant_audit" ON public.audit_logs;
  CREATE POLICY "aislamiento_tenant_audit" ON public.audit_logs
    FOR ALL USING (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid)
    WITH CHECK (empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid);

END $$;
