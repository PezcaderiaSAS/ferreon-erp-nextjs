-- ============================================================================
-- FERREON ERP - MIGRACIÓN DDL
-- Objetivo: Trigger reactivo para registrar inquilinos y sembrar datos en Onboarding
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_tenant_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa_id uuid;
  v_slug text;
  v_nombre text;
BEGIN
  -- Obtener nombre de empresa desde metadata o fallback a name / email (soporte Google OAuth)
  v_nombre := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'empresa_nombre'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Si el usuario ya está vinculado a alguna empresa, evitar duplicados
  IF EXISTS (SELECT 1 FROM public.empresa_usuarios WHERE user_id = new.id) THEN
    RETURN new;
  END IF;

  -- Generar slug único: limpiar nombre + sufijo pseudoaleatorio corto
  v_slug := lower(regexp_replace(v_nombre, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);
  
  -- 1. Crear Empresa (Tenant) en período de prueba gratuito de 14 días
  INSERT INTO public.empresas (
    nombre, 
    nit, 
    slug, 
    telefono, 
    ciudad, 
    tamano_empresa, 
    autorizado,
    subscription_status,
    trial_ends_at
  ) VALUES (
    v_nombre,
    new.raw_user_meta_data->>'empresa_nit',
    v_slug,
    new.raw_user_meta_data->>'empresa_telefono',
    new.raw_user_meta_data->>'empresa_ciudad',
    new.raw_user_meta_data->>'empresa_tamano',
    false,
    'trialing',
    (now() + interval '14 days')
  ) RETURNING id INTO v_empresa_id;

  -- 2. Vincular usuario como ADMIN de su empresa
  INSERT INTO public.empresa_usuarios (
    empresa_id,
    user_id,
    rol,
    estado,
    es_empresa_activa
  ) VALUES (
    v_empresa_id,
    new.id,
    'ADMIN',
    'ACTIVO',
    true
  );

  -- 3. Aprovisionar Datos Dummy (Onboarding 14 días de prueba)
  BEGIN
    PERFORM public.seed_dummy_tenant_data(v_empresa_id, new.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error seeding dummy data: %', SQLERRM;
  END;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_tenant_registration();
