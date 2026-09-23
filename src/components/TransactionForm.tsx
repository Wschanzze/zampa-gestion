import React, { useState } from 'react';
import type { Transaction } from '../utils/calculations';

interface Props {
  onAdd: (tx: Transaction) => void;
  onClose: () => void;
}

const TransactionForm: React.FC<Props> = ({ onAdd, onClose }) => {
  const [tipoMovimiento, setTipoMovimiento] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [formData, setFormData] = useState<Partial<Transaction>>({
    Fecha: new Date().toLocaleDateString('es-AR'),
    Subactividad: 'TAMBO',
    Cuenta: 'EFECTIVO'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    if (tipoMovimiento === 'INGRESO') {
      setFormData({ ...formData, Ingresos: val, Egresos: 0 });
    } else {
      setFormData({ ...formData, Egresos: val, Ingresos: 0 });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Fecha) return;
    
    // Ensure numeric values
    const finalData = {
      ...formData,
      Ingresos: Number(formData.Ingresos) || 0,
      Egresos: Number(formData.Egresos) || 0,
      Cantidades: Number(formData.Cantidades) || 0,
      Pecorino: Number(formData.Pecorino) || 0,
      Manchego: Number(formData.Manchego) || 0,
      Saborizado: Number(formData.Saborizado) || 0,
      Ahumado: Number(formData.Ahumado) || 0,
      Provoleta: Number(formData.Provoleta) || 0,
      Ricota: Number(formData.Ricota) || 0,
    };
    
    onAdd(finalData as Transaction);
    onClose();
  };

  const isQueseria = formData.Subactividad?.toUpperCase() === 'QUESERIA';

  return (
    <div className="bg-[#faf9f6] p-6 border-b border-[#e0d6c8]">
      <h3 className="text-lg font-semibold text-[#3e3a35] mb-4">Nueva Transacción</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Tipo de Movimiento Toggle */}
        <div className="md:col-span-4 flex space-x-4 mb-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="radio" 
              name="tipo" 
              value="INGRESO"
              checked={tipoMovimiento === 'INGRESO'}
              onChange={() => {
                setTipoMovimiento('INGRESO');
                setFormData(prev => ({ ...prev, Ingresos: prev.Egresos || prev.Ingresos, Egresos: 0 }));
              }}
              className="text-[#8b7355] focus:ring-[#8b7355]"
            />
            <span className="text-sm font-medium text-[#3e3a35]">Ingreso (Venta)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="radio" 
              name="tipo" 
              value="EGRESO"
              checked={tipoMovimiento === 'EGRESO'}
              onChange={() => {
                setTipoMovimiento('EGRESO');
                setFormData(prev => ({ ...prev, Egresos: prev.Ingresos || prev.Egresos, Ingresos: 0 }));
              }}
              className="text-[#8b7355] focus:ring-[#8b7355]"
            />
            <span className="text-sm font-medium text-[#3e3a35]">Egreso (Gasto)</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6b645c] mb-1">Fecha</label>
          <input required type="text" name="Fecha" placeholder="DD/MM/YYYY" value={formData.Fecha || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-[#6b645c] mb-1">Prov/Cliente</label>
          <input type="text" name="Prov/Cliente" value={formData['Prov/Cliente'] || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-[#6b645c] mb-1">Cuenta</label>
          <select name="Cuenta" value={formData.Cuenta || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors">
            <option value="EFECTIVO">EFECTIVO</option>
            <option value="BANCO">BANCO</option>
            <option value="PENDIENTE">PENDIENTE</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6b645c] mb-1">Unidad de Negocio</label>
          <select name="Subactividad" value={formData.Subactividad || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors">
            <option value="TAMBO">TAMBO</option>
            <option value="RECRIA">RECRÍA</option>
            <option value="QUESERIA">QUESERÍA</option>
            <option value="COMUN">COMÚN</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6b645c] mb-1">Rubro</label>
          <input type="text" name="Rubro" value={formData.Rubro || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6b645c] mb-1">Subrubro/Producto</label>
          <input type="text" name="Subrubro/Producto" value={formData['Subrubro/Producto'] || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6b645c] mb-1">Monto ($)</label>
          <input 
            type="number" 
            step="0.01" 
            value={(tipoMovimiento === 'INGRESO' ? formData.Ingresos : formData.Egresos) || ''} 
            onChange={handleMontoChange} 
            className={`w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors font-medium ${tipoMovimiento === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`} 
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6b645c] mb-1">Cantidades</label>
          <input type="number" step="0.01" name="Cantidades" value={formData.Cantidades || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
        </div>

        {isQueseria && (
          <>
            <div>
              <label className="block text-xs font-medium text-[#6b645c] mb-1">Pecorino (Kg)</label>
              <input type="number" step="0.01" name="Pecorino" value={formData.Pecorino || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b645c] mb-1">Manchego (Kg)</label>
              <input type="number" step="0.01" name="Manchego" value={formData.Manchego || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b645c] mb-1">Saborizado (Kg)</label>
              <input type="number" step="0.01" name="Saborizado" value={formData.Saborizado || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b645c] mb-1">Ahumado (Kg)</label>
              <input type="number" step="0.01" name="Ahumado" value={formData.Ahumado || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b645c] mb-1">Provoleta (Kg)</label>
              <input type="number" step="0.01" name="Provoleta" value={formData.Provoleta || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b645c] mb-1">Ricota (Kg)</label>
              <input type="number" step="0.01" name="Ricota" value={formData.Ricota || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
            </div>
          </>
        )}
        
        <div className="md:col-span-4">
          <label className="block text-xs font-medium text-[#6b645c] mb-1">Observaciones</label>
          <input type="text" name="Observaciones" value={formData.Observaciones || ''} onChange={handleChange} className="w-full border border-[#e0d6c8] rounded px-3 py-2 text-sm focus:ring-[#8b7355] focus:border-[#8b7355] outline-none transition-colors" />
        </div>

        <div className="md:col-span-4 flex justify-end space-x-3 mt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e0d6c8] text-[#6b645c] rounded text-sm hover:bg-[#f4ebd8] font-medium transition-colors">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-[#8b7355] text-white rounded text-sm hover:bg-[#7a6448] font-medium shadow-sm transition-colors">Guardar Movimiento</button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
