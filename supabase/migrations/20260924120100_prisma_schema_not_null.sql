-- Asignar los registros huérfanos a la empresa principal (tenant predeterminado) para no perder data.
UPDATE public.alquiler_detalles SET empresa_id = 'ac8719ea-f16a-4538-b308-40d9511a14cb' WHERE empresa_id IS NULL;
UPDATE public.audit_logs SET empresa_id = 'ac8719ea-f16a-4538-b308-40d9511a14cb' WHERE empresa_id IS NULL;
UPDATE public.sesiones_caja SET empresa_id = 'ac8719ea-f16a-4538-b308-40d9511a14cb' WHERE empresa_id IS NULL;
UPDATE public.movimientos_caja SET empresa_id = 'ac8719ea-f16a-4538-b308-40d9511a14cb' WHERE empresa_id IS NULL;

-- Hacer la columna empresa_id obligatoria (NOT NULL) según el Prisma Schema actualizado
ALTER TABLE public.alquiler_detalles ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.sesiones_caja ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.movimientos_caja ALTER COLUMN empresa_id SET NOT NULL;
