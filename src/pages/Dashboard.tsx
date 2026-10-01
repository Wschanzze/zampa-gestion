import React, { useState, useMemo, useEffect } from 'react';
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
  ArrowUp,
  ArrowDown,
  Layers, 
  Calendar,
  CalendarRange,
  WalletCards,
  ArrowRight,
  ArrowUpDown,
  Search,
  CreditCard,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RotateCcw
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

// Converts any date format ('DD/MM/YYYY', 'D/M/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY') into standardized 'YYYY-MM-DD'
const parseDateToComparable = (fechaStr?: string): string => {
  if (!fechaStr) return '';
  const str = fechaStr.trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].trim().padStart(2, '0');
      const m = parts[1].trim().padStart(2, '0');
      let y = parts[2].trim();
      if (y.length === 2) y = '20' + y;
      return `${y}-${m}-${d}`;
    }
  }
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].trim().length === 4) {
        // YYYY-MM-DD
        const y = parts[0].trim();
        const m = parts[1].trim().padStart(2, '0');
        const d = parts[2].trim().padStart(2, '0');
        return `${y}-${m}-${d}`;
      } else {
        // DD-MM-YYYY
        const d = parts[0].trim().padStart(2, '0');
        const m = parts[1].trim().padStart(2, '0');
        let y = parts[2].trim();
        if (y.length === 2) y = '20' + y;
        return `${y}-${m}-${d}`;
      }
    }
  }
  return str;
};

// Date parser helper to sort chronologically (timestamp in ms at midday)
const parseDateToTimestamp = (fechaStr?: string): number => {
  if (!fechaStr) return 0;
  const iso = parseDateToComparable(fechaStr);
  if (iso && iso.length === 10 && iso[4] === '-' && iso[7] === '-') {
    const [y, m, d] = iso.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d, 12, 0, 0).getTime();
    }
  }
  const t = new Date(fechaStr).getTime();
  return isNaN(t) ? 0 : t;
};

