-- ============================================================================
-- FERREON ERP - MIGRACIÓN DDL
-- Objetivo: Función y Trigger para Aprovisionamiento de Tenant Multi-Tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_tenant_registration()
RETURNS trigger AS $$
DECLARE
  v_empresa_id uuid;
  v_slug text;
BEGIN
  -- Verificar si trae metadatos de empresa (Sign Up desde el ERP)
  IF new.raw_user_meta_data->>'empresa_nombre' IS NOT NULL THEN
    
    -- Generar slug único: limpiar nombre + sufijo pseudoaleatorio corto
    v_slug := lower(regexp_replace(new.raw_user_meta_data->>'empresa_nombre', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);
    
    -- 1. Crear Empresa (Tenant) bloqueado por defecto
    INSERT INTO public.empresas (
      id,
      nombre, 
      nit, 
      slug, 
      telefono, 
      ciudad, 
      tamano_empresa, 
      autorizado,
      subscription_status
    ) VALUES (
      gen_random_uuid(),
      new.raw_user_meta_data->>'empresa_nombre',
      new.raw_user_meta_data->>'empresa_nit',
      v_slug,
      new.raw_user_meta_data->>'empresa_telefono',
      new.raw_user_meta_data->>'empresa_ciudad',
      new.raw_user_meta_data->>'empresa_tamano',
      false,
      'trialing'
    ) RETURNING id INTO v_empresa_id;

    -- 2. Vincular usuario como ADMIN de su empresa
    INSERT INTO public.empresa_usuarios (
      empresa_id,
      user_id,
      rol,
      es_empresa_activa
    ) VALUES (
      v_empresa_id,
      new.id,
      'ADMIN',
      true
    );

    -- 3. Aprovisionar Datos Dummy (Onboarding PLG)
    PERFORM public.seed_dummy_tenant_data(v_empresa_id, new.id);

  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe para evitar duplicados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el Trigger de Auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant_registration();
