-- ========================================================
-- FerreOn ERP - Seed Data Inicial (Catálogo e Items)
-- ========================================================

-- Insertar Items de Prueba en Catálogo
INSERT INTO public.items (nombre, tarifa_diaria, stock_total, stock_disponible, activo) VALUES
('Mezcladora de Concreto 2 Bultos (Gasolina)', 45000.00, 10, 10, true),
('Vibrador de Concreto Eléctrico 2HP', 25000.00, 15, 15, true),
('Demoledor Eléctrico 30Kg (HEX 28mm)', 65000.00, 8, 8, true),
('Andamio Multidireccional (Módulo 1.5m x 2.0m)', 12000.00, 50, 50, true),
('Cortadora de Pavimento / Asfalto (Motor Honda 13HP)', 85000.00, 5, 5, true),
('Planta Eléctrica 6.5 kW (Diésel)', 75000.00, 6, 6, true),
('Bomba de Agua Sumergible 3"', 35000.00, 12, 12, true);