const getPresetRange = (preset: string) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const d = now.getDate();

  const toIso = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  if (preset === 'mes_actual') {
    const start = toIso(y, m, 1);
    const lastDay = new Date(y, m + 1, 0).getDate();
    const end = toIso(y, m, lastDay);
    return { start, end };
  }
  if (preset === 'mes_anterior') {
    const prevMonthDate = new Date(y, m - 1, 1);
    const py = prevMonthDate.getFullYear();
    const pm = prevMonthDate.getMonth();
    const lastDay = new Date(py, pm + 1, 0).getDate();
    return { start: toIso(py, pm, 1), end: toIso(py, pm, lastDay) };
  }
  if (preset === 'ultimos_30') {
    const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { 
      start: toIso(past30.getFullYear(), past30.getMonth(), past30.getDate()), 
      end: toIso(y, m, d) 
    };
  }
  if (preset === 'anio_actual') {
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
  return { start: '', end: '' };
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

// Helper for extracting cheese details from a transaction
interface CheeseDetail {
  tipo: string;
  kg: number;
}

const getCheeseDetails = (item: Transaction): { details: CheeseDetail[]; totalKg: number; isVentaQueso: boolean } => {
  const rubro = (item.Rubro || '').toUpperCase();
  const subrubro = (item['Subrubro/Producto'] || '').toUpperCase();

  const cheeses = [
    { tipo: 'Pecorino', val: Number(item.Pecorino) || 0 },
    { tipo: 'Manchego', val: Number(item.Manchego) || 0 },
    { tipo: 'Saborizado', val: Number(item.Saborizado) || 0 },
    { tipo: 'Ahumado', val: Number(item.Ahumado) || 0 },
    { tipo: 'Provoleta', val: Number(item.Provoleta) || 0 },
    { tipo: 'Ricota', val: Number(item.Ricota) || 0 },
  ];

  const active = cheeses.filter(c => c.val > 0).map(c => ({ tipo: c.tipo, kg: c.val }));
  const sum = active.reduce((acc, c) => acc + c.kg, 0);
  const cant = Number(item.Cantidades) || 0;
  const total = sum > 0 ? sum : cant;

  const isVentaQueso = rubro.includes('QUESO') || subrubro.includes('QUESO') || sum > 0 || (cant > 0 && rubro.includes('VENTA'));

  return { details: active, totalKg: total, isVentaQueso };
};

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigateToCuentas }) => {
  const navigate = useNavigate();

  // Tab State: 'resumen' or 'ingresos/egresos'
  const [activeTab, setActiveTab] = useState<'resumen' | 'ingresos/egresos'>('resumen');

  // Sub-controls for 'ingresos/egresos' tab
  const [viewMode, setViewMode] = useState<'todos' | 'ingresos' | 'egresos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState('TODOS');

  // Date Range Filter States
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string>('todos');

  // Pagination States (independent for Ingresos and Egresos)
  const [ingresosPage, setIngresosPage] = useState(1);
  const [ingresosPerPage, setIngresosPerPage] = useState(10);
  const [egresosPage, setEgresosPage] = useState(1);
  const [egresosPerPage, setEgresosPerPage] = useState(10);

  // Sorting order for movements list (default 'desc' for most recent first)
  const [ingresosSortOrder, setIngresosSortOrder] = useState<'desc' | 'asc'>('desc');
  const [egresosSortOrder, setEgresosSortOrder] = useState<'desc' | 'asc'>('desc');

  const availableYears = useMemo(() => getAvailableYears(data), [data]);
  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || 'TODOS');

  // Reset pagination whenever any filter changes
  useEffect(() => {
    setIngresosPage(1);
    setEgresosPage(1);
  }, [searchQuery, rubroFilter, fechaDesde, fechaHasta, selectedYear, viewMode, ingresosSortOrder, egresosSortOrder]);

  // Handle Preset Clicks
  const handleApplyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === 'todos') {
      setFechaDesde('');
      setFechaHasta('');
    } else {
      const range = getPresetRange(presetKey);
      setFechaDesde(range.start);
      setFechaHasta(range.end);
    }
  };

  // Filter data by selected year for Executive Summary
  const filteredData = useMemo(() => {
    if (selectedYear === 'TODOS') return data;
    return data.filter(d => {
      const comparable = parseDateToComparable(d.Fecha);
      if (comparable && comparable.length >= 4) {
        return comparable.substring(0, 4) === selectedYear;
      }
      return false;
    });
  }, [data, selectedYear]);

  // Filtered data specifically for 'ingresos/egresos' tab (incorporating date range filter)
  const tabData = useMemo(() => {
    if (!fechaDesde && !fechaHasta) return filteredData;
    return filteredData.filter(row => {
      const dStr = parseDateToComparable(row.Fecha);
      if (!dStr) return true;
      if (fechaDesde && dStr < fechaDesde) return false;
      if (fechaHasta && dStr > fechaHasta) return false;
      return true;
    });
  }, [filteredData, fechaDesde, fechaHasta]);

  // Overall calculations for Executive Summary (Tab 1)
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

  // --- Specific Calculations for the "ingresos/egresos" Tab (Calculated from tabData) ---
  const ingresosList = useMemo(() => {
    return tabData
      .filter(item => parseCurrency(item.Ingresos) > 0)
      .sort((a, b) => parseDateToTimestamp(b.Fecha) - parseDateToTimestamp(a.Fecha));
  }, [tabData]);

  const egresosList = useMemo(() => {
    return tabData
      .filter(item => parseCurrency(item.Egresos) > 0)
      .sort((a, b) => parseDateToTimestamp(b.Fecha) - parseDateToTimestamp(a.Fecha));
  }, [tabData]);

  // Dynamic totals for Tab 2 reflecting date range filters
  const tabTotalIngresos = useMemo(() => {
    return ingresosList.reduce((acc, r) => acc + parseCurrency(r.Ingresos), 0);
  }, [ingresosList]);

  const tabTotalEgresos = useMemo(() => {
    return egresosList.reduce((acc, r) => acc + parseCurrency(r.Egresos), 0);
  }, [egresosList]);

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
        pct: tabTotalIngresos > 0 ? (stat.total / tabTotalIngresos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [ingresosList, tabTotalIngresos]);

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
        pct: tabTotalEgresos > 0 ? (stat.total / tabTotalEgresos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [egresosList, tabTotalEgresos]);

  // Distinct Rubros for Dropdown Filter
  const availableRubros = useMemo(() => {
    const set = new Set<string>();
    tabData.forEach(d => {
      if (d.Rubro?.trim()) set.add(d.Rubro.trim());
    });
    return Array.from(set).sort();
  }, [tabData]);

  // Clean, Simplified Movements Feeds (sorted strictly by date with order toggle)
  const filteredIngresosFeed = useMemo(() => {
    const list = ingresosList.filter(item => {
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

    return [...list].sort((a, b) => {
      const timeA = parseDateToTimestamp(a.Fecha);
      const timeB = parseDateToTimestamp(b.Fecha);
      if (timeA !== timeB) {
        return ingresosSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [ingresosList, searchQuery, rubroFilter, ingresosSortOrder]);

  const filteredEgresosFeed = useMemo(() => {
    const list = egresosList.filter(item => {
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

    return [...list].sort((a, b) => {
      const timeA = parseDateToTimestamp(a.Fecha);
      const timeB = parseDateToTimestamp(b.Fecha);
      if (timeA !== timeB) {
        return egresosSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [egresosList, searchQuery, rubroFilter, egresosSortOrder]);

  // Paginated Slices
  const totalIngresosPages = Math.max(1, Math.ceil(filteredIngresosFeed.length / ingresosPerPage));
  const paginatedIngresos = useMemo(() => {
    const start = (ingresosPage - 1) * ingresosPerPage;
    return filteredIngresosFeed.slice(start, start + ingresosPerPage);
  }, [filteredIngresosFeed, ingresosPage, ingresosPerPage]);

  const totalEgresosPages = Math.max(1, Math.ceil(filteredEgresosFeed.length / egresosPerPage));
  const paginatedEgresos = useMemo(() => {
    const start = (egresosPage - 1) * egresosPerPage;
    return filteredEgresosFeed.slice(start, start + egresosPerPage);
  }, [filteredEgresosFeed, egresosPage, egresosPerPage]);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header with Title and Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 p-3.5 sm:p-5 rounded-xl border border-[#e0d6c8] shadow-sm">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#2b2824] flex items-center space-x-2">
            <Layers size={18} className="text-[#8b7355]" />
            <span>Panel Ejecutivo y Rendimiento Operativo</span>
          </h3>
          <p className="text-xs text-[#6b645c] mt-0.5">Indicadores financieros, balance por actividades y principales métricas de negocio</p>
        </div>

        <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-1.5">
            <Calendar size={15} className="text-[#8b7355]" />
            <label className="text-xs font-semibold text-[#6b645c] uppercase">Período:</label>
          </div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-[#e0d6c8] rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-bold text-[#2b2824] bg-[#faf9f6] focus:ring-1 focus:ring-[#8b7355] outline-none"
          >
            <option value="TODOS">Histórico Completo</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Año {yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-[#e0d6c8] bg-white/70 p-1.5 rounded-xl shadow-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex-1 sm:flex-initial ${
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
          className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex-1 sm:flex-initial ${
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
        <div className="space-y-4 sm:space-y-6">
          
          {/* Date Range & Quick Presets Filter Box */}
          <div className="bg-white/95 p-3 sm:p-4 rounded-xl border border-[#e0d6c8] shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e0d6c8]/60 pb-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#2b2824]">
                <CalendarRange size={16} className="text-[#8b7355]" />
                <span>Rango de Fecha</span>
                {(fechaDesde || fechaHasta) && (
                  <span className="text-[10px] bg-[#f4ebd8] text-[#8b7355] font-bold px-2 py-0.5 rounded-full border border-[#e0d6c8]">
                    Activo
                  </span>
                )}
              </div>
              
              {/* Quick Presets Buttons (Scrollable or wrapped cleanly on mobile) */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs">
                <span className="text-[10px] sm:text-[11px] text-[#6b645c] font-semibold mr-0.5">Rápido:</span>
                {[
                  { id: 'todos', label: 'Todo' },
                  { id: 'mes_actual', label: 'Este mes' },
                  { id: 'ultimos_30', label: '30 días' },
                  { id: 'mes_anterior', label: 'Mes ant.' },
                  { id: 'anio_actual', label: 'Año actual' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPreset(p.id)}
                    className={`px-2 py-1 rounded text-[10px] sm:text-[11px] font-bold transition-all ${
                      activePreset === p.id
                        ? 'bg-[#8b7355] text-white shadow-xs'
                        : 'bg-[#f4ebd8]/60 text-[#6b645c] hover:bg-[#f4ebd8] hover:text-[#2b2824]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Pickers (Desde / Hasta) responsive grid */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div className="flex items-center space-x-1.5 bg-[#faf9f6] border border-[#e0d6c8] rounded-lg px-2.5 py-1.5">
                  <label className="text-[11px] font-semibold text-[#6b645c] shrink-0">Desde:</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => {
                      setFechaDesde(e.target.value);
                      setActivePreset('custom');
                    }}
                    className="w-full text-xs bg-transparent text-[#2b2824] font-medium outline-none"
                  />
                </div>

                <div className="flex items-center space-x-1.5 bg-[#faf9f6] border border-[#e0d6c8] rounded-lg px-2.5 py-1.5">
                  <label className="text-[11px] font-semibold text-[#6b645c] shrink-0">Hasta:</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => {
                      setFechaHasta(e.target.value);
                      setActivePreset('custom');
                    }}
                    className="w-full text-xs bg-transparent text-[#2b2824] font-medium outline-none"
                  />
                </div>
              </div>

              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => handleApplyPreset('todos')}
                  className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 border border-rose-200 rounded-lg transition-colors w-full sm:w-auto"
                  title="Restablecer fechas"
                >
                  <RotateCcw size={12} />
                  <span>Limpiar fechas</span>
                </button>
              )}
            </div>
          </div>


          {/* Controls Bar: Search, Rubro Filter, and Mobile Segmented View Mode Toggle */}
          <div className="bg-white/95 p-3 sm:p-4 rounded-xl border border-[#e0d6c8] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
            
            {/* Search Input & Rubro Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7355]" />
                <input
                  type="text"
                  placeholder="Buscar cliente, proveedor, queso..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[#faf9f6] border border-[#e0d6c8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8b7355] text-[#2b2824]"
                />
              </div>

              <select
                value={rubroFilter}
                onChange={(e) => setRubroFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm bg-[#faf9f6] border border-[#e0d6c8] rounded-lg font-medium text-[#2b2824] focus:outline-none focus:ring-1 focus:ring-[#8b7355]"
              >
                <option value="TODOS">Todos los rubros ({availableRubros.length})</option>
                {availableRubros.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* View Mode Segmented Control (full width on mobile) */}
            <div className="grid grid-cols-3 w-full md:w-auto bg-[#f4ebd8]/60 p-1 rounded-lg gap-1">
              <button
                onClick={() => setViewMode('todos')}
                className={`py-1.5 px-2 text-[11px] sm:text-xs font-bold rounded-md transition-all text-center truncate ${
                  viewMode === 'todos'
                    ? 'bg-white text-[#2b2824] shadow-xs'
                    : 'text-[#6b645c] hover:text-[#2b2824]'
                }`}
              >
                <span className="sm:hidden">Ambos</span>
                <span className="hidden sm:inline">Ambos (Comparativo)</span>
              </button>
              <button
                onClick={() => setViewMode('ingresos')}
                className={`py-1.5 px-2 text-[11px] sm:text-xs font-bold rounded-md transition-all text-center truncate ${
                  viewMode === 'ingresos'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[#6b645c] hover:text-emerald-700'
                }`}
              >
                Ingresos
              </button>
              <button
                onClick={() => setViewMode('egresos')}
                className={`py-1.5 px-2 text-[11px] sm:text-xs font-bold rounded-md transition-all text-center truncate ${
                  viewMode === 'egresos'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-[#6b645c] hover:text-rose-700'
                }`}
              >
                Egresos
              </button>
            </div>

          </div>

          {/* Main Layout: Paired Rows ensuring identical heights between Ingresos and Egresos */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Row 0: Column Section Titles */}
            <div className={`grid grid-cols-1 ${viewMode === 'todos' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-3 sm:gap-6`}>
              {(viewMode === 'todos' || viewMode === 'ingresos') && (
                <div className="bg-emerald-700 text-white px-3.5 sm:px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowUpRight size={18} />
                    <h4 className="font-bold text-sm sm:text-base">Resumen de Ingresos</h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                    {formatCurrency(tabTotalIngresos)}
                  </span>
                </div>
              )}

              {(viewMode === 'todos' || viewMode === 'egresos') && (
                <div className="bg-rose-700 text-white px-3.5 sm:px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowDownRight size={18} />
                    <h4 className="font-bold text-sm sm:text-base">Resumen de Egresos</h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                    {formatCurrency(tabTotalEgresos)}
                  </span>
                </div>
              )}
            </div>


            {/* Row 3: Cobros por Medio vs Egresos por Sector */}
            <div className={`grid grid-cols-1 ${viewMode === 'todos' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-4 sm:gap-6 items-stretch`}>
              {(viewMode === 'todos' || viewMode === 'ingresos') && (
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] p-3.5 sm:p-4 shadow-sm h-full flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-[#6b645c] uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                      <CreditCard size={13} className="text-emerald-700" />
                      <span>Cobros por Medio / Cuenta</span>
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ingresosByCuenta.map(c => (
                        <div key={c.name} className="p-2 sm:p-2.5 bg-[#faf9f6] rounded-lg border border-[#e0d6c8]/70 flex flex-col justify-between">
                          <span className="text-[11px] font-bold text-[#2b2824] block truncate">{c.name}</span>
                          <p className="text-xs font-bold font-mono text-emerald-800 mt-1">{formatCurrency(c.total)}</p>
                          <span className="text-[10px] text-[#6b645c]">{c.count} reg. ({c.pct.toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(viewMode === 'todos' || viewMode === 'egresos') && (
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] p-3.5 sm:p-4 shadow-sm h-full flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-[#6b645c] uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                      <Layers size={13} className="text-rose-700" />
                      <span>Egresos por Sector Productivo</span>
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {egresosBySubactividad.map(s => (
                        <div key={s.name} className="p-2 sm:p-2.5 bg-[#faf9f6] rounded-lg border border-[#e0d6c8]/70 flex flex-col justify-between">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block mb-1 truncate ${getSubactividadBadgeClass(s.name)}`}>
                            {s.name}
                          </span>
                          <p className="text-xs font-bold font-mono text-rose-800">{formatCurrency(s.total)}</p>
                          <span className="text-[10px] text-[#6b645c]">{s.pct.toFixed(0)}% del total</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Movimientos de Ingreso vs Movimientos de Egreso */}
            <div className={`grid grid-cols-1 ${viewMode === 'todos' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-4 sm:gap-6 items-stretch`}>
              
              {/* MOVIMIENTOS DE INGRESO */}
              {(viewMode === 'todos' || viewMode === 'ingresos') && (
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] shadow-sm overflow-hidden h-full flex flex-col justify-between">
                  <div className="flex-1 flex flex-col">
                    <div className="px-3.5 sm:px-4 py-3 border-b border-[#e0d6c8] bg-[#fdfdfc] flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-[#2b2824] uppercase tracking-wider">Movimientos de Ingreso</h5>
                        <p className="text-[10px] sm:text-[11px] text-[#6b645c]">Registro simplificado ordenado por fecha</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIngresosSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-[#e0d6c8] bg-[#faf9f6] hover:bg-[#f4ebd8] text-[#2b2824] transition-colors"
                          title="Cambiar orden por fecha"
                        >
                          <Calendar size={13} className="text-[#8b7355]" />
                          <span className="text-[11px]">{ingresosSortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}</span>
                          {ingresosSortOrder === 'desc' ? (
                            <ArrowDown size={12} className="text-emerald-700" />
                          ) : (
                            <ArrowUp size={12} className="text-emerald-700" />
                          )}
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                          {filteredIngresosFeed.length} ops
                        </span>
                      </div>
                    </div>

                    {filteredIngresosFeed.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#8c827a] italic my-auto">
                        No se encontraron ingresos con los filtros y fechas seleccionadas.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#e0d6c8]/60 flex-1">
                        {paginatedIngresos.map((item, idx) => {
                          const cheeseInfo = getCheeseDetails(item);

                          return (
                            <div key={item.id || idx} className="p-3 hover:bg-[#faf9f6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className="text-[10px] font-mono font-bold text-[#8b7355] bg-[#f4ebd8] px-1.5 py-0.5 rounded">
                                    {item.Fecha}
                                  </span>
                                  <span className="font-bold text-xs sm:text-sm text-[#2b2824] truncate">
                                    {item['Prov/Cliente'] || 'Cliente'}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${getCuentaBadgeClass(item.Cuenta)}`}>
                                    {item.Cuenta || 'N/A'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6b645c] mt-0.5 truncate">
                                  <span className="font-medium text-[#4a453e]">{item.Rubro || 'Sin Rubro'}</span>
                                  {item['Subrubro/Producto'] && (
                                    <>
                                      <span className="text-[#c4b5a0]">•</span>
                                      <span className="truncate">{item['Subrubro/Producto']}</span>
                                    </>
                                  )}
                                  {item.Observaciones && (
                                    <>
                                      <span className="text-[#c4b5a0]">•</span>
                                      <span className="italic text-[#8c827a] truncate max-w-[200px]">{item.Observaciones}</span>
                                    </>
                                  )}
                                </div>

                                {/* Desglose visual de Venta de Queso si corresponde */}
                                {cheeseInfo.isVentaQueso && (
                                  <div className="mt-2 pt-1.5 border-t border-[#e0d6c8]/60">
                                    {cheeseInfo.details.length > 0 ? (
                                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                        <span className="text-[10px] font-bold text-[#8b7355] uppercase tracking-wider flex items-center gap-1">
                                          🧀 Quesos ({cheeseInfo.totalKg.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg):
                                        </span>
                                        {cheeseInfo.details.map(cd => (
                                          <span 
                                            key={cd.tipo} 
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f4ebd8] text-[#5c4a35] border border-[#e0d6c8]"
                                          >
                                            <span className="text-[#8b7355] mr-1">{cd.tipo}:</span>
                                            <span>{cd.kg.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg</span>
                                          </span>
                                        ))}
                                      </div>
                                    ) : cheeseInfo.totalKg > 0 ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-[#8b7355] uppercase tracking-wider">
                                          🧀 Total vendido:
                                        </span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f4ebd8] text-[#5c4a35] border border-[#e0d6c8]">
                                          {cheeseInfo.totalKg.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between sm:justify-end sm:text-right pt-1.5 sm:pt-0 border-t border-[#e0d6c8]/40 sm:border-0 whitespace-nowrap">
                                <span className="text-[11px] text-[#6b645c] font-semibold sm:hidden">Cobrado:</span>
                                <span className="font-mono font-black text-sm sm:text-base text-emerald-700">
                                  +{formatCurrency(parseCurrency(item.Ingresos))}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Standard Pagination Controls for Ingresos (Mobile Friendly) */}
                  {filteredIngresosFeed.length > 0 && (
                    <div className="px-3 sm:px-4 py-2.5 bg-[#faf9f6] border-t border-[#e0d6c8]/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-[#6b645c]">
                      <div className="flex items-center justify-between w-full sm:w-auto space-x-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px]">Ver:</span>
                          <select
                            value={ingresosPerPage}
                            onChange={(e) => {
                              setIngresosPerPage(Number(e.target.value));
                              setIngresosPage(1);
                            }}
                            className="px-2 py-0.5 bg-white border border-[#e0d6c8] rounded text-xs font-bold text-[#2b2824] outline-none"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                          <span className="text-[11px]">por pág.</span>
                        </div>
                        <span className="sm:hidden text-[11px] text-[#8b7355] font-bold">
                          {filteredIngresosFeed.length} registros
                        </span>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto space-x-3">
                        <span className="text-[11px]">
                          Pág. <strong className="text-[#2b2824]">{ingresosPage}</strong> de <strong className="text-[#2b2824]">{totalIngresosPages}</strong>
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setIngresosPage(prev => Math.max(1, prev - 1))}
                            disabled={ingresosPage === 1}
                            className="p-1.5 rounded-lg border border-[#e0d6c8] bg-white text-[#2b2824] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#f4ebd8]/50"
                            title="Página anterior"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          <button
                            onClick={() => setIngresosPage(prev => Math.min(totalIngresosPages, prev + 1))}
                            disabled={ingresosPage === totalIngresosPages}
                            className="p-1.5 rounded-lg border border-[#e0d6c8] bg-white text-[#2b2824] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#f4ebd8]/50"
                            title="Página siguiente"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MOVIMIENTOS DE EGRESO */}
              {(viewMode === 'todos' || viewMode === 'egresos') && (
                <div className="bg-white/95 rounded-xl border border-[#e0d6c8] shadow-sm overflow-hidden h-full flex flex-col justify-between">
                  <div className="flex-1 flex flex-col">
                    <div className="px-3.5 sm:px-4 py-3 border-b border-[#e0d6c8] bg-[#fdfdfc] flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-[#2b2824] uppercase tracking-wider">Movimientos de Egreso</h5>
                        <p className="text-[10px] sm:text-[11px] text-[#6b645c]">Registro simplificado ordenado por fecha</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEgresosSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-[#e0d6c8] bg-[#faf9f6] hover:bg-[#f4ebd8] text-[#2b2824] transition-colors"
                          title="Cambiar orden por fecha"
                        >
                          <Calendar size={13} className="text-[#8b7355]" />
                          <span className="text-[11px]">{egresosSortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}</span>
                          {egresosSortOrder === 'desc' ? (
                            <ArrowDown size={12} className="text-rose-700" />
                          ) : (
                            <ArrowUp size={12} className="text-rose-700" />
                          )}
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-800 rounded border border-rose-200">
                          {filteredEgresosFeed.length} gastos
                        </span>
                      </div>
                    </div>

                    {filteredEgresosFeed.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#8c827a] italic my-auto">
                        No se encontraron egresos con los filtros y fechas seleccionadas.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#e0d6c8]/60 flex-1">
                        {paginatedEgresos.map((item, idx) => (
                          <div key={item.id || idx} className="p-3 hover:bg-[#faf9f6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="text-[10px] font-mono font-bold text-[#8b7355] bg-[#f4ebd8] px-1.5 py-0.5 rounded">
                                  {item.Fecha}
                                </span>
                                <span className="font-bold text-xs sm:text-sm text-[#2b2824] truncate">
                                  {item['Prov/Cliente'] || 'Proveedor'}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${getSubactividadBadgeClass(item.Subactividad)}`}>
                                  {item.Subactividad || 'COMUN'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6b645c] mt-0.5 truncate">
                                <span className="font-medium text-[#4a453e]">{item.Rubro || 'Sin Rubro'}</span>
                                {item['Subrubro/Producto'] && (
                                  <>
                                    <span className="text-[#c4b5a0]">•</span>
                                    <span className="truncate">{item['Subrubro/Producto']}</span>
                                  </>
                                )}
                                {item.Observaciones && (
                                  <>
                                    <span className="text-[#c4b5a0]">•</span>
                                    <span className="italic text-[#8c827a] truncate max-w-[200px]">{item.Observaciones}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end sm:text-right pt-1.5 sm:pt-0 border-t border-[#e0d6c8]/40 sm:border-0 whitespace-nowrap">
                              <span className="text-[11px] text-[#6b645c] font-semibold sm:hidden">Pagado:</span>
                              <span className="font-mono font-black text-sm sm:text-base text-rose-700">
                                -{formatCurrency(parseCurrency(item.Egresos))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Standard Pagination Controls for Egresos (Mobile Friendly) */}
                  {filteredEgresosFeed.length > 0 && (
                    <div className="px-3 sm:px-4 py-2.5 bg-[#faf9f6] border-t border-[#e0d6c8]/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-[#6b645c]">
                      <div className="flex items-center justify-between w-full sm:w-auto space-x-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px]">Ver:</span>
                          <select
                            value={egresosPerPage}
                            onChange={(e) => {
                              setEgresosPerPage(Number(e.target.value));
                              setEgresosPage(1);
                            }}
                            className="px-2 py-0.5 bg-white border border-[#e0d6c8] rounded text-xs font-bold text-[#2b2824] outline-none"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                          <span className="text-[11px]">por pág.</span>
                        </div>
                        <span className="sm:hidden text-[11px] text-[#8b7355] font-bold">
                          {filteredEgresosFeed.length} registros
                        </span>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto space-x-3">
                        <span className="text-[11px]">
                          Pág. <strong className="text-[#2b2824]">{egresosPage}</strong> de <strong className="text-[#2b2824]">{totalEgresosPages}</strong>
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEgresosPage(prev => Math.max(1, prev - 1))}
                            disabled={egresosPage === 1}
                            className="p-1.5 rounded-lg border border-[#e0d6c8] bg-white text-[#2b2824] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#f4ebd8]/50"
                            title="Página anterior"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          <button
                            onClick={() => setEgresosPage(prev => Math.min(totalEgresosPages, prev + 1))}
                            disabled={egresosPage === totalEgresosPages}
                            className="p-1.5 rounded-lg border border-[#e0d6c8] bg-white text-[#2b2824] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#f4ebd8]/50"
                            title="Página siguiente"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

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
