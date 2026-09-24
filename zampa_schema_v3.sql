-- =================================================================================
-- TABLA DE STOCK DISPONIBLE EN CÁMARA (QUESERÍA)
-- =================================================================================

CREATE TABLE IF NOT EXISTS zampa_stock_queseria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variedad TEXT NOT NULL UNIQUE,
  stock_kg NUMERIC DEFAULT 0,
  lote_detalle TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE zampa_stock_queseria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a anon en zampa_stock_queseria" ON zampa_stock_queseria FOR ALL USING (true);

-- Datos iniciales de stock en cámara
INSERT INTO zampa_stock_queseria (variedad, stock_kg, lote_detalle) VALUES
  ('Pecorino', 140.00, 'Lote maduración 90 días'),
  ('Manchego', 210.00, 'Lote maduración 60 días'),
  ('Saborizado', 75.00, 'Hierbas y pimienta'),
  ('Ahumado', 55.00, 'Madera de espinillo'),
  ('Provoleta', 90.00, 'Envasado al vacío'),
  ('Ricota', 35.00, 'Fresco')
ON CONFLICT (variedad) DO UPDATE SET 
  stock_kg = EXCLUDED.stock_kg,
  lote_detalle = EXCLUDED.lote_detalle,
  updated_at = now();
