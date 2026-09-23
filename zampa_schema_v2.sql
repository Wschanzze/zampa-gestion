-- Actualización del esquema: agregar columnas de quesos faltantes
ALTER TABLE zampa_transacciones
ADD COLUMN pecorino NUMERIC DEFAULT 0,
ADD COLUMN manchego NUMERIC DEFAULT 0,
ADD COLUMN saborizado NUMERIC DEFAULT 0,
ADD COLUMN ahumado NUMERIC DEFAULT 0,
ADD COLUMN provoleta NUMERIC DEFAULT 0,
ADD COLUMN ricota NUMERIC DEFAULT 0;
