import React, { useState, useMemo } from 'react';
import { useProduccion } from '../lib/api';
import { 
  Beaker, 
  Droplets, 
  Scale, 
  Plus, 
  Trash2, 
  X, 
  Filter, 
  TrendingUp, 
  Calendar,
  Layers
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const Produccion = () => {
  const { data, loading, addRecord, deleteRecord } = useProduccion();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const rowDate = row.fecha_elaboracion;
      if (startDate && rowDate < startDate) return false;
      if (endDate && rowDate > endDate) return false;
      return true;
    });
  }, [data, startDate, endDate]);

  // Derived metrics
  const totalLitros = filteredData.reduce((acc, curr) => acc + Number(curr.litros_leche), 0);
  const totalKg = filteredData.reduce((acc, curr) => acc + Number(curr.kg_totales), 0);
  const averageYield = totalLitros > 0 ? (totalKg / totalLitros) * 100 : 0;
  const totalLotes = filteredData.length;

  // Chart Data preparation
  const chartData = useMemo(() => {
    // Reverse to show chronological order from left to right, since data might be ordered descending
    const sorted = [...filteredData].sort((a, b) => new Date(a.fecha_elaboracion).getTime() - new Date(b.fecha_elaboracion).getTime());
    
    // Group by date to sum liters and kg, then calculate yield per day
    const grouped: Record<string, { fecha: string; litros: number; kg: number; lotes: number }> = {};
    
    sorted.forEach(row => {
      const date = new Date(row.fecha_elaboracion + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      if (!grouped[date]) {
        grouped[date] = { fecha: date, litros: 0, kg: 0, lotes: 0 };
      }
      grouped[date].litros += Number(row.litros_leche);
      grouped[date].kg += Number(row.kg_totales);
      grouped[date].lotes += 1;
    });

    return Object.values(grouped).map(day => ({
      fecha: day.fecha,
      Rendimiento: day.litros > 0 ? Number(((day.kg / day.litros) * 100).toFixed(2)) : 0,
      Leche: day.litros,
      Queso: day.kg
    }));
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#6b645c] space-y-2">
        <div className="w-8 h-8 border-3 border-[#8b7355] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold">Cargando producción...</span>
      </div>
    );
  }

  const getBadgeColor = (producto: string) => {
    switch (producto?.toUpperCase()) {
      case 'DURO': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SEMIDURO': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'BLANDO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RICOTA': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-[#e0d6c8]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#2b2824] flex items-center gap-2">
            <Beaker className="text-[#8b7355]" size={28} />
            Producción y Rendimiento
          </h1>
          <p className="text-[#8b7355] mt-1 text-sm md:text-base">Análisis de lotes elaborados, consumo de leche y eficiencia.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2b2824] hover:bg-[#3e3a35] text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow font-medium"
          >
            <Plus size={20} />
            Registrar Lote
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e0d6c8] flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={14} /> Fecha Desde
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-[#fcfbf9] border border-[#e0d6c8] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] transition-all"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={14} /> Fecha Hasta
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-[#fcfbf9] border border-[#e0d6c8] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={clearFilters}
            disabled={!startDate && !endDate}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto transition-all ${
              startDate || endDate 
              ? 'bg-[#f4ebd8] text-[#8b7355] hover:bg-[#e0d6c8] hover:text-[#2b2824]' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Filter size={16} />
            Limpiar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Leche Procesada</p>
              <h3 className="text-2xl font-bold text-[#2b2824] mt-1">{totalLitros.toLocaleString()} L</h3>
            </div>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Droplets size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Queso Producido</p>
              <h3 className="text-2xl font-bold text-[#2b2824] mt-1">{totalKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kg</h3>
            </div>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Scale size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Rendimiento Prom.</p>
              <h3 className="text-2xl font-bold text-[#2b2824] mt-1">{averageYield.toFixed(2)} %</h3>
            </div>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Lotes Totales</p>
              <h3 className="text-2xl font-bold text-[#2b2824] mt-1">{totalLotes}</h3>
            </div>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Layers size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-5 md:p-6">
          <h3 className="text-lg font-bold text-[#2b2824] mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-[#8b7355]" />
            Evolución del Rendimiento
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0d6c8" />
                <XAxis 
                  dataKey="fecha" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b645c' }}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b645c' }}
                  tickFormatter={(val) => `${val}%`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e0d6c8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#2b2824', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="Rendimiento" 
                  name="Rendimiento (%)"
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] overflow-hidden">
        <div className="p-5 border-b border-[#e0d6c8] bg-[#fdfcfb] flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2b2824]">Registros de Elaboración</h3>
          <span className="text-sm text-gray-500 font-medium">{filteredData.length} resultados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#f4ebd8]/50 text-[#8b7355] text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Lote</th>
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Variedad</th>
                <th className="px-6 py-4 font-semibold text-right">Leche (L)</th>
                <th className="px-6 py-4 font-semibold text-right">Queso (Kg)</th>
                <th className="px-6 py-4 font-semibold text-right">Rendimiento</th>
                <th className="px-6 py-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0d6c8]/60">
              {filteredData.map((row) => {
                const yieldVal = row.rendimiento ? Number(row.rendimiento) : ((row.kg_totales / row.litros_leche) * 100);
                return (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 text-sm text-[#4a443c] font-medium">
                      {new Date(row.fecha_elaboracion + 'T12:00:00Z').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                        {row.lote}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full border ${getBadgeColor(row.producto)}`}>
                        {row.producto}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b645c] font-medium">
                      {row.tipo_queso || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-[#2b2824]">
                      {Number(row.litros_leche).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-[#2b2824]">
                      {Number(row.kg_totales).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className={`font-bold ${yieldVal > 15 ? 'text-emerald-600' : yieldVal > 10 ? 'text-amber-600' : 'text-red-500'}`}>
                        {yieldVal.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas eliminar el lote ${row.lote}?`)) {
                            deleteRecord(row.id!);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
                        title="Eliminar registro"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Filter size={48} className="mb-4 text-[#e0d6c8]" />
                      <p className="text-lg font-medium text-[#6b645c]">No hay registros para este filtro</p>
                      <p className="text-sm mt-1">Prueba cambiando las fechas o registrando un nuevo lote.</p>
                      <button 
                        onClick={clearFilters}
                        className="mt-4 text-[#8b7355] font-semibold hover:underline"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[#e0d6c8] bg-[#f4ebd8]">
              <h2 className="text-xl font-bold text-[#2b2824] flex items-center gap-2">
                <Plus size={20} className="text-[#8b7355]" />
                Registrar Nuevo Lote
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-[#8b7355] hover:text-[#2b2824] hover:bg-white/50 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="produccion-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Fecha de Elaboración</label>
                    <input 
                      type="date" 
                      name="fecha_elaboracion"
                      required
                      value={formData.fecha_elaboracion}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Número de Lote</label>
                    <input 
                      type="text" 
                      name="lote"
                      required
                      placeholder="Ej: L-01, 150..."
                      value={formData.lote}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                      Leche Procesada (L)
                      <Droplets size={14} className="text-blue-500" />
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="litros_leche"
                      required
                      value={formData.litros_leche || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                      Queso Producido (Kg)
                      <Scale size={14} className="text-amber-500" />
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="kg_totales"
                      required
                      value={formData.kg_totales || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Categoría</label>
                    <select 
                      name="producto"
                      value={formData.producto}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] bg-gray-50/50"
                    >
                      <option value="DURO">Duro</option>
                      <option value="SEMIDURO">Semiduro</option>
                      <option value="BLANDO">Blando</option>
                      <option value="RICOTA">Ricota</option>
                      <option value="DULCE DE LECHE">Dulce de Leche</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Variedad Específica</label>
                    <input 
                      type="text" 
                      name="tipo_queso"
                      placeholder="Ej: Pecorino, Manchego"
                      value={formData.tipo_queso}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Cantidades Detail */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-[#2b2824] mb-4">Detalle de Hormas <span className="text-gray-400 font-normal">(Opcional)</span></h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {['grande', 'barra', 'tubo', 'chico', 'camambert', 'ricota', 'otro'].map((tipo) => (
                      <div key={tipo} className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 capitalize">
                          {tipo === 'camambert' ? 'Camembert' : tipo}
                        </label>
                        <input 
                          type="number" 
                          name={`cantidad_${tipo}`} 
                          value={(formData as any)[`cantidad_${tipo}`] || ''} 
                          onChange={handleInputChange} 
                          className="w-full border border-gray-300 rounded-md p-1.5 text-sm focus:ring-1 focus:ring-[#8b7355] focus:border-[#8b7355] bg-gray-50/30" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 font-medium rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="produccion-form"
                className="px-5 py-2.5 font-medium bg-[#2b2824] text-white rounded-xl hover:bg-[#3e3a35] transition-colors shadow-sm"
              >
                Guardar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produccion;
