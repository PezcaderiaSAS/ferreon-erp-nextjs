-- ============================================================================
-- Migración: Añadir columnas valor_reposicion, peso y descripcion a public.equipos
-- ============================================================================

ALTER TABLE public.equipos
ADD COLUMN IF NOT EXISTS valor_reposicion NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS peso NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Actualizar comentarios de columnas para autodocumentación
COMMENT ON COLUMN public.equipos.valor_reposicion IS 'Valor comercial en COP para reposición o cobro por daño/pérdida del equipo';
COMMENT ON COLUMN public.equipos.peso IS 'Peso en kilogramos para cálculo logístico y fletes';
COMMENT ON COLUMN public.equipos.descripcion IS 'Descripción técnica y detalles operativos del equipo';

-- Notificar a PostgREST para recargar el Schema Cache inmediatamente
NOTIFY pgrst, 'reload schema';
