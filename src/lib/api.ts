import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Transaction } from '../utils/calculations';

// Map Supabase snake_case columns to our React component's expected fields
export const mapFromSupabase = (row: any): Transaction => ({
  id: row.id,
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
export const mapToSupabase = (tx: Transaction) => {
  // Convert DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD for PG DATE column
  let pgDate = tx.Fecha;
  if (tx.Fecha && tx.Fecha.includes('/')) {
    const [day, month, year] = tx.Fecha.split('/');
    pgDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return {
    fecha: pgDate,
    prov_cliente: tx['Prov/Cliente'] || null,
    cuenta: tx.Cuenta || null,
    ingresos: Number(tx.Ingresos) || 0,
    egresos: Number(tx.Egresos) || 0,
    rubro: tx.Rubro || null,
    subactividad: tx.Subactividad || null,
    subrubro_producto: tx['Subrubro/Producto'] || null,
    pecorino: Number(tx.Pecorino) || 0,
    manchego: Number(tx.Manchego) || 0,
    saborizado: Number(tx.Saborizado) || 0,
    ahumado: Number(tx.Ahumado) || 0,
    provoleta: Number(tx.Provoleta) || 0,
    ricota: Number(tx.Ricota) || 0,
    cantidades: Number(tx.Cantidades) || 0,
    observaciones: tx.Observaciones || null,
  };
};

export const useSupabaseTransactions = () => {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
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
    const payload = mapToSupabase(newTx);
    const { data: inserted, error } = await supabase
      .from('zampa_transacciones')
      .insert(payload)
      .select();

    if (error) {
      console.error('Error insertando en Supabase:', error);
      alert('Error al guardar en Supabase: ' + error.message);
      return false;
    } else if (inserted && inserted[0]) {
      const mapped = mapFromSupabase(inserted[0]);
      setData(prev => [...prev, mapped]);
      return true;
    }
    return false;
  };

  // Update existing transaction
  const updateTransaction = async (id: string, updatedTx: Transaction) => {
    const payload = mapToSupabase(updatedTx);
    const { data: updatedRows, error } = await supabase
      .from('zampa_transacciones')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error actualizando transacción:', error);
      alert('Error al actualizar en Supabase: ' + error.message);
      return false;
    } else if (updatedRows && updatedRows[0]) {
      const mapped = mapFromSupabase(updatedRows[0]);
      setData(prev => prev.map(t => t.id === id ? mapped : t));
      return true;
    }
    return false;
  };

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('zampa_transacciones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando transacción:', error);
      alert('Error al eliminar en Supabase: ' + error.message);
      return false;
    } else {
      setData(prev => prev.filter(t => t.id !== id));
      return true;
    }
  };

  return { 
    data, 
    loading, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    refreshData: fetchData 
  };
};
