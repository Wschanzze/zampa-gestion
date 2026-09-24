import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction } from '../utils/calculations';
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
    Cuenta: 'EFECTIVO',
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

  // Autocomplete options derived dynamically from existing database
  const autocompleteLists = useMemo(() => {
    const provs = new Set<string>();
    const rubros = new Set<string>();
    const subrubros = new Set<string>();
    const cuentas = new Set<string>(['EFECTIVO', 'BANCO', 'PENDIENTE', 'CAJA CHICA']);

    existingData.forEach(item => {
      if (item['Prov/Cliente']) provs.add(item['Prov/Cliente'].trim());
      if (item.Rubro) rubros.add(item.Rubro.trim());
      if (item['Subrubro/Producto']) subrubros.add(item['Subrubro/Producto'].trim());
      if (item.Cuenta) cuentas.add(item.Cuenta.trim());
    });

    return {
      proveedores: Array.from(provs).sort(),
      rubros: Array.from(rubros).sort(),
      subrubros: Array.from(subrubros).sort(),
      cuentas: Array.from(cuentas).sort(),
    };
  }, [existingData]);

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

  // Auto-fill or suggest Cantidades from total cheeses if in Queseria
  const handleAutoFillCantidades = () => {
    if (totalKgQuesos > 0) {
      setFormData(prev => ({ ...prev, Cantidades: totalKgQuesos }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Fecha) {
      alert('Por favor especifica una fecha');
      return;
    }

    const finalData: Transaction = {
      ...formData,
      Fecha: formData.Fecha,
      Ingresos: tipoMovimiento === 'INGRESO' ? (Number(formData.Ingresos) || 0) : 0,
      Egresos: tipoMovimiento === 'EGRESO' ? (Number(formData.Egresos) || 0) : 0,
      Cantidades: Number(formData.Cantidades) || 0,
      Pecorino: Number(formData.Pecorino) || 0,
      Manchego: Number(formData.Manchego) || 0,
      Saborizado: Number(formData.Saborizado) || 0,
      Ahumado: Number(formData.Ahumado) || 0,
      Provoleta: Number(formData.Provoleta) || 0,
      Ricota: Number(formData.Ricota) || 0,
    };

    if (isEditing && initialData?.id && onUpdate) {
      await onUpdate(initialData.id, finalData);
    } else if (onAdd) {
      await onAdd(finalData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#faf9f6] rounded-2xl border border-[#e0d6c8] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e0d6c8] flex justify-between items-center bg-[#f4ebd8]/70">
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
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

          {/* Datalists for autocompletion */}
          <datalist id="lista-proveedores">
            {autocompleteLists.proveedores.map(p => <option key={p} value={p} />)}
          </datalist>
          <datalist id="lista-rubros">
            {autocompleteLists.rubros.map(r => <option key={r} value={r} />)}
          </datalist>
          <datalist id="lista-subrubros">
            {autocompleteLists.subrubros.map(s => <option key={s} value={s} />)}
          </datalist>

          {/* Grid de campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">Fecha (D/M/AAAA)</label>
              <input 
                required 
                type="text" 
                name="Fecha" 
                placeholder="22/9/2026" 
                value={formData.Fecha || ''} 
                onChange={handleChange} 
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none" 
              />
            </div>

            {/* Proveedor / Cliente con autocompletado */}
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">
                Proveedor / Cliente
              </label>
              <input 
                type="text" 
                name="Prov/Cliente" 
                list="lista-proveedores"
                placeholder="Escribe o selecciona..." 
                value={formData['Prov/Cliente'] || ''} 
                onChange={handleChange} 
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none" 
              />
            </div>

            {/* Cuenta */}
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">Cuenta</label>
              <select 
                name="Cuenta" 
                value={formData.Cuenta || ''} 
                onChange={handleChange} 
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none font-medium"
              >
                {autocompleteLists.cuentas.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Unidad de Negocio */}
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">Unidad de Negocio</label>
              <select 
                name="Subactividad" 
                value={formData.Subactividad || ''} 
                onChange={handleChange} 
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none font-medium"
              >
                <option value="TAMBO">TAMBO</option>
                <option value="RECRIA">RECRÍA</option>
                <option value="QUESERIA">QUESERÍA</option>
                <option value="COMUN">COMÚN</option>
              </select>
            </div>

            {/* Rubro */}
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">Rubro</label>
              <input 
                type="text" 
                name="Rubro" 
                list="lista-rubros"
                placeholder="Ej. VENTA QUESO, ALIMENTACION" 
                value={formData.Rubro || ''} 
                onChange={handleChange} 
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none" 
              />
            </div>

            {/* Subrubro / Producto */}
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">Subrubro / Producto</label>
              <input 
                type="text" 
                name="Subrubro/Producto" 
                list="lista-subrubros"
                placeholder="Ej. Cuajo, Balanceado..." 
                value={formData['Subrubro/Producto'] || ''} 
                onChange={handleChange} 
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none" 
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">
                {tipoMovimiento === 'INGRESO' ? 'Monto Ingreso ($)' : 'Monto Egreso ($)'}
              </label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                value={(tipoMovimiento === 'INGRESO' ? formData.Ingresos : formData.Egresos) || ''} 
                onChange={handleMontoChange} 
                className={`w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-1 ${
                  tipoMovimiento === 'INGRESO' ? 'text-emerald-700 focus:ring-emerald-500' : 'text-rose-700 focus:ring-rose-500'
                }`} 
              />
            </div>

            {/* Cantidades generales */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-[#6b645c]">Cantidades Totales</label>
                {totalKgQuesos > 0 && (
                  <button 
                    type="button" 
                    onClick={handleAutoFillCantidades}
                    className="text-[10px] text-amber-800 hover:underline flex items-center gap-0.5"
                    title="Usar suma de quesos"
                  >
                    <Calculator size={11} /> Usar {totalKgQuesos} kg
                  </button>
                )}
              </div>
              <input 
                type="number" 
                step="0.01" 
                name="Cantidades" 
                placeholder="0.00"
                value={formData.Cantidades || ''} 
                onChange={handleChange} 
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none font-medium" 
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
                  name="Pecorino" 
                  placeholder="0.00"
                  value={formData.Pecorino || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Manchego (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="Manchego" 
                  placeholder="0.00"
                  value={formData.Manchego || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Saborizado (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="Saborizado" 
                  placeholder="0.00"
                  value={formData.Saborizado || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Ahumado (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="Ahumado" 
                  placeholder="0.00"
                  value={formData.Ahumado || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Provoleta (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="Provoleta" 
                  placeholder="0.00"
                  value={formData.Provoleta || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">Ricota (kg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="Ricota" 
                  placeholder="0.00"
                  value={formData.Ricota || ''} 
                  onChange={handleChange} 
                  className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
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
              className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none" 
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#e0d6c8] flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-[#e0d6c8] text-[#6b645c] rounded-xl text-sm hover:bg-[#f4ebd8] font-semibold transition-colors"
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
