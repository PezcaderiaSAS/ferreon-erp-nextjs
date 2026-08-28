-- Paso 1: Habilitar la extensión de programación de tareas en Supabase (requiere permisos de superusuario o activación desde el dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Paso 2: Crear tabla de Idempotencia para evitar "dobles clics" y Race Conditions
CREATE TABLE IF NOT EXISTS idempotency_logs (
    idempotency_key UUID PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) para proteger la tabla según mejores prácticas (Ground Truth)
ALTER TABLE idempotency_logs ENABLE ROW LEVEL SECURITY;

-- Permitir a usuarios autenticados insertar registros (Next.js Server Actions usando cookies)
CREATE POLICY "Permitir inserts a usuarios autenticados"
ON idempotency_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Opcionalmente, evitar que alguien lea las llaves (solo insertan)
CREATE POLICY "Permitir lectura a service_role (Admin)"
ON idempotency_logs FOR SELECT
TO service_role
USING (true);

-- Paso 3: Crear el Job Automático (Garbage Collection) para limpiar las llaves después de 7 días
-- Ejecuta todos los días a las 00:00.
SELECT cron.schedule(
    'limpiar_idempotency_logs',
    '0 0 * * *',
    $$ DELETE FROM idempotency_logs WHERE created_at < NOW() - INTERVAL '7 days'; $$
);

-- Paso 4: Crear la Función RPC Atómica para Ajuste de Stock
-- Reemplazaremos la consulta UPDATE estática en Next.js por este procedimiento almacenado.
CREATE OR REPLACE FUNCTION ajustar_stock_equipo(p_equipo_id BIGINT, p_delta INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_actual INTEGER;
    v_stock_nuevo INTEGER;
    v_equipo_result JSONB;
BEGIN
    -- Bloquear la fila para escritura (Row-level Lock) garantizando atomicidad real
    SELECT stock_disponible INTO v_stock_actual
    FROM equipos
    WHERE id = p_equipo_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Equipo no encontrado (ID: %)', p_equipo_id;
    END IF;

    -- Calcular el nuevo stock
    v_stock_nuevo := v_stock_actual + p_delta;

    -- Prevenir inventarios negativos (Regla de Negocio)
    IF v_stock_nuevo < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente. El stock actual es %, y se intentó restar %.', v_stock_actual, ABS(p_delta);
    END IF;

    -- Aplicar el incremento atómico
    UPDATE equipos
    SET stock_disponible = v_stock_nuevo,
        -- stock_total asume que el en_obra y mantenimiento se conservan (total = disponible + en_obra + mantenimiento)
        stock_total = v_stock_nuevo + COALESCE(stock_en_obra, 0) + COALESCE(stock_mantenimiento, 0)
    WHERE id = p_equipo_id;

    -- Retornar el registro actualizado en formato JSON para Next.js
    SELECT row_to_json(e)::jsonb INTO v_equipo_result
    FROM equipos e
    WHERE id = p_equipo_id;

    RETURN v_equipo_result;
END;
$$;
