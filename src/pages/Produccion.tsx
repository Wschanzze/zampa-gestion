import React, { useState } from 'react';
import { useProduccion } from '../lib/api';
import { Beaker, Droplets, Scale, Plus, Trash2, X } from 'lucide-react';

const Produccion = () => {
  const { data, loading, addRecord, deleteRecord } = useProduccion();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    lote: '',
    litros_leche: 0,
    producto: 'SEMIDURO',
    tipo_queso: '',
    kg_totales: 0,
    cantidad_grande: 0,
    cantidad_barra: 0,
    cantidad_tubo: 0,
    cantidad_chico: 0,
    cantidad_otro: 0,
    cantidad_camambert: 0,
    cantidad_ricota: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addRecord(formData);
    if (success) {
      setIsModalOpen(false);
      setFormData({
        ...formData,
        lote: '',
        litros_leche: 0,
        kg_totales: 0,
        cantidad_grande: 0,
        cantidad_barra: 0,
        cantidad_tubo: 0,
        cantidad_chico: 0,
        cantidad_otro: 0,
        cantidad_camambert: 0,
        cantidad_ricota: 0
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value
    }));
  };

  const totalLitros = data.reduce((acc, curr) => acc + Number(curr.litros_leche), 0);
  const totalKg = data.reduce((acc, curr) => acc + Number(curr.kg_totales), 0);
  const averageYield = totalLitros > 0 ? (totalKg / totalLitros) * 100 : 0;

  if (loading) {
    return <div className="p-8 text-center text-[#8b7355]">Cargando producción...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#2b2824]">Producción y Rendimiento</h1>
          <p className="text-[#8b7355] mt-1">Control de elaboración y métricas de quesería</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#2b2824] hover:bg-[#3e3a35] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Lote
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-[#e0d6c8] p-6 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
            <Droplets size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Leche Procesada</p>
            <h3 className="text-2xl font-bold text-[#2b2824]">{totalLitros.toLocaleString()} Lts</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#e0d6c8] p-6 flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-lg">
            <Scale size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Queso Producido</p>
            <h3 className="text-2xl font-bold text-[#2b2824]">{totalKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kg</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#e0d6c8] p-6 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
            <Beaker size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rendimiento Promedio</p>
            <h3 className="text-2xl font-bold text-[#2b2824]">{averageYield.toFixed(2)} %</h3>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e0d6c8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4ebd8] text-[#8b7355] text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Lote</th>
                <th className="p-4 font-medium">Producto</th>
                <th className="p-4 font-medium">Variedad</th>
                <th className="p-4 font-medium text-right">Leche (Lts)</th>
                <th className="p-4 font-medium text-right">Queso (Kg)</th>
                <th className="p-4 font-medium text-right">Rend. %</th>
                <th className="p-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0d6c8]">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-[#2b2824]">{new Date(row.fecha_elaboracion + 'T12:00:00Z').toLocaleDateString('es-AR')}</td>
                  <td className="p-4 font-medium text-[#2b2824]">{row.lote}</td>
                  <td className="p-4 text-[#8b7355]">{row.producto}</td>
                  <td className="p-4 text-[#8b7355]">{row.tipo_queso || '-'}</td>
                  <td className="p-4 text-right text-[#2b2824]">{row.litros_leche}</td>
                  <td className="p-4 text-right text-[#2b2824]">{row.kg_totales}</td>
                  <td className="p-4 text-right font-medium text-emerald-600">
                    {row.rendimiento ? Number(row.rendimiento).toFixed(2) : ((row.kg_totales / row.litros_leche) * 100).toFixed(2)}%
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar el lote ${row.lote}?`)) {
                          deleteRecord(row.id!);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Eliminar registro"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No hay registros de producción cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#f4ebd8]">
              <h2 className="text-xl font-bold text-[#2b2824]">Registrar Nuevo Lote</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="produccion-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Fecha de Elaboración</label>
                    <input 
                      type="date" 
                      name="fecha_elaboracion"
                      required
                      value={formData.fecha_elaboracion}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#8b7355] focus:border-[#8b7355]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Lote</label>
                    <input 
                      type="text" 
                      name="lote"
                      required
                      placeholder="Ej: 1, 2, L01..."
                      value={formData.lote}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#8b7355] focus:border-[#8b7355]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Leche Procesada (Lts)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="litros_leche"
                      required
                      value={formData.litros_leche || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#8b7355] focus:border-[#8b7355]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Queso Producido (Kg)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="kg_totales"
                      required
                      value={formData.kg_totales || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#8b7355] focus:border-[#8b7355]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Categoría</label>
                    <select 
                      name="producto"
                      value={formData.producto}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#8b7355] focus:border-[#8b7355]"
                    >
                      <option value="DURO">Duro</option>
                      <option value="SEMIDURO">Semiduro</option>
                      <option value="BLANDO">Blando</option>
                      <option value="RICOTA">Ricota</option>
                      <option value="DULCE DE LECHE">Dulce de Leche</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Variedad (Ej: Pecorino, Manchego)</label>
                    <input 
                      type="text" 
                      name="tipo_queso"
                      value={formData.tipo_queso}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#8b7355] focus:border-[#8b7355]"
                    />
                  </div>
                </div>

                {/* Cantidades Detail */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Detalle de Hormas (Opcional)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Grande</label>
                      <input type="number" name="cantidad_grande" value={formData.cantidad_grande || ''} onChange={handleInputChange} className="w-full border rounded p-1 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Barra</label>
                      <input type="number" name="cantidad_barra" value={formData.cantidad_barra || ''} onChange={handleInputChange} className="w-full border rounded p-1 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Tubo</label>
                      <input type="number" name="cantidad_tubo" value={formData.cantidad_tubo || ''} onChange={handleInputChange} className="w-full border rounded p-1 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Chico</label>
                      <input type="number" name="cantidad_chico" value={formData.cantidad_chico || ''} onChange={handleInputChange} className="w-full border rounded p-1 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Camembert</label>
                      <input type="number" name="cantidad_camambert" value={formData.cantidad_camambert || ''} onChange={handleInputChange} className="w-full border rounded p-1 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Ricota (un)</label>
                      <input type="number" name="cantidad_ricota" value={formData.cantidad_ricota || ''} onChange={handleInputChange} className="w-full border rounded p-1 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Otro</label>
                      <input type="number" name="cantidad_otro" value={formData.cantidad_otro || ''} onChange={handleInputChange} className="w-full border rounded p-1 text-sm" />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="produccion-form"
                className="px-4 py-2 bg-[#2b2824] text-white rounded-md hover:bg-[#3e3a35]"
              >
                Guardar Lote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produccion;
