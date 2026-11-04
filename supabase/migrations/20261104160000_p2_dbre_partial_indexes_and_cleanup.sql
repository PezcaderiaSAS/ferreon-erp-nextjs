-- ============================================================================
-- MIGRACIÓN CANÓNICA: 20261104160000_p2_dbre_partial_indexes_and_cleanup.sql
-- Módulo: Optimización DBRE e Índices Parciales de Alto Rendimiento (Fase 3 - P2)
-- Proyecto: Alquileres System (FerreOn ERP SaaS)
-- Objetivo:
--   1. Acelerar arqueos de caja mediante índices parciales en pagos y devoluciones.
--   2. Optimizar consultas de trazabilidad en kardex por tenant y fecha descendente.
--   3. Acelerar algoritmos de overbooking y curvas de ocupación en alquiler_detalles.
--   4. Deduplicar índices redundantes para optimizar el throughput de escritura.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ÍNDICES PARCIALES DE ALTA VELOCIDAD
-- ----------------------------------------------------------------------------

-- 1.1 Pagos vinculados a sesión de caja abierta/cerrada
CREATE INDEX IF NOT EXISTS idx_pagos_sesion_caja 
ON public.pagos (sesion_caja_id) 
WHERE sesion_caja_id IS NOT NULL;

-- 1.2 Devoluciones vinculadas a sesión de caja
CREATE INDEX IF NOT EXISTS idx_devoluciones_sesion 
ON public.devoluciones (sesion_caja_id) 
WHERE sesion_caja_id IS NOT NULL;

-- 1.3 Kardex de inventario ordenado cronológicamente por tenant
CREATE INDEX IF NOT EXISTS idx_kardex_empresa_creado 
ON public.kardex_inventario (empresa_id, creado_en DESC);

-- 1.4 Curva de ocupación y cálculo de disponibilidad sin colisiones
CREATE INDEX IF NOT EXISTS idx_alquiler_detalles_curva_ocupacion 
ON public.alquiler_detalles (equipo_id, fecha_inicio, fecha_fin) 
WHERE devuelto = FALSE;

-- 1.5 Búsqueda de facturas pendientes de cobro por cliente
CREATE INDEX IF NOT EXISTS idx_facturas_cartera_pendiente 
ON public.facturas (empresa_id, cliente_id, estado_pago) 
WHERE estado_pago IN ('PENDIENTE', 'PARCIAL', 'VENCIDA');
