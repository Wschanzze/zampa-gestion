import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Transaction } from '../utils/calculations';

// Map Supabase snake_case columns to our React component's expected fields
const mapFromSupabase = (row: any): Transaction => ({
  Fecha: new Date(row.fecha + 'T12:00:00Z').toLocaleDateString('es-AR'), // Prevent timezone shift
  'Prov/Cliente': row.prov_cliente,
  Cuenta: row.cuenta,
  Ingresos: row.ingresos,
  Egresos: row.egresos,
  Rubro: row.rubro,
  Subactividad: row.subactividad,
  'Subrubro/Producto': row.subrubro_producto,
  Pecorino: row.pecorino,
  Manchego: row.manchego,
  Saborizado: row.saborizado,
  Ahumado: row.ahumado,
  Provoleta: row.provoleta,
  Ricota: row.ricota,
  Cantidades: row.cantidades,
  Observaciones: row.observaciones,
});

// Map React fields to Supabase snake_case columns
const mapToSupabase = (tx: Transaction) => {
  // Convert DD/MM/YYYY to YYYY-MM-DD for PG DATE column
  const [day, month, year] = tx.Fecha.split('/');
  const pgDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  return {
    fecha: pgDate,
    prov_cliente: tx['Prov/Cliente'] || null,
    cuenta: tx.Cuenta || null,
    ingresos: tx.Ingresos || 0,
    egresos: tx.Egresos || 0,
    rubro: tx.Rubro || null,
    subactividad: tx.Subactividad || null,
    subrubro_producto: tx['Subrubro/Producto'] || null,
    pecorino: tx.Pecorino || 0,
    manchego: tx.Manchego || 0,
    saborizado: tx.Saborizado || 0,
    ahumado: tx.Ahumado || 0,
    provoleta: tx.Provoleta || 0,
    ricota: tx.Ricota || 0,
    cantidades: tx.Cantidades || 0,
    observaciones: tx.Observaciones || null,
  };
};

export const useSupabaseTransactions = () => {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('zampa_transacciones')
      .select('*')
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error);
    } else if (rows) {
      setData(rows.map(mapFromSupabase));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add new transaction
  const addTransaction = async (newTx: Transaction) => {
    // Optimistic update
    setData(prev => [...prev, newTx]);

    const { error } = await supabase
      .from('zampa_transacciones')
      .insert(mapToSupabase(newTx));

    if (error) {
      console.error('Error insertando en Supabase:', error);
      // Opcional: revertir optimistic update o mostrar alerta
      fetchData(); // recargar
    }
  };

  return { data, loading, addTransaction };
};
