-- =================================================================================
-- TABLA DE SUBRUBROS
-- =================================================================================

CREATE TABLE IF NOT EXISTS zampa_subrubros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  rubro_id UUID REFERENCES zampa_rubros(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE zampa_subrubros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a anon en zampa_subrubros" ON zampa_subrubros FOR ALL USING (true);

-- Insertar algunos subrubros de ejemplo si no existen
INSERT INTO zampa_subrubros (nombre) VALUES 
  ('Balanceado Lechera'), 
  ('Cuajo'), 
  ('Vacuna'),
  ('Lactómetros')
ON CONFLICT DO NOTHING;
