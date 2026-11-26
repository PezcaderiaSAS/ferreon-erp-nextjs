-- ============================================================================
-- MIGRACIÓN: Trazabilidad de Activos de Terceros en Subcontrataciones (TICKET SUB-002)
-- Agrega campos serial_tercero y marca a subcontratacion_detalles
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'subcontratacion_detalles' 
          AND column_name = 'serial_tercero'
    ) THEN
        ALTER TABLE public.subcontratacion_detalles ADD COLUMN serial_tercero VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'subcontratacion_detalles' 
          AND column_name = 'marca'
    ) THEN
        ALTER TABLE public.subcontratacion_detalles ADD COLUMN marca VARCHAR(100);
    END IF;
END $$;
