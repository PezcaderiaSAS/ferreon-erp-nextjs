-- Migración: Blindaje de Concurrencia de Sesiones de Caja (CAJA-001)
-- Fecha: 2026-09-29
-- Proyecto: Alquileres System (FerreOn ERP & WMS)
-- Objetivo: Prevenir que un mismo cajero/usuario abra más de una sesión de caja simultánea en estado ABIERTA
--           mediante un índice único condicional a nivel de motor PostgreSQL.

CREATE UNIQUE INDEX IF NOT EXISTS idx_sesion_activa_usuario_unica 
ON public.sesiones_caja (usuario_id) 
WHERE estado = 'ABIERTA';

COMMENT ON INDEX public.idx_sesion_activa_usuario_unica IS 
'Garantiza que un usuario solo pueda tener un registro con estado ABIERTA a la vez en sesiones_caja (Poka-Yoke físico en BD).';
