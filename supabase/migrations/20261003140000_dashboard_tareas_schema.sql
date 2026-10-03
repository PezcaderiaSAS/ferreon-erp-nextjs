-- ==============================================================================
-- MIGRACIÓN: TABLA DE TAREAS OPERATIVAS Y RECORDATORIOS DEL DASHBOARD (MULTI-TENANT)
-- Proyecto: Alquileres System (ferreon-erp-nextjs)
-- Fecha: 2026-10-03
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.dashboard_tareas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    subtexto VARCHAR(255),
    completada BOOLEAN NOT NULL DEFAULT FALSE,
    urgencia VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (urgencia IN ('NORMAL', 'URGENTE')),
    fecha_limite DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Índices de consulta de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_dashboard_tareas_empresa 
    ON public.dashboard_tareas (empresa_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dashboard_tareas_completada 
    ON public.dashboard_tareas (empresa_id, completada) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dashboard_tareas_created_at 
    ON public.dashboard_tareas (empresa_id, created_at DESC) 
    WHERE deleted_at IS NULL;

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.dashboard_tareas ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento multi-tenant estricto
DROP POLICY IF EXISTS "dashboard_tareas_tenant_isolation" ON public.dashboard_tareas;
CREATE POLICY "dashboard_tareas_tenant_isolation" ON public.dashboard_tareas
    FOR ALL
    USING (
        empresa_id = public.get_current_tenant_id()
        OR (auth.jwt() ->> 'role' = 'service_role')
    );
