import React, { useState, useMemo } from 'react';
import { calculateSummaryByUnit, getAvailableYears, parseCurrency } from '../utils/calculations';
import type { Transaction } from '../utils/calculations';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers, 
  Calendar,
  WalletCards,
  ArrowRight,
  ArrowUpDown,
  Search,
  Users,
  Building2,
  CreditCard,
  Tag,
  FileSpreadsheet
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

// Date parser helper to sort by date (newest first)
const parseDateToTimestamp = (fechaStr?: string): number => {
  if (!fechaStr) return 0;
  if (fechaStr.includes('/')) {
    const parts = fechaStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10) || 1;
      const m = (parseInt(parts[1], 10) || 1) - 1;
      const y = parseInt(parts[2], 10) || 0;
      return new Date(y, m, d).getTime();
    }
  }
  const t = new Date(fechaStr).getTime();
  return isNaN(t) ? 0 : t;
};

const getCuentaBadgeClass = (cuenta?: string) => {
  const c = cuenta?.toUpperCase() || '';
  if (c.includes('BANCO')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (c.includes('EFECTIVO')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (c.includes('PENDIENTE')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (c.includes('MERCADO')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
  return 'bg-[#f4ebd8] text-[#8b7355] border-[#e0d6c8]';
};

const getSubactividadBadgeClass = (sub?: string) => {
  const s = sub?.toUpperCase() || '';
  if (s.includes('TAMBO')) return 'bg-amber-100 text-amber-900 border-amber-300';
  if (s.includes('QUESERIA') || s.includes('QUESERÍA')) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  if (s.includes('RECRIA') || s.includes('RECRÍA')) return 'bg-sky-100 text-sky-900 border-sky-300';
  return 'bg-stone-100 text-stone-700 border-stone-200';
};

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigateToCuentas }) => {
  const navigate = useNavigate();

  // Tab State: 'resumen' or 'ingresos/egresos'
  const [activeTab, setActiveTab] = useState<'resumen' | 'ingresos/egresos'>('resumen');

  // Sub-controls for 'ingresos/egresos' tab
  const [viewMode, setViewMode] = useState<'todos' | 'ingresos' | 'egresos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState('TODOS');
  const [ingresosDisplayLimit, setIngresosDisplayLimit] = useState(10);
  const [egresosDisplayLimit, setEgresosDisplayLimit] = useState(10);

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

  // Overall calculations for Executive Summary
  const summary = useMemo(() => calculateSummaryByUnit(filteredData), [filteredData]);
  const units = ['TAMBO', 'RECRIA', 'QUESERIA', 'COMUN'] as const;

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

  // Chart data for Unit Comparison
  const unitChartData = useMemo(() => {
    return units.map(unit => ({
      unidad: unit,
      Ingresos: summary[unit].ingresos,
      Egresos: summary[unit].egresos,
      Resultado: summary[unit].resultado
    }));
  }, [summary]);

  // --- Specific Calculations for the "ingresos/egresos" Tab ---
  const ingresosList = useMemo(() => {
    return filteredData
      .filter(item => parseCurrency(item.Ingresos) > 0)
      .sort((a, b) => parseDateToTimestamp(b.Fecha) - parseDateToTimestamp(a.Fecha));
  }, [filteredData]);

  const egresosList = useMemo(() => {
    return filteredData
      .filter(item => parseCurrency(item.Egresos) > 0)
      .sort((a, b) => parseDateToTimestamp(b.Fecha) - parseDateToTimestamp(a.Fecha));
  }, [filteredData]);

  const countIngresos = ingresosList.length;
  const countEgresos = egresosList.length;
  const avgIngreso = countIngresos > 0 ? totalIngresos / countIngresos : 0;
  const avgEgreso = countEgresos > 0 ? totalEgresos / countEgresos : 0;

  // Breakdown by Rubro for Ingresos
  const ingresosByRubro = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    ingresosList.forEach(row => {
      const rubro = row.Rubro?.trim() || 'Sin Rubro';
      const amt = parseCurrency(row.Ingresos);
      if (!map[rubro]) map[rubro] = { total: 0, count: 0 };
      map[rubro].total += amt;
      map[rubro].count += 1;
    });
    return Object.entries(map)
      .map(([name, stat]) => ({
        name,
        total: stat.total,
        count: stat.count,
        pct: totalIngresos > 0 ? (stat.total / totalIngresos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [ingresosList, totalIngresos]);

  // Breakdown by Rubro for Egresos
  const egresosByRubro = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    egresosList.forEach(row => {
      const rubro = row.Rubro?.trim() || 'Sin Rubro';
      const amt = parseCurrency(row.Egresos);
      if (!map[rubro]) map[rubro] = { total: 0, count: 0 };
      map[rubro].total += amt;
      map[rubro].count += 1;
    });
    return Object.entries(map)
      .map(([name, stat]) => ({
        name,
        total: stat.total,
        count: stat.count,
        pct: totalEgresos > 0 ? (stat.total / totalEgresos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [egresosList, totalEgresos]);

  // Top Clientes
  const topClientes = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    ingresosList.forEach(row => {
      const cliente = row['Prov/Cliente']?.trim() || 'Consumidor Final / Sin Identificar';
      const amt = parseCurrency(row.Ingresos);
      if (!map[cliente]) map[cliente] = { total: 0, count: 0 };
      map[cliente].total += amt;
      map[cliente].count += 1;
    });
    return Object.entries(map)
      .map(([name, stat]) => ({
        name,
        total: stat.total,
        count: stat.count,
        pct: totalIngresos > 0 ? (stat.total / totalIngresos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [ingresosList, totalIngresos]);

  // Top Proveedores
  const topProveedores = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    egresosList.forEach(row => {
      const prov = row['Prov/Cliente']?.trim() || 'Sin Identificar';
      const amt = parseCurrency(row.Egresos);
      if (!map[prov]) map[prov] = { total: 0, count: 0 };
      map[prov].total += amt;
      map[prov].count += 1;
    });
    return Object.entries(map)
      .map(([name, stat]) => ({
        name,
        total: stat.total,
        count: stat.count,
        pct: totalEgresos > 0 ? (stat.total / totalEgresos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [egresosList, totalEgresos]);

  // Ingresos by Cuenta / Medio de Cobro
  const ingresosByCuenta = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    ingresosList.forEach(row => {
      const cuenta = row.Cuenta?.trim() || 'Sin Especificar';
      const amt = parseCurrency(row.Ingresos);
      if (!map[cuenta]) map[cuenta] = { total: 0, count: 0 };
      map[cuenta].total += amt;
      map[cuenta].count += 1;
    });
    return Object.entries(map)
      .map(([name, stat]) => ({
        name,
        total: stat.total,
        count: stat.count,
        pct: totalIngresos > 0 ? (stat.total / totalIngresos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [ingresosList, totalIngresos]);

  // Egresos by Subactividad / Sector
  const egresosBySubactividad = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    egresosList.forEach(row => {
      const sub = row.Subactividad?.trim() || 'COMUN';
      const amt = parseCurrency(row.Egresos);
      if (!map[sub]) map[sub] = { total: 0, count: 0 };
      map[sub].total += amt;
      map[sub].count += 1;
    });
    return Object.entries(map)
      .map(([name, stat]) => ({
        name,
        total: stat.total,
        count: stat.count,
        pct: totalEgresos > 0 ? (stat.total / totalEgresos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [egresosList, totalEgresos]);

  // Distinct Rubros for Filter
  const availableRubros = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach(d => {
      if (d.Rubro?.trim()) set.add(d.Rubro.trim());
    });
    return Array.from(set).sort();
  }, [filteredData]);

  // Clean, Simplified Movements Feeds
  const filteredIngresosFeed = useMemo(() => {
    return ingresosList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item['Prov/Cliente']?.toLowerCase().includes(q) ||
        item.Rubro?.toLowerCase().includes(q) ||
        item['Subrubro/Producto']?.toLowerCase().includes(q) ||
        item.Observaciones?.toLowerCase().includes(q) ||
        item.Cuenta?.toLowerCase().includes(q);

      const matchRubro = rubroFilter === 'TODOS' || item.Rubro?.trim() === rubroFilter;
      return matchSearch && matchRubro;
    });
  }, [ingresosList, searchQuery, rubroFilter]);

  const filteredEgresosFeed = useMemo(() => {
    return egresosList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item['Prov/Cliente']?.toLowerCase().includes(q) ||
        item.Rubro?.toLowerCase().includes(q) ||
        item['Subrubro/Producto']?.toLowerCase().includes(q) ||
        item.Observaciones?.toLowerCase().includes(q) ||
        item.Subactividad?.toLowerCase().includes(q);

      const matchRubro = rubroFilter === 'TODOS' || item.Rubro?.trim() === rubroFilter;
      return matchSearch && matchRubro;
    });
  }, [egresosList, searchQuery, rubroFilter]);

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

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-[#e0d6c8] bg-white/70 p-1.5 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'resumen'
              ? 'bg-[#8b7355] text-white shadow-xs'
              : 'text-[#6b645c] hover:text-[#2b2824] hover:bg-[#f4ebd8]/50'
          }`}
        >
          <Layers size={15} />
          <span>Resumen General</span>
        </button>

        <button
          onClick={() => setActiveTab('ingresos/egresos')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'ingresos/egresos'
              ? 'bg-[#8b7355] text-white shadow-xs'
              : 'text-[#6b645c] hover:text-[#2b2824] hover:bg-[#f4ebd8]/50'
          }`}
        >
          <ArrowUpDown size={15} />
          <span>ingresos/egresos</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RESUMEN GENERAL (Original Dashboard View)                          */}
      {/* ========================================================================= */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INGRESOS / EGRESOS (Clean & Simplified Summary View)              */}
      {/* ========================================================================= */}
      {activeTab === 'ingresos/egresos' && (
        <div className="space-y-6">
          
          {/* Top KPI Summary Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            
            {/* Ingresos Card */}
            <div className="bg-white/95 p-4 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Ingresos</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                {formatCurrency(totalIngresos)}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[#6b645c] mt-2 pt-2 border-t border-emerald-50">
                <span>{countIngresos} cobros registrados</span>
                <span>Promedio: <strong className="text-emerald-800 font-mono">{formatCurrency(avgIngreso)}</strong></span>
              </div>
            </div>

            {/* Egresos Card */}
            <div className="bg-white/95 p-4 rounded-xl border border-rose-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total Egresos</span>
                <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                  <ArrowDownRight size={16} />
                </span>
              </div>
              <p className="text-2xl font-black text-rose-700 mt-2 font-mono">
                {formatCurrency(totalEgresos)}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[#6b645c] mt-2 pt-2 border-t border-rose-50">
                <span>{countEgresos} pagos / costos</span>
                <span>Promedio: <strong className="text-rose-800 font-mono">{formatCurrency(avgEgreso)}</strong></span>
              </div>
            </div>

            {/* Balance Neto */}
            <div className={`bg-white/95 p-4 rounded-xl border ${resultadoNeto >= 0 ? 'border-amber-300' : 'border-rose-300'} shadow-sm relative overflow-hidden`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2b2824] uppercase tracking-wider">Balance Operativo</span>
                <span className={`p-1.5 rounded-lg ${resultadoNeto >= 0 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'}`}>
                  <DollarSign size={16} />
                </span>
              </div>
              <p className={`text-2xl font-black mt-2 font-mono ${resultadoNeto >= 0 ? 'text-amber-950' : 'text-rose-700'}`}>
                {formatCurrency(resultadoNeto)}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[#6b645c] mt-2 pt-2 border-t border-[#f4ebd8]">
                <span>Margen sobre ingresos</span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${resultadoNeto >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {margenOperativo}%
                </span>
              </div>
            </div>

          </div>

          {/* Controls Bar: Search, Rubro Filter, and View Mode Toggle */}
          <div className="bg-white/95 p-3.5 sm:p-4 rounded-xl border border-[#e0d6c8] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input & Rubro Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7355]" />
                <input
                  type="text"
                  placeholder="Buscar cliente, proveedor, rubro o detalle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[#faf9f6] border border-[#e0d6c8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8b7355] text-[#2b2824]"
                />
              </div>

              <select
                value={rubroFilter}
                onChange={(e) => setRubroFilter(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-[#faf9f6] border border-[#e0d6c8] rounded-lg font-medium text-[#2b2824] focus:outline-none focus:ring-1 focus:ring-[#8b7355]"
              >
                <option value="TODOS">Todos los rubros</option>
                {availableRubros.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-[#f4ebd8]/60 p-1 rounded-lg self-center sm:self-auto">
              <button
                onClick={() => setViewMode('todos')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'todos'
                    ? 'bg-white text-[#2b2824] shadow-xs'
                    : 'text-[#6b645c] hover:text-[#2b2824]'
                }`}
              >
                Ambos (Comparativo)
              </button>
              <button
                onClick={() => setViewMode('ingresos')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'ingresos'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[#6b645c] hover:text-emerald-700'
                }`}
              >
                Solo Ingresos
              </button>
              <button
                onClick={() => setViewMode('egresos')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'egresos'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-[#6b645c] hover:text-rose-700'
                }`}
              >
                Solo Egresos
              </button>
            </div>

          </div>

          {/* Main 2-Column or Single-Column Layout */}
          <div className={`grid grid-cols-1 ${viewMode === 'todos' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
            
            {/* ========================================================================= */}
            {/* SECCIÓN RESUMEN DE INGRESOS                                               */}
            {/* ========================================================================= */}
            {(viewMode === 'todos' || viewMode === 'ingresos') && (
              <div className="space-y-4">
                
                {/* Column Section Title */}
                <div className="bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowUpRight size={18} />
                    <h4 className="font-bold text-sm sm:text-base">Resumen de Ingresos</h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                    {formatCurrency(totalIngresos)}
                  </span>
                </div>

                {/* 1. Ingresos por Rubro */}
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] p-4 shadow-sm">
                  <h5 className="text-xs font-bold text-[#6b645c] uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <Tag size={13} className="text-emerald-700" />
                    <span>Facturación por Rubro</span>
                  </h5>
                  
                  {ingresosByRubro.length === 0 ? (
                    <p className="text-xs text-[#8c827a] italic py-2">No hay ingresos registrados en este período.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {ingresosByRubro.map((item) => (
                        <div key={item.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#2b2824] truncate pr-2">{item.name}</span>
                            <div className="flex items-center space-x-2 whitespace-nowrap">
                              <span className="text-[11px] text-[#6b645c] font-medium">{item.count} ops</span>
                              <span className="font-mono font-bold text-emerald-800">{formatCurrency(item.total)}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded">
                                {item.pct.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-[#f4ebd8]/70 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(2, item.pct))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Top Clientes */}
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] p-4 shadow-sm">
                  <h5 className="text-xs font-bold text-[#6b645c] uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <Users size={13} className="text-emerald-700" />
                    <span>Principales Clientes y Destinos</span>
                  </h5>

                  {topClientes.length === 0 ? (
                    <p className="text-xs text-[#8c827a] italic py-2">No hay registros de clientes.</p>
                  ) : (
                    <div className="divide-y divide-[#e0d6c8]/50">
                      {topClientes.slice(0, 5).map((cli, idx) => (
                        <div key={cli.name} className="py-2 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-[#2b2824] truncate">{cli.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 whitespace-nowrap">
                            <span className="text-[11px] text-[#6b645c]">{cli.count} vtas</span>
                            <span className="font-mono font-bold text-emerald-800">{formatCurrency(cli.total)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Distribución por Medio de Cobro / Cuenta */}
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] p-4 shadow-sm">
                  <h5 className="text-xs font-bold text-[#6b645c] uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                    <CreditCard size={13} className="text-emerald-700" />
                    <span>Cobros por Medio / Cuenta</span>
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ingresosByCuenta.map(c => (
                      <div key={c.name} className="p-2.5 bg-[#faf9f6] rounded-lg border border-[#e0d6c8]/70">
                        <span className="text-[11px] font-bold text-[#2b2824] block truncate">{c.name}</span>
                        <p className="text-xs font-bold font-mono text-emerald-800 mt-1">{formatCurrency(c.total)}</p>
                        <span className="text-[10px] text-[#6b645c]">{c.count} registros ({c.pct.toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Movimientos Resumidos de Ingresos (Clean List) */}
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#e0d6c8] bg-[#fdfdfc] flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-[#2b2824] uppercase tracking-wider">Movimientos de Ingreso</h5>
                      <p className="text-[11px] text-[#6b645c]">Registro simplificado de cobros</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                      {filteredIngresosFeed.length} operaciones
                    </span>
                  </div>

                  {filteredIngresosFeed.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8c827a] italic">
                      No se encontraron ingresos con los filtros aplicados.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e0d6c8]/60">
                      {filteredIngresosFeed.slice(0, ingresosDisplayLimit).map((item, idx) => (
                        <div key={item.id || idx} className="p-3 hover:bg-[#faf9f6] transition-colors flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono font-bold text-[#8b7355] bg-[#f4ebd8] px-1.5 py-0.5 rounded">
                                {item.Fecha}
                              </span>
                              <span className="font-bold text-xs text-[#2b2824] truncate">
                                {item['Prov/Cliente'] || 'Cliente'}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${getCuentaBadgeClass(item.Cuenta)}`}>
                                {item.Cuenta || 'N/A'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-[11px] text-[#6b645c] mt-0.5 truncate">
                              <span className="font-medium text-[#4a453e]">{item.Rubro || 'Sin Rubro'}</span>
                              {item['Subrubro/Producto'] && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{item['Subrubro/Producto']}</span>
                                </>
                              )}
                              {item.Observaciones && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-[#8c827a] truncate max-w-[140px] sm:max-w-[200px]">{item.Observaciones}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right whitespace-nowrap">
                            <span className="font-mono font-bold text-sm text-emerald-700">
                              +{formatCurrency(parseCurrency(item.Ingresos))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {filteredIngresosFeed.length > ingresosDisplayLimit && (
                    <div className="p-2.5 bg-[#faf9f6] border-t border-[#e0d6c8]/60 text-center">
                      <button
                        onClick={() => setIngresosDisplayLimit(prev => prev + 15)}
                        className="text-xs font-bold text-[#8b7355] hover:text-[#705b42] transition-colors"
                      >
                        Mostrar más ({filteredIngresosFeed.length - ingresosDisplayLimit} restantes)
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* SECCIÓN RESUMEN DE EGRESOS                                                */}
            {/* ========================================================================= */}
            {(viewMode === 'todos' || viewMode === 'egresos') && (
              <div className="space-y-4">
                
                {/* Column Section Title */}
                <div className="bg-rose-700 text-white px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowDownRight size={18} />
                    <h4 className="font-bold text-sm sm:text-base">Resumen de Egresos</h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                    {formatCurrency(totalEgresos)}
                  </span>
                </div>

                {/* 1. Egresos por Rubro */}
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] p-4 shadow-sm">
                  <h5 className="text-xs font-bold text-[#6b645c] uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <Tag size={13} className="text-rose-700" />
                    <span>Costos por Rubro de Gasto</span>
                  </h5>
                  
                  {egresosByRubro.length === 0 ? (
                    <p className="text-xs text-[#8c827a] italic py-2">No hay egresos registrados en este período.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {egresosByRubro.map((item) => (
                        <div key={item.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#2b2824] truncate pr-2">{item.name}</span>
                            <div className="flex items-center space-x-2 whitespace-nowrap">
                              <span className="text-[11px] text-[#6b645c] font-medium">{item.count} ops</span>
                              <span className="font-mono font-bold text-rose-800">{formatCurrency(item.total)}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded">
                                {item.pct.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-[#f4ebd8]/70 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-rose-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(2, item.pct))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Top Proveedores */}
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] p-4 shadow-sm">
                  <h5 className="text-xs font-bold text-[#6b645c] uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <Building2 size={13} className="text-rose-700" />
                    <span>Principales Proveedores</span>
                  </h5>

                  {topProveedores.length === 0 ? (
                    <p className="text-xs text-[#8c827a] italic py-2">No hay registros de proveedores.</p>
                  ) : (
                    <div className="divide-y divide-[#e0d6c8]/50">
                      {topProveedores.slice(0, 5).map((prov, idx) => (
                        <div key={prov.name} className="py-2 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-[#2b2824] truncate">{prov.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 whitespace-nowrap">
                            <span className="text-[11px] text-[#6b645c]">{prov.count} pagos</span>
                            <span className="font-mono font-bold text-rose-800">{formatCurrency(prov.total)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Distribución por Unidad de Negocio (Sector) */}
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] p-4 shadow-sm">
                  <h5 className="text-xs font-bold text-[#6b645c] uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                    <Layers size={13} className="text-rose-700" />
                    <span>Egresos por Sector Productivo</span>
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {egresosBySubactividad.map(s => (
                      <div key={s.name} className="p-2.5 bg-[#faf9f6] rounded-lg border border-[#e0d6c8]/70">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block mb-1 ${getSubactividadBadgeClass(s.name)}`}>
                          {s.name}
                        </span>
                        <p className="text-xs font-bold font-mono text-rose-800">{formatCurrency(s.total)}</p>
                        <span className="text-[10px] text-[#6b645c]">{s.pct.toFixed(0)}% del total</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Movimientos Resumidos de Egresos (Clean List) */}
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#e0d6c8] bg-[#fdfdfc] flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-[#2b2824] uppercase tracking-wider">Movimientos de Egreso</h5>
                      <p className="text-[11px] text-[#6b645c]">Registro simplificado de gastos</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-800 rounded border border-rose-200">
                      {filteredEgresosFeed.length} gastos
                    </span>
                  </div>

                  {filteredEgresosFeed.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8c827a] italic">
                      No se encontraron egresos con los filtros aplicados.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e0d6c8]/60">
                      {filteredEgresosFeed.slice(0, egresosDisplayLimit).map((item, idx) => (
                        <div key={item.id || idx} className="p-3 hover:bg-[#faf9f6] transition-colors flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono font-bold text-[#8b7355] bg-[#f4ebd8] px-1.5 py-0.5 rounded">
                                {item.Fecha}
                              </span>
                              <span className="font-bold text-xs text-[#2b2824] truncate">
                                {item['Prov/Cliente'] || 'Proveedor'}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${getSubactividadBadgeClass(item.Subactividad)}`}>
                                {item.Subactividad || 'COMUN'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-[11px] text-[#6b645c] mt-0.5 truncate">
                              <span className="font-medium text-[#4a453e]">{item.Rubro || 'Sin Rubro'}</span>
                              {item['Subrubro/Producto'] && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{item['Subrubro/Producto']}</span>
                                </>
                              )}
                              {item.Observaciones && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-[#8c827a] truncate max-w-[140px] sm:max-w-[200px]">{item.Observaciones}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right whitespace-nowrap">
                            <span className="font-mono font-bold text-sm text-rose-700">
                              -{formatCurrency(parseCurrency(item.Egresos))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {filteredEgresosFeed.length > egresosDisplayLimit && (
                    <div className="p-2.5 bg-[#faf9f6] border-t border-[#e0d6c8]/60 text-center">
                      <button
                        onClick={() => setEgresosDisplayLimit(prev => prev + 15)}
                        className="text-xs font-bold text-[#8b7355] hover:text-[#705b42] transition-colors"
                      >
                        Mostrar más ({filteredEgresosFeed.length - egresosDisplayLimit} restantes)
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* Bottom helper strip linking to full raw data table if user needs granular spreadsheet editing */}
          <div className="p-3.5 bg-[#faf9f6] rounded-xl border border-[#e0d6c8] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6b645c]">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet size={16} className="text-[#8b7355]" />
              <span>¿Necesitas editar registros celda por celda o cargar detalle de quesos?</span>
            </div>
            <button
              onClick={() => navigate('/datos')}
              className="text-[#8b7355] font-bold hover:underline flex items-center space-x-1"
            >
              <span>Abrir Movimientos (Base de Datos)</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default Dashboard;
