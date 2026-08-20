-- ========================================================
-- FerreOn ERP - Drop peso from equipos
-- ========================================================

-- La regla de negocio estricta dictamina que el peso pertenece a alquileres_detalle, no a equipos genéricos.
ALTER TABLE public.equipos DROP COLUMN IF EXISTS peso_gramos;
