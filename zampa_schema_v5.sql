-- Migration: Create zampa_produccion_quesos table
-- Description: Stores cheese production batches and calculates yield.

CREATE TABLE IF NOT EXISTS public.zampa_produccion_quesos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_elaboracion DATE NOT NULL,
    lote TEXT NOT NULL,
    litros_leche NUMERIC NOT NULL CHECK (litros_leche >= 0),
    producto TEXT NOT NULL,
    tipo_queso TEXT,
    kg_totales NUMERIC NOT NULL CHECK (kg_totales >= 0),
    cantidad_grande INTEGER DEFAULT 0,
    cantidad_barra INTEGER DEFAULT 0,
    cantidad_tubo INTEGER DEFAULT 0,
    cantidad_chico INTEGER DEFAULT 0,
    cantidad_otro INTEGER DEFAULT 0,
    cantidad_camambert INTEGER DEFAULT 0,
    cantidad_ricota INTEGER DEFAULT 0,
    rendimiento NUMERIC GENERATED ALWAYS AS (kg_totales / NULLIF(litros_leche, 0) * 100) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.zampa_produccion_quesos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (CRUD para usuarios autenticados)
CREATE POLICY "Enable read access for all users" ON public.zampa_produccion_quesos FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.zampa_produccion_quesos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.zampa_produccion_quesos FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.zampa_produccion_quesos FOR DELETE USING (auth.role() = 'authenticated');
