-- =================================================================================
-- SISTEMA DE GESTIÓN AGROPECUARIA - IPCVA
-- Prefix "zampa_" usado para convivir en el mismo proyecto Supabase
-- =================================================================================

-- 1. TABLA MAESTRA: Unidades de Negocio (Tambo, Recría, Quesería, etc.)
CREATE TABLE IF NOT EXISTS zampa_unidades_negocio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA MAESTRA: Cuentas (Efectivo, Banco, Pendiente, etc.)
CREATE TABLE IF NOT EXISTS zampa_cuentas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA MAESTRA: Entidades (Proveedores y Clientes)
CREATE TABLE IF NOT EXISTS zampa_entidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  tipo TEXT CHECK (tipo IN ('PROVEEDOR', 'CLIENTE', 'AMBOS')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA MAESTRA: Rubros
CREATE TABLE IF NOT EXISTS zampa_rubros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA PRINCIPAL: Transacciones (Base de Datos)
CREATE TABLE IF NOT EXISTS zampa_transacciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  
  -- Las relaciones se pueden hacer con texto directo por simplicidad inicial, 
  -- o apuntando a los IDs de las tablas maestras. Por ahora, usamos texto para 
  -- mantener la compatibilidad exacta con el Excel y el código actual.
  prov_cliente TEXT,
  cuenta TEXT,
  ingresos NUMERIC DEFAULT 0,
  egresos NUMERIC DEFAULT 0,
  rubro TEXT,
  subactividad TEXT,
  subrubro_producto TEXT,
  cantidades NUMERIC DEFAULT 0,
  observaciones TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS) opcionalmente
ALTER TABLE zampa_unidades_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE zampa_cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE zampa_entidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE zampa_rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE zampa_transacciones ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso público (Para desarrollo, luego se puede restringir por usuario)
CREATE POLICY "Permitir todo a anon en zampa_unidades_negocio" ON zampa_unidades_negocio FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en zampa_cuentas" ON zampa_cuentas FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en zampa_entidades" ON zampa_entidades FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en zampa_rubros" ON zampa_rubros FOR ALL USING (true);
CREATE POLICY "Permitir todo a anon en zampa_transacciones" ON zampa_transacciones FOR ALL USING (true);

-- Insertar Datos Iniciales (Listas del Curso IPCVA)
INSERT INTO zampa_cuentas (nombre) VALUES ('EFECTIVO'), ('BANCO'), ('PENDIENTE') ON CONFLICT DO NOTHING;
INSERT INTO zampa_unidades_negocio (nombre) VALUES ('TAMBO'), ('RECRIA'), ('QUESERIA'), ('COMUN') ON CONFLICT DO NOTHING;
