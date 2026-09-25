import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction } from '../utils/calculations';
import { useListas } from '../lib/api';
import ComboboxSelect from './ComboboxSelect';
// @ts-ignore
import { X, Sparkles, Calculator } from 'lucide-react';

interface Props {
  onAdd?: (tx: Transaction) => Promise<boolean | void> | void;
  onUpdate?: (id: string, tx: Transaction) => Promise<boolean | void> | void;
  initialData?: Transaction | null;
  existingData?: Transaction[];
  onClose: () => void;
}

const TransactionForm: React.FC<Props> = ({ 
  onAdd, 
  onUpdate, 
  initialData, 
  existingData = [], 
  onClose 
}) => {
  const isEditing = !!initialData?.id;

  const [tipoMovimiento, setTipoMovimiento] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [formData, setFormData] = useState<Partial<Transaction>>({
    Fecha: new Date().toLocaleDateString('es-AR'),
    Subactividad: 'TAMBO',
    Cuenta: 'BANCO',
    Ingresos: 0,
    Egresos: 0,
    Cantidades: 0,
    Pecorino: 0,
    Manchego: 0,
    Saborizado: 0,
    Ahumado: 0,
    Provoleta: 0,
    Ricota: 0,
  });

  const { entidades, rubros, subrubros, cuentas, unidades } = useListas();

  // Autocomplete options derived dynamically from existing database + Listas
  const autocompleteLists = useMemo(() => {
    const provs = new Set<string>(entidades.map(e => e.nombre?.trim()).filter(Boolean));
    const rubs = new Set<string>(rubros.map(r => r.nombre?.trim()).filter(Boolean));
    const subrubs = new Set<string>(subrubros.map(s => s.nombre?.trim()).filter(Boolean));
    const cuents = new Set<string>(cuentas.map(c => c.nombre?.trim()).filter(Boolean));
    const unids = new Set<string>(unidades.map(u => u.nombre?.trim()).filter(Boolean));

    // Fallbacks if database lists are empty or loading
    if (cuents.size === 0) {
      cuents.add('BANCO');
      cuents.add('EFECTIVO');
      cuents.add('PENDIENTE');
    }
    if (unids.size === 0) {
      ['TAMBO', 'RECRÍA', 'QUESERÍA', 'COMÚN'].forEach(u => unids.add(u));
    }

    // Also include existing data just in case there are legacy items
    existingData.forEach(item => {
      if (item['Prov/Cliente']) provs.add(item['Prov/Cliente'].trim());
      if (item.Rubro) rubs.add(item.Rubro.trim());
      if (item['Subrubro/Producto']) subrubs.add(item['Subrubro/Producto'].trim());
      if (item.Cuenta) cuents.add(item.Cuenta.trim());
      if (item.Subactividad) unids.add(item.Subactividad.trim());
    });

    const sortFn = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });

    return {
      proveedores: Array.from(provs).sort(sortFn),
      rubros: Array.from(rubs).sort(sortFn),
      subrubros: Array.from(subrubs).sort(sortFn),
      cuentas: Array.from(cuents).sort(sortFn),
      unidades: Array.from(unids).sort(sortFn),
    };
  }, [existingData, entidades, rubros, subrubros, cuentas, unidades]);

  // Load initialData when in Edit mode
  useEffect(() => {
    if (initialData) {
      const isIngreso = Number(initialData.Ingresos) > 0 || (Number(initialData.Egresos) === 0 && initialData.Rubro?.toUpperCase().includes('VENTA'));
      setTipoMovimiento(isIngreso ? 'INGRESO' : 'EGRESO');
      setFormData({
        ...initialData,
        Ingresos: Number(initialData.Ingresos) || 0,
        Egresos: Number(initialData.Egresos) || 0,
        Cantidades: Number(initialData.Cantidades) || 0,
        Pecorino: Number(initialData.Pecorino) || 0,
        Manchego: Number(initialData.Manchego) || 0,
        Saborizado: Number(initialData.Saborizado) || 0,
        Ahumado: Number(initialData.Ahumado) || 0,
        Provoleta: Number(initialData.Provoleta) || 0,
        Ricota: Number(initialData.Ricota) || 0,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const cheeseFields = ['Pecorino', 'Manchego', 'Saborizado', 'Ahumado', 'Provoleta', 'Ricota'];

    if (cheeseFields.includes(name)) {
      const updated = { ...formData, [name]: value };
      const p = Number(name === 'Pecorino' ? value : updated.Pecorino) || 0;
      const m = Number(name === 'Manchego' ? value : updated.Manchego) || 0;
      const s = Number(name === 'Saborizado' ? value : updated.Saborizado) || 0;
      const a = Number(name === 'Ahumado' ? value : updated.Ahumado) || 0;
      const pr = Number(name === 'Provoleta' ? value : updated.Provoleta) || 0;
      const r = Number(name === 'Ricota' ? value : updated.Ricota) || 0;
      const totalCheese = parseFloat((p + m + s + a + pr + r).toFixed(2));

      setFormData({
        ...updated,
        Cantidades: totalCheese > 0 ? totalCheese : updated.Cantidades
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    if (tipoMovimiento === 'INGRESO') {
      setFormData(prev => ({ ...prev, Ingresos: val, Egresos: 0 }));
    } else {
      setFormData(prev => ({ ...prev, Egresos: val, Ingresos: 0 }));
    }
  };

  // Calculate total cheese weight
  const totalKgQuesos = useMemo(() => {
    const p = Number(formData.Pecorino) || 0;
    const m = Number(formData.Manchego) || 0;
    const s = Number(formData.Saborizado) || 0;
    const a = Number(formData.Ahumado) || 0;
    const pr = Number(formData.Provoleta) || 0;
    const r = Number(formData.Ricota) || 0;
    return parseFloat((p + m + s + a + pr + r).toFixed(2));
  }, [formData.Pecorino, formData.Manchego, formData.Saborizado, formData.Ahumado, formData.Provoleta, formData.Ricota]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Fecha) {
      alert('Por favor especifica una fecha');
      return;
    }

    const p = Number(formData.Pecorino) || 0;
    const m = Number(formData.Manchego) || 0;
    const s = Number(formData.Saborizado) || 0;
    const a = Number(formData.Ahumado) || 0;
    const pr = Number(formData.Provoleta) || 0;
    const r = Number(formData.Ricota) || 0;
    const calculatedCheeseTotal = parseFloat((p + m + s + a + pr + r).toFixed(2));

    const finalCantidades = calculatedCheeseTotal > 0 
      ? calculatedCheeseTotal 
      : (Number(formData.Cantidades) || 0);

    const finalData: Transaction = {
      ...formData,
      Fecha: formData.Fecha,
      Ingresos: tipoMovimiento === 'INGRESO' ? (Number(formData.Ingresos) || 0) : 0,
      Egresos: tipoMovimiento === 'EGRESO' ? (Number(formData.Egresos) || 0) : 0,
      Cantidades: finalCantidades,
      Pecorino: p,
      Manchego: m,
      Saborizado: s,
      Ahumado: a,
      Provoleta: pr,
      Ricota: r,
    };

    if (isEditing && initialData?.id && onUpdate) {
      await onUpdate(initialData.id, finalData);
    } else if (onAdd) {
      await onAdd(finalData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#faf9f6] rounded-2xl border border-[#e0d6c8] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e0d6c8] flex justify-between items-center bg-[#f4ebd8]/70 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#3e3a35]">
              {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
            </h3>
            <p className="text-xs text-[#6b645c] mt-0.5">
              {isEditing ? 'Modifica los campos del movimiento y guarda los cambios' : 'Registra ingresos, egresos y producción en la base de datos'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-[#6b645c] hover:text-[#3e3a35] hover:bg-[#e0d6c8]/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            
            {/* Tipo de Movimiento Selector */}
          <div className="flex p-1 bg-[#eae0cd]/60 rounded-xl max-w-sm border border-[#e0d6c8]">
            <button
              type="button"
              onClick={() => {
                setTipoMovimiento('INGRESO');
                setFormData(prev => ({ ...prev, Ingresos: prev.Egresos || prev.Ingresos, Egresos: 0 }));
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tipoMovimiento === 'INGRESO'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#5c544d] hover:text-[#2d2a26]'
              }`}
            >
              ▲ Ingreso / Venta
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoMovimiento('EGRESO');
                setFormData(prev => ({ ...prev, Egresos: prev.Ingresos || prev.Egresos, Ingresos: 0 }));
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tipoMovimiento === 'EGRESO'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[#5c544d] hover:text-[#2d2a26]'
              }`}
            >
              ▼ Egreso / Gasto
            </button>
          </div>

          {/* Grid de campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">
                Fecha (D/M/AAAA) <span className="text-rose-600">*</span>
              </label>
              <input 
                required 
                type="text" 
                name="Fecha" 
                placeholder="22/9/2026" 
                value={formData.Fecha || ''} 
                onChange={handleChange} 
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2.5 text-base md:text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-medium" 
              />
            </div>

            {/* Proveedor / Cliente con ComboboxSelect */}
            <ComboboxSelect
              label="Proveedor / Cliente"
              name="Prov/Cliente"
              placeholder="Selecciona o escribe..."
              value={formData['Prov/Cliente'] || ''}
              onChange={(val) => setFormData(prev => ({ ...prev, 'Prov/Cliente': val }))}
              options={autocompleteLists.proveedores}
            />

            {/* Cuenta */}
            <ComboboxSelect
              label="Cuenta"
              name="Cuenta"
              placeholder="Selecciona cuenta..."
              value={formData.Cuenta || ''}
              onChange={(val) => setFormData(prev => ({ ...prev, Cuenta: val }))}
              options={autocompleteLists.cuentas}
            />

            {/* Unidad de Negocio */}
            <ComboboxSelect
              label="Unidad de Negocio"
              name="Subactividad"
              placeholder="Selecciona unidad..."
              value={formData.Subactividad || ''}
              onChange={(val) => setFormData(prev => ({ ...prev, Subactividad: val }))}
              options={autocompleteLists.unidades}
            />

            {/* Rubro */}
            <ComboboxSelect
              label="Rubro"
              name="Rubro"
              placeholder="Ej. VENTA QUESO, ALIMENTACION"
              value={formData.Rubro || ''}
              onChange={(val) => setFormData(prev => ({ ...prev, Rubro: val }))}
              options={autocompleteLists.rubros}
            />

            {/* Subrubro / Producto */}
            <ComboboxSelect
              label="Subrubro / Producto"
              name="Subrubro/Producto"
              placeholder="Ej. Cuajo, Balanceado..."
              value={formData['Subrubro/Producto'] || ''}
              onChange={(val) => setFormData(prev => ({ ...prev, 'Subrubro/Producto': val }))}
              options={autocompleteLists.subrubros}
            />

            {/* Monto */}
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">
                {tipoMovimiento === 'INGRESO' ? 'Monto Ingreso ($)' : 'Monto Egreso ($)'}
              </label>
              <input 
                type="number" 
                step="0.01" 
                inputMode="decimal"
                placeholder="0.00"
                value={(tipoMovimiento === 'INGRESO' ? formData.Ingresos : formData.Egresos) || ''} 
                onChange={handleMontoChange} 
                className={`w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2.5 text-base md:text-sm font-bold outline-none focus:ring-1 ${
                  tipoMovimiento === 'INGRESO' ? 'text-emerald-700 focus:ring-emerald-500' : 'text-rose-700 focus:ring-rose-500'
                }`} 
              />
            </div>

            {/* Cantidades generales */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-[#6b645c]">
                  Cantidades Totales {totalKgQuesos > 0 ? '(Kg Quesos)' : ''}
                </label>
                {totalKgQuesos > 0 && (
                  <span className="text-[10px] text-amber-900 font-bold bg-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Calculator size={10} /> Suma auto: {totalKgQuesos} kg
                  </span>
                )}
              </div>
              <input 
                type="number" 
                step="0.01" 
                inputMode="decimal"
                name="Cantidades" 
                placeholder="0.00"
                value={formData.Cantidades || ''} 
                onChange={handleChange} 
                className={`w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2.5 text-base md:text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none font-bold ${
                  totalKgQuesos > 0 ? 'bg-amber-50/40 border-amber-300 text-amber-950' : ''
                }`} 
              />
            </div>
          </div>

          {/* Sección de Quesos (Kg) */}
          <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-amber-800" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Detalle de Quesos (Kilogramos)
                </h4>
              </div>
              {totalKgQuesos > 0 && (
                <span className="text-xs font-bold bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full">
                  Total Quesos: {totalKgQuesos} kg
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Pecorino (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  inputMode="decimal"
                  name="Pecorino" 
                  placeholder="0.00"
                  value={formData.Pecorino || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-2 text-base md:text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Manchego (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  inputMode="decimal"
                  name="Manchego" 
                  placeholder="0.00"
                  value={formData.Manchego || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-2 text-base md:text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Saborizado (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  inputMode="decimal"
                  name="Saborizado" 
                  placeholder="0.00"
                  value={formData.Saborizado || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-2 text-base md:text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Ahumado (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  inputMode="decimal"
                  name="Ahumado" 
                  placeholder="0.00"
                  value={formData.Ahumado || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-2 text-base md:text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Provoleta (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  inputMode="decimal"
                  name="Provoleta" 
                  placeholder="0.00"
                  value={formData.Provoleta || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-2 text-base md:text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Ricota (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  inputMode="decimal"
                  name="Ricota" 
                  placeholder="0.00"
                  value={formData.Ricota || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-2 text-base md:text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-[#6b645c] mb-1">Observaciones / Detalle factura</label>
            <input 
              type="text" 
              name="Observaciones" 
              placeholder="Ej. Fc 1027-00050711 - Caravanas electrónicas Datamars..." 
              value={formData.Observaciones || ''} 
              onChange={handleChange} 
              className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2.5 text-base md:text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none" 
            />
          </div>

          </div>
          {/* Actions */}
          <div className="p-4 border-t border-[#e0d6c8] bg-[#faf9f6] flex justify-end space-x-3 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-[#e0d6c8] text-[#6b645c] rounded-xl text-sm hover:bg-[#f4ebd8] font-semibold transition-colors bg-white"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-[#8b7355] text-white rounded-xl text-sm hover:bg-[#7a6448] font-bold shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Movimiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
