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

  // Register partial/total payment for Cuentas Corrientes
  const registerPayment = async (payment: {
    entity: string;
    amount: number;
    type: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR';
    account: string;
    date: string;
    subactividad?: string;
    notes?: string;
  }) => {
    let pgDate = payment.date;
    if (payment.date.includes('/')) {
      const [d, m, y] = payment.date.split('/');
      pgDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    const isCobro = payment.type === 'COBRO_CLIENTE';
    const subactividad = payment.subactividad || (isCobro ? 'QUESERIA' : 'TAMBO');

    // 1. Real movement in chosen financial account (BANCO, EFECTIVO)
    const realMovement = {
      fecha: pgDate,
      prov_cliente: payment.entity,
      cuenta: payment.account,
      ingresos: isCobro ? payment.amount : 0,
      egresos: isCobro ? 0 : payment.amount,
      rubro: isCobro ? 'COBRO CUENTA CORRIENTE' : 'PAGO PROVEEDOR',
      subactividad: subactividad,
      subrubro_producto: null,
      pecorino: 0,
      manchego: 0,
      saborizado: 0,
      ahumado: 0,
      provoleta: 0,
      ricota: 0,
      cantidades: 0,
      observaciones: payment.notes || (isCobro ? 'Cobro parcial a cuenta' : 'Pago parcial a proveedor')
    };

    // 2. Offsetting entry in PENDIENTE to reduce outstanding debt
    const pendingOffset = {
      fecha: pgDate,
      prov_cliente: payment.entity,
      cuenta: 'PENDIENTE',
      ingresos: isCobro ? 0 : payment.amount,
      egresos: isCobro ? payment.amount : 0,
      rubro: isCobro ? 'COBRO CUENTA CORRIENTE' : 'PAGO PROVEEDOR',
      subactividad: subactividad,
      subrubro_producto: null,
      pecorino: 0,
      manchego: 0,
      saborizado: 0,
      ahumado: 0,
      provoleta: 0,
      ricota: 0,
      cantidades: 0,
      observaciones: `Aplicación de pago: ${payment.notes || (isCobro ? 'Cobro parcial' : 'Pago parcial')} (${payment.account})`
    };

    const { data: insertedRows, error } = await supabase
      .from('zampa_transacciones')
      .insert([realMovement, pendingOffset])
      .select();

    if (error) {
      console.error('Error registrando pago en Supabase:', error);
      alert('Error registrando pago: ' + error.message);
      return false;
    } else if (insertedRows) {
      const mapped = insertedRows.map(mapFromSupabase);
      setData(prev => [...prev, ...mapped]);
      return true;
    }
    return false;
  };

  return { 
    data, 
    loading, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    registerPayment,
    refreshData: fetchData 
  };
};

export interface CheeseStock {
  id?: string;
  variedad: string;
  stock_kg: number;
  lote_detalle?: string;
  updated_at?: string;
}

export const useListas = () => {
  const [entidades, setEntidades] = useState<any[]>([]);
  const [rubros, setRubros] = useState<any[]>([]);
  const [subrubros, setSubrubros] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const [
        { data: eData },
        { data: rData },
        { data: sData },
        { data: cData },
        { data: uData }
      ] = await Promise.all([
        supabase.from('zampa_entidades').select('*').order('nombre'),
        supabase.from('zampa_rubros').select('*').order('nombre'),
        supabase.from('zampa_subrubros').select('*').order('nombre'),
        supabase.from('zampa_cuentas').select('*').order('nombre'),
        supabase.from('zampa_unidades_negocio').select('*').order('nombre')
      ]);

      setEntidades(eData || []);
      setRubros(rData || []);
      setSubrubros(sData || []);
      setCuentas(cData || []);
      setUnidades(uData || []);
    } catch (err) {
      console.error('Error fetching lists', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const addEntity = async (table: string, payload: any) => {
    const { data, error } = await supabase.from(table).insert(payload).select();
    if (error) {
      alert('Error agregando item: ' + error.message);
      return null;
    }
    fetchLists(); // reload lists
    return data?.[0];
  };

  const updateEntity = async (table: string, id: string, payload: any) => {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
    if (error) {
      alert('Error actualizando item: ' + error.message);
      return null;
    }
    fetchLists();
    return data?.[0];
  };

  const deleteEntity = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert('Error eliminando item: ' + error.message);
      return false;
    }
    fetchLists();
    return true;
  };

  return {
    entidades, rubros, subrubros, cuentas, unidades, loading, fetchLists, addEntity, updateEntity, deleteEntity
  };
};

export const useQueseriaStock = () => {
  const [stockList, setStockList] = useState<CheeseStock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('zampa_stock_queseria')
      .select('*')
      .order('variedad');

    if (!error && rows && rows.length > 0) {
      setStockList(rows);
      localStorage.setItem('zampa_stock_camara', JSON.stringify(rows));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const updateStock = async (variedad: string, stock_kg: number, lote_detalle?: string) => {
    const updated = stockList.map(s => 
      s.variedad.toLowerCase() === variedad.toLowerCase() 
        ? { ...s, stock_kg, lote_detalle: lote_detalle !== undefined ? lote_detalle : s.lote_detalle, updated_at: new Date().toISOString() } 
        : s
    );
    setStockList(updated);
    localStorage.setItem('zampa_stock_camara', JSON.stringify(updated));

    try {
      await supabase
        .from('zampa_stock_queseria')
        .upsert({ variedad, stock_kg, lote_detalle, updated_at: new Date().toISOString() }, { onConflict: 'variedad' });
    } catch (err) {
      console.warn('Could not sync stock to Supabase table:', err);
    }
  };

  return { stockList, loading, updateStock, refreshStock: fetchStock };
};

export interface ProduccionRecord {
  id?: string;
  fecha_elaboracion: string;
  lote: string;
  litros_leche: number;
  producto: string;
  tipo_queso: string | null;
  kg_totales: number;
  cantidad_grande: number;
  cantidad_barra: number;
  cantidad_tubo: number;
  cantidad_chico: number;
  cantidad_otro: number;
  cantidad_camambert: number;
  cantidad_ricota: number;
  rendimiento?: number;
  created_at?: string;
}

export const useProduccion = () => {
  const [data, setData] = useState<ProduccionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('zampa_produccion_quesos')
      .select('*')
      .order('fecha_elaboracion', { ascending: false });

    if (error) {
      console.error('Error fetching produccion:', error);
    } else if (rows) {
      setData(rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addRecord = async (record: Omit<ProduccionRecord, 'id' | 'rendimiento' | 'created_at'>) => {
    const { data: inserted, error } = await supabase
      .from('zampa_produccion_quesos')
      .insert([record])
      .select();

    if (error) {
      console.error('Error insertando produccion:', error);
      alert('Error al guardar: ' + error.message);
      return false;
    } else if (inserted && inserted[0]) {
      setData(prev => [inserted[0], ...prev]);
      return true;
    }
    return false;
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase
      .from('zampa_produccion_quesos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando produccion:', error);
      alert('Error al eliminar: ' + error.message);
      return false;
    } else {
      setData(prev => prev.filter(r => r.id !== id));
      return true;
    }
  };

  return { data, loading, addRecord, deleteRecord, refreshData: fetchData };
};
