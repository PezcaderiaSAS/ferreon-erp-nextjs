-- ==============================================================================
-- MIGRACIÓN: INGENIERÍA DE DATOS ANTI-DUPLICIDAD Y CICLO DE VIDA DE USUARIOS
-- Fecha: 2026-09-03
-- ==============================================================================

-- 1. Añadir columnas de estado y soft-delete a empresa_usuarios
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'empresa_usuarios' 
          AND column_name = 'estado'
    ) THEN
        ALTER TABLE public.empresa_usuarios 
        ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' 
        CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'empresa_usuarios' 
          AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.empresa_usuarios 
        ADD COLUMN deleted_at TIMESTAMPTZ NULL;
    END IF;
END $$;

-- 2. Índices Únicos Parciales por Tenant (Prevención de Duplicidad en Activos)
-- 2.1 Clientes por NIT y Empresa
DROP INDEX IF EXISTS public.idx_clientes_empresa_nit;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_empresa_nit 
ON public.clientes (empresa_id, nit_cedula) 
WHERE deleted_at IS NULL;

-- 2.2 Equipos por Código y Empresa
DROP INDEX IF EXISTS public.idx_equipos_empresa_codigo;
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipos_empresa_codigo 
ON public.equipos (empresa_id, codigo) 
WHERE deleted_at IS NULL;

-- 2.3 Alquileres por Consecutivo y Empresa
DROP INDEX IF EXISTS public.idx_alquileres_empresa_consecutivo;
CREATE UNIQUE INDEX IF NOT EXISTS idx_alquileres_empresa_consecutivo 
ON public.alquileres (empresa_id, consecutivo) 
WHERE deleted_at IS NULL;

-- 2.4 Membresías de Usuario Únicas Activas
DROP INDEX IF EXISTS public.idx_empresa_usuarios_activo;
CREATE UNIQUE INDEX IF NOT EXISTS idx_empresa_usuarios_activo 
ON public.empresa_usuarios (empresa_id, user_id) 
WHERE deleted_at IS NULL;

-- 3. Depuración y Saneamiento del Usuario Duplicado
DO $$
DECLARE
    v_typo_user_id UUID;
    v_main_user_id UUID;
BEGIN
    -- Identificar el usuario con error tipográfico (una 'c': onproduciones)
    SELECT id INTO v_typo_user_id FROM auth.users WHERE email = 'onproduciones.bga@gmail.com';
    
    -- Identificar el usuario principal correcto (dos 'c': onproducciones)
    SELECT id INTO v_main_user_id FROM auth.users WHERE email = 'onproducciones.bga@gmail.com';

    -- 3.1 Si existe el usuario principal, asegurar rol SUPERADMIN y estado ACTIVO
    IF v_main_user_id IS NOT NULL THEN
        UPDATE public.empresa_usuarios 
        SET rol = 'SUPERADMIN', estado = 'ACTIVO', deleted_at = NULL 
        WHERE user_id = v_main_user_id;

        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb), 
            '{rol}', 
            '"SUPERADMIN"'::jsonb
        )
        WHERE id = v_main_user_id;
    END IF;

    -- 3.2 Si existe la cuenta con typo, eliminar membresía y usuario
    IF v_typo_user_id IS NOT NULL THEN
        DELETE FROM public.empresa_usuarios WHERE user_id = v_typo_user_id;
        DELETE FROM auth.users WHERE id = v_typo_user_id;
    END IF;
END $$;
