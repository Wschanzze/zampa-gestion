import React, { useState, useMemo } from 'react';
import { calculateSummaryByUnit, getAvailableYears, parseCurrency } from '../utils/calculations';
import type { Transaction } from '../utils/calculations';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  PieChart as PieIcon, 
  Users, 
  ArrowUpRight, 
  Layers, 
  Calendar,
  WalletCards,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  data: Transaction[];
  onNavigateToCuentas?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatKg = (val: number) => {
  return `${val.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
};

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigateToCuentas }) => {
  const navigate = useNavigate();
  const availableYears = useMemo(() => getAvailableYears(data), [data]);
  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || 'TODOS');

  // Filter data by selected year or all
  const filteredData = useMemo(() => {
    if (selectedYear === 'TODOS') return data;
    return data.filter(d => {
      const parts = d.Fecha?.split('/');
      return parts && parts.length === 3 && parts[2]?.trim() === selectedYear;
    });
  }, [data, selectedYear]);

  const summary = useMemo(() => calculateSummaryByUnit(filteredData), [filteredData]);
  const units = ['TAMBO', 'RECRIA', 'QUESERIA', 'COMUN'] as const;

  // Key metrics
  const totalIngresos = summary.TOTAL.ingresos;
  const totalEgresos = summary.TOTAL.egresos;
  const resultadoNeto = summary.TOTAL.resultado;
  const margenOperativo = totalIngresos > 0 ? ((resultadoNeto / totalIngresos) * 100).toFixed(1) : '0';

  // Cheese sales total kg
  const totalCheeseKg = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      const p = Number(row.Pecorino) || 0;
      const man = Number(row.Manchego) || 0;
      const s = Number(row.Saborizado) || 0;
      const a = Number(row.Ahumado) || 0;
      const pr = Number(row.Provoleta) || 0;
      const r = Number(row.Ricota) || 0;
      const sum = p + man + s + a + pr + r;
      return acc + (sum > 0 ? sum : 0);
    }, 0);
  }, [filteredData]);

  // Top 5 Expenses by Rubro
  const topExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach(row => {
      const egreso = parseCurrency(row.Egresos);
      if (egreso > 0) {
        const rubro = row.Rubro?.trim() || 'Sin Rubro';
        map[rubro] = (map[rubro] || 0) + egreso;
      }
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([rubro, amount]) => ({
        rubro,
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredData]);

  // Top 5 Clients by Revenue
  const topClients = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach(row => {
      const ingreso = parseCurrency(row.Ingresos);
      if (ingreso > 0) {
        const client = row['Prov/Cliente']?.trim() || 'Ventas Generales / Mostrador';
        map[client] = (map[client] || 0) + ingreso;
      }
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([client, amount]) => ({
        client,
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredData]);

  // Chart data for Unit Comparison
  const unitChartData = useMemo(() => {
    return units.map(unit => ({
      unidad: unit,
      Ingresos: summary[unit].ingresos,
      Egresos: summary[unit].egresos,
      Resultado: summary[unit].resultado
    }));
  }, [summary]);

  return (
    <div className="space-y-6">
      
      {/* Header with Title and Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 p-4 sm:p-5 rounded-xl border border-[#e0d6c8] shadow-sm">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#2b2824] flex items-center space-x-2">
            <Layers size={18} className="text-[#8b7355]" />
            <span>Panel Ejecutivo y Rendimiento Operativo</span>
          </h3>
          <p className="text-xs text-[#6b645c] mt-0.5">Indicadores financieros, balance por actividades y principales métricas de negocio</p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Calendar size={15} className="text-[#8b7355]" />
          <label className="text-xs font-semibold text-[#6b645c] uppercase">Período:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-[#e0d6c8] rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-[#2b2824] bg-[#faf9f6] focus:ring-1 focus:ring-[#8b7355] outline-none"
          >
            <option value="TODOS">Histórico Completo</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Año {yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Ingresos Totales */}
        <div className="bg-white/95 p-4 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Ingresos Totales</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            {formatCurrency(totalIngresos)}
          </p>
          <div className="flex items-center space-x-1 text-[11px] text-[#6b645c] mt-1">
            <span className="text-emerald-700 font-semibold flex items-center">
              <ArrowUpRight size={13} /> Facturación
            </span>
            <span>en el período</span>
          </div>
        </div>

        {/* Egresos Totales */}
        <div className="bg-white/95 p-4 rounded-xl border border-rose-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase tracking-wider">
            <span>Costos y Egresos</span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-700">
              <TrendingDown size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2 font-mono">
            {formatCurrency(totalEgresos)}
          </p>
          <div className="flex items-center space-x-1 text-[11px] text-[#6b645c] mt-1">
            <span>Gastos operativos del tambo</span>
          </div>
        </div>

        {/* Resultado Neto */}
        <div className={`bg-white/95 p-4 rounded-xl border ${resultadoNeto >= 0 ? 'border-amber-300' : 'border-rose-300'} shadow-sm relative overflow-hidden`}>
          <div className="flex items-center justify-between text-[#2b2824] text-xs font-bold uppercase tracking-wider">
            <span>Resultado Operativo</span>
            <div className={`p-1.5 rounded-lg ${resultadoNeto >= 0 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'}`}>
              <TrendingUp size={16} />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 font-mono ${resultadoNeto >= 0 ? 'text-amber-950' : 'text-rose-700'}`}>
            {formatCurrency(resultadoNeto)}
          </p>
          <div className="flex items-center space-x-2 text-[11px] mt-1">
            <span className={`px-1.5 py-0.5 rounded font-bold ${resultadoNeto >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              Margen: {margenOperativo}%
            </span>
            <span className="text-[#6b645c]">sobre ventas</span>
          </div>
        </div>

        {/* Volumen de Quesería */}
        <div className="bg-white/95 p-4 rounded-xl border border-[#e0d6c8] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[#2b2824] text-xs font-bold uppercase tracking-wider">
            <span>Volumen Quesería</span>
            <div className="p-1.5 bg-[#f4ebd8] rounded-lg text-[#8b7355]">
              <Package size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-[#2b2824] mt-2 font-mono">
            {formatKg(totalCheeseKg)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-[#6b645c] mt-1">
            <span>Comercializados</span>
            <button 
              onClick={() => navigate('/queseria')} 
              className="text-[#8b7355] font-bold hover:underline flex items-center"
            >
              Ver quesería <ArrowRight size={11} className="ml-0.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Row: Table Resumen IPCVA + Unit Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Summary Table by Unit (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-4 sm:px-6 py-3.5 border-b border-[#e0d6c8] bg-[#fdfdfc] flex items-center justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#2b2824]">Resumen por Unidad de Negocio</h4>
                <p className="text-xs text-[#6b645c]">Metodología IPCVA: balance segmentado por actividad productiva</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#f4ebd8] text-[#8b7355] rounded border border-[#e0d6c8]">
                {selectedYear === 'TODOS' ? 'Histórico' : selectedYear}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="text-[11px] text-[#6b645c] bg-[#f4ebd8]/50 border-b border-[#e0d6c8] uppercase">
                  <tr>
                    <th className="px-3 sm:px-5 py-2.5 font-semibold">Unidad</th>
                    <th className="px-3 sm:px-5 py-2.5 text-right font-semibold">Ingresos</th>
                    <th className="px-3 sm:px-5 py-2.5 text-right font-semibold">Egresos</th>
                    <th className="px-3 sm:px-5 py-2.5 text-right font-semibold">Resultado</th>
                    <th className="px-3 sm:px-4 py-2.5 text-right font-semibold">% Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => {
                    const stats = summary[unit];
                    const isPositive = stats.resultado >= 0;
                    const margin = stats.ingresos > 0 ? ((stats.resultado / stats.ingresos) * 100).toFixed(0) : '-';

                    return (
                      <tr key={unit} className="border-b border-[#e0d6c8]/50 hover:bg-[#f4ebd8]/30 transition-colors">
                        <td className="px-3 sm:px-5 py-2.5 font-bold text-[#2b2824]">{unit}</td>
                        <td className="px-3 sm:px-5 py-2.5 text-right font-mono text-emerald-700">{formatCurrency(stats.ingresos)}</td>
                        <td className="px-3 sm:px-5 py-2.5 text-right font-mono text-rose-700">{formatCurrency(stats.egresos)}</td>
                        <td className={`px-3 sm:px-5 py-2.5 text-right font-bold font-mono ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatCurrency(stats.resultado)}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-right font-mono text-[11px] text-[#6b645c]">
                          {margin !== '-' ? `${margin}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Total Row */}
                  <tr className="bg-[#f4ebd8] border-t-2 border-[#d4c3ab]">
                    <td className="px-3 sm:px-5 py-3 font-black text-[#2b2824]">TOTAL</td>
                    <td className="px-3 sm:px-5 py-3 text-right font-black font-mono text-emerald-800">{formatCurrency(summary.TOTAL.ingresos)}</td>
                    <td className="px-3 sm:px-5 py-3 text-right font-black font-mono text-rose-800">{formatCurrency(summary.TOTAL.egresos)}</td>
                    <td className={`px-3 sm:px-5 py-3 text-right font-black font-mono text-sm sm:text-base ${summary.TOTAL.resultado >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {formatCurrency(summary.TOTAL.resultado)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right font-black font-mono text-xs text-[#2b2824]">
                      {margenOperativo}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-[#faf9f6] border-t border-[#e0d6c8]/60 text-xs text-[#6b645c] flex items-center justify-between">
            <span>Desglose mensual completo disponible en el Flujo de Caja</span>
            <button 
              onClick={() => navigate('/flujo-caja')}
              className="font-bold text-[#8b7355] hover:underline flex items-center space-x-1"
            >
              <span>Ver Flujo</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Visual Bar Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#e0d6c8]/60">
              <div className="flex items-center space-x-2">
                <PieIcon size={18} className="text-[#8b7355]" />
                <h4 className="text-sm sm:text-base font-bold text-[#2b2824]">Ingresos vs Egresos por Unidad</h4>
              </div>
            </div>
            
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e9df" />
                  <XAxis dataKey="unidad" stroke="#6b645c" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b645c" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#faf9f6', borderColor: '#e0d6c8', borderRadius: '10px', fontSize: '11px' }}
                    formatter={(val: any) => [formatCurrency(val), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Ingresos" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresos" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e0d6c8]/60 text-center">
            <span className="text-[11px] text-[#6b645c]">
              Comparativa directa de rentabilidad operativa por sector
            </span>
          </div>
        </div>

      </div>

      {/* Analytics Section: Top Expenses & Top Clients (Replacing old Pendientes table) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Rubros de Mayor Costo */}
        <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[#e0d6c8]/60 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <TrendingDown size={18} className="text-rose-700" />
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#2b2824]">Principales Rubros de Gasto</h4>
                <p className="text-xs text-[#6b645c]">Mayor concentración de costos operativos</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-700 font-mono">
              {formatCurrency(topExpenses.reduce((a, b) => a + b.amount, 0))}
            </span>
          </div>

          <div className="space-y-3.5">
            {topExpenses.map((item, idx) => (
              <div key={item.rubro} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#2b2824] flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#f4ebd8] text-[#8b7355] text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[200px] sm:max-w-[260px]">{item.rubro}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-rose-700">{formatCurrency(item.amount)}</span>
                    <span className="text-[10px] text-[#6b645c] w-9 text-right font-semibold">({item.pct.toFixed(0)}%)</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-[#f4ebd8]/70 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(item.pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {topExpenses.length === 0 && (
              <p className="text-xs text-center text-[#6b645c] py-6">No hay registros de gastos en este período.</p>
            )}
          </div>
        </div>

        {/* Top 5 Clientes / Compradores */}
        <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[#e0d6c8]/60 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Users size={18} className="text-emerald-700" />
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#2b2824]">Mayores Clientes y Ventas</h4>
                <p className="text-xs text-[#6b645c]">Principales generadores de ingresos comerciales</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              {formatCurrency(topClients.reduce((a, b) => a + b.amount, 0))}
            </span>
          </div>

          <div className="space-y-3.5">
            {topClients.map((item, idx) => (
              <div key={item.client} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#2b2824] flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[200px] sm:max-w-[260px]">{item.client}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-700">{formatCurrency(item.amount)}</span>
                    <span className="text-[10px] text-[#6b645c] w-9 text-right font-semibold">({item.pct.toFixed(0)}%)</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-[#f4ebd8]/70 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(item.pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {topClients.length === 0 && (
              <p className="text-xs text-center text-[#6b645c] py-6">No hay registros de ventas en este período.</p>
            )}
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Strip for Cuentas Corrientes */}
      <div className="bg-gradient-to-r from-[#f4ebd8]/80 via-white to-[#f4ebd8]/80 p-4 rounded-xl border border-[#e0d6c8] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="p-2.5 bg-[#8b7355] text-white rounded-xl shadow-xs">
            <WalletCards size={20} />
          </div>
          <div>
            <h5 className="text-sm font-bold text-[#2b2824]">¿Necesitas controlar cobros y pagos pendientes?</h5>
            <p className="text-xs text-[#6b645c]">Gestioná las cuentas corrientes de proveedores y clientes con registro de pagos en un solo lugar</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onNavigateToCuentas) onNavigateToCuentas();
            else navigate('/cuentas-corrientes');
          }}
          className="px-4 py-2 bg-[#8b7355] hover:bg-[#705b42] text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <span>Ir a Cuentas Corrientes</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
};

export default Dashboard;
