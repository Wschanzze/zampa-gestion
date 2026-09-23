import React, { useState } from 'react';
import type { Transaction } from '../utils/calculations';

interface Props {
  onAdd: (tx: Transaction) => void;
  onClose: () => void;
}

const TransactionForm: React.FC<Props> = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    Fecha: new Date().toLocaleDateString('es-AR'),
    Subactividad: 'TAMBO',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Fecha) return;
    onAdd(formData as Transaction);
    onClose();
  };

  return (
    <div className="bg-white p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Transacción</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
          <input required type="text" name="Fecha" placeholder="DD/MM/YYYY" value={formData.Fecha || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Prov/Cliente</label>
          <input type="text" name="Prov/Cliente" value={formData['Prov/Cliente'] || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cuenta</label>
          <select name="Cuenta" value={formData.Cuenta || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
            <option value="">Seleccionar...</option>
            <option value="EFECTIVO">EFECTIVO</option>
            <option value="BANCO">BANCO</option>
            <option value="PENDIENTE">PENDIENTE</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Subactividad</label>
          <select name="Subactividad" value={formData.Subactividad || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
            <option value="TAMBO">TAMBO</option>
            <option value="RECRIA">RECRIA</option>
            <option value="QUESERIA">QUESERIA</option>
            <option value="COMUN">COMUN</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Rubro</label>
          <input type="text" name="Rubro" value={formData.Rubro || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Subrubro/Producto</label>
          <input type="text" name="Subrubro/Producto" value={formData['Subrubro/Producto'] || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ingresos</label>
          <input type="number" step="0.01" name="Ingresos" value={formData.Ingresos || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-emerald-600" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Egresos</label>
          <input type="number" step="0.01" name="Egresos" value={formData.Egresos || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-rose-600" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cantidades</label>
          <input type="number" step="0.01" name="Cantidades" value={formData.Cantidades || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>

        <div className="md:col-span-4 flex justify-end space-x-3 mt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">Guardar</button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
