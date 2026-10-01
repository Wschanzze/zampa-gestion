import React, { useState, useMemo } from 'react';
import { useProduccion } from '../lib/api';
import * as XLSX from 'xlsx';
import { 
  Beaker, 
  Droplets, 
  Scale, 
  Plus, 
  Trash2, 
  Pencil,
  X, 
  Filter, 
  TrendingUp, 
  Calendar,
  Layers,
  Snowflake,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  AlertTriangle,
  Boxes,
  Milk,
  BarChart3,
  Award
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const Produccion = () => {
  const { data, loading, addRecord, updateRecord, deleteRecord } = useProduccion();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  
  // Date filters & quick presets
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVariedad, setSelectedVariedad] = useState('TODAS');
  const [datePreset, setDatePreset] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30' | 'THIS_YEAR'>('ALL');

  // Table sorting & quick search
  const [sortField, setSortField] = useState<'fecha' | 'lote' | 'litros_leche' | 'kg_totales' | 'rendimiento'>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tableSearch, setTableSearch] = useState('');

  const handleSort = (field: 'fecha' | 'lote' | 'litros_leche' | 'kg_totales' | 'rendimiento') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'lote' ? 'asc' : 'desc');
    }
  };

  // Calcular el siguiente lote correlativo basado en los registros numéricos existentes
  const nextSequentialLote = useMemo(() => {
    let max = 0;
    data.forEach(r => {
      if (!r.lote) return;
      const trimmed = String(r.lote).trim();
      if (/^\d+$/.test(trimmed)) {
        const n = parseInt(trimmed, 10);
        if (n > max) max = n;
      }
    });
    return max > 0 ? String(max + 1) : '1';
  }, [data]);

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

  const handleOpenNew = () => {
    setEditingRecordId(null);
    setFormData({
      fecha_elaboracion: new Date().toISOString().split('T')[0],
      lote: nextSequentialLote,
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingRecordId(record.id);
    setFormData({
      fecha_elaboracion: record.fecha_elaboracion,
      lote: String(record.lote || ''),
      litros_leche: Number(record.litros_leche) || 0,
      producto: record.producto || 'SEMIDURO',
      tipo_queso: record.tipo_queso || '',
      kg_totales: Number(record.kg_totales) || 0,
      cantidad_grande: Number(record.cantidad_grande) || 0,
      cantidad_barra: Number(record.cantidad_barra) || 0,
      cantidad_tubo: Number(record.cantidad_tubo) || 0,
      cantidad_chico: Number(record.cantidad_chico) || 0,
      cantidad_otro: Number(record.cantidad_otro) || 0,
      cantidad_camambert: Number(record.cantidad_camambert) || 0,
      cantidad_ricota: Number(record.cantidad_ricota) || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFormData = {
      ...formData,
      lote: String(formData.lote).trim(),
      tipo_queso: formData.tipo_queso ? formData.tipo_queso.trim().toUpperCase() : '',
      producto: formData.producto ? formData.producto.trim().toUpperCase() : 'SEMIDURO'
    };

    let success = false;
    if (editingRecordId) {
      success = await updateRecord(editingRecordId, cleanFormData);
    } else {
      success = await addRecord(cleanFormData);
    }

    if (success) {
      setIsModalOpen(false);
      setEditingRecordId(null);
      setFormData({
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
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value
    }));
  };

  const handlePresetChange = (preset: 'ALL' | 'THIS_MONTH' | 'LAST_30' | 'THIS_YEAR') => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (preset === 'LAST_30') {
      const past30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(formatDate(past30));
      setEndDate(formatDate(today));
    } else if (preset === 'THIS_YEAR') {
      const firstDayYear = new Date(today.getFullYear(), 0, 1);
      setStartDate(formatDate(firstDayYear));
      setEndDate(formatDate(today));
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedVariedad('TODAS');
    setDatePreset('ALL');
  };

  // Unique list of cheese varieties in database
  const availableVariedades = useMemo(() => {
    const set = new Set<string>();
    data.forEach(r => {
      const v = (r.tipo_queso && r.tipo_queso.trim()) || r.producto;
      if (v) set.add(v.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [data]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const rowDate = row.fecha_elaboracion;
      if (startDate && rowDate < startDate) return false;
      if (endDate && rowDate > endDate) return false;
      if (selectedVariedad !== 'TODAS') {
        const v = ((row.tipo_queso && row.tipo_queso.trim()) || row.producto || '').toUpperCase();
        if (v !== selectedVariedad) return false;
      }
      return true;
    });
  }, [data, startDate, endDate, selectedVariedad]);

  // Memoized sorted and searched data for the table
  const sortedData = useMemo(() => {
    let result = filteredData;

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(row => 
        (row.lote && row.lote.toLowerCase().includes(q)) ||
        (row.producto && row.producto.toLowerCase().includes(q)) ||
        (row.tipo_queso && row.tipo_queso.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      if (sortField === 'lote') {
        const res = (a.lote || '').localeCompare(b.lote || '', undefined, { numeric: true, sensitivity: 'base' });
        if (res !== 0) return sortDirection === 'asc' ? res : -res;
        return new Date(b.fecha_elaboracion).getTime() - new Date(a.fecha_elaboracion).getTime();
      }
      if (sortField === 'fecha') {
        const timeA = new Date(a.fecha_elaboracion).getTime() || 0;
        const timeB = new Date(b.fecha_elaboracion).getTime() || 0;
        if (timeA !== timeB) return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        return (a.lote || '').localeCompare(b.lote || '', undefined, { numeric: true, sensitivity: 'base' });
      }
      if (sortField === 'litros_leche') {
        const diff = Number(a.litros_leche || 0) - Number(b.litros_leche || 0);
        return sortDirection === 'asc' ? diff : -diff;
      }
      if (sortField === 'kg_totales') {
        const diff = Number(a.kg_totales || 0) - Number(b.kg_totales || 0);
        return sortDirection === 'asc' ? diff : -diff;
      }
      if (sortField === 'rendimiento') {
        const yieldA = a.rendimiento ? Number(a.rendimiento) : ((a.kg_totales / a.litros_leche) * 100) || 0;
        const yieldB = b.rendimiento ? Number(b.rendimiento) : ((b.kg_totales / b.litros_leche) * 100) || 0;
        const diff = yieldA - yieldB;
        return sortDirection === 'asc' ? diff : -diff;
      }
      return 0;
    });
  }, [filteredData, tableSearch, sortField, sortDirection]);

  // Derived metrics
  const totalLitros = filteredData.reduce((acc, curr) => acc + Number(curr.litros_leche || 0), 0);
  const totalKg = filteredData.reduce((acc, curr) => acc + Number(curr.kg_totales || 0), 0);
  const averageYield = totalLitros > 0 ? (totalKg / totalLitros) * 100 : 0;
  const litrosPorKg = totalKg > 0 ? totalLitros / totalKg : 0;
  const totalLotes = filteredData.length;

  // Total de piezas físicas elaboradas (hormas grandes, barras, tubos, chicos, etc.)
  const totalPiezas = filteredData.reduce((acc, curr) => {
    return acc + 
      (Number(curr.cantidad_grande) || 0) +
      (Number(curr.cantidad_barra) || 0) +
      (Number(curr.cantidad_tubo) || 0) +
      (Number(curr.cantidad_chico) || 0) +
      (Number(curr.cantidad_camambert) || 0) +
      (Number(curr.cantidad_ricota) || 0) +
      (Number(curr.cantidad_otro) || 0);
  }, 0);

  // Desglose de rendimiento y volumen por variedad
  const varietyStats = useMemo(() => {
    const map: Record<string, { variedad: string; producto: string; litros: number; kg: number; lotes: number }> = {};
    
    filteredData.forEach(row => {
      const v = ((row.tipo_queso && row.tipo_queso.trim()) || row.producto || 'SIN ESPECIFICAR').toUpperCase();
      if (!map[v]) {
        map[v] = { variedad: v, producto: row.producto || 'SEMIDURO', litros: 0, kg: 0, lotes: 0 };
      }
      map[v].litros += Number(row.litros_leche || 0);
      map[v].kg += Number(row.kg_totales || 0);
      map[v].lotes += 1;
    });

    return Object.values(map)
      .map(item => ({
        ...item,
        rendimiento: item.litros > 0 ? Number(((item.kg / item.litros) * 100).toFixed(2)) : 0,
        litrosPorKg: item.kg > 0 ? Number((item.litros / item.kg).toFixed(2)) : 0
      }))
      .sort((a, b) => b.kg - a.kg);
  }, [filteredData]);

  // Helper de semáforo de maduración para lotes en cámara
  const getMaduracionInfo = (variedad: string, category: string, dias: number) => {
    const v = (variedad || '').toUpperCase();
    const cat = (category || '').toUpperCase();
    
    let minDias = 30;
    let maxDias = 75;

    if (cat === 'DURO' || v.includes('PECORINO') || v.includes('SARDO') || v.includes('PARMESANO')) {
      minDias = 60;
      maxDias = 150;
    } else if (cat === 'SEMIDURO' || v.includes('MANCHEGO') || v.includes('SABORIZADO') || v.includes('AHUMADO') || v.includes('PROVOLETA')) {
      minDias = 30;
      maxDias = 80;
    } else if (cat === 'BLANDO' || v.includes('CAMEMBERT') || v.includes('BRIE') || v.includes('RICOTA') || v.includes('CUARTIROLO')) {
      minDias = 10;
      maxDias = 35;
    }

    const progreso = Math.min(100, Math.round((dias / minDias) * 100));

    if (dias < minDias) {
      return {
        status: 'madurando' as const,
        label: 'En Maduración',
        diasRestantes: minDias - dias,
        minDias,
        maxDias,
        progreso,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        dotClass: 'bg-amber-500'
      };
    } else if (dias <= maxDias) {
      return {
        status: 'listo' as const,
        label: 'Listo para Despacho',
        diasRestantes: 0,
        minDias,
        maxDias,
        progreso: 100,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-500'
      };
    } else {
      return {
        status: 'prolongado' as const,
        label: 'Maduración Prolongada',
        diasRestantes: 0,
        minDias,
        maxDias,
        progreso: 100,
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        dotClass: 'bg-purple-500'
      };
    }
  };

  // Exportar registros a archivo Excel (.xlsx)
  const exportToExcel = () => {
    if (filteredData.length === 0) {
      alert('No hay registros de producción para exportar con los filtros seleccionados.');
      return;
    }

    const rows = sortedData.map(r => {
      const l = Number(r.litros_leche) || 0;
      const k = Number(r.kg_totales) || 0;
      const rend = r.rendimiento ? Number(r.rendimiento) : (l > 0 ? (k / l) * 100 : 0);
      const lPorKg = k > 0 ? (l / k) : 0;

      return {
        'Lote': r.lote,
        'Fecha Elaboración': r.fecha_elaboracion,
        'Categoría': r.producto,
        'Variedad': r.tipo_queso || '-',
        'Leche (L)': l,
        'Queso (Kg)': k,
        'Rendimiento (%)': Number(rend.toFixed(2)),
        'Consumo (L/Kg)': Number(lPorKg.toFixed(2)),
        'Hormas Grandes': r.cantidad_grande || 0,
        'Hormas Barra': r.cantidad_barra || 0,
        'Hormas Tubo': r.cantidad_tubo || 0,
        'Hormas Chicos': r.cantidad_chico || 0,
        'Camembert': r.cantidad_camambert || 0,
        'Ricota': r.cantidad_ricota || 0,
        'Otros': r.cantidad_otro || 0
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Elaboración');
    
    worksheet['!cols'] = [
      { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
      { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
      { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 12 }, { wch: 10 }, { wch: 10 }
    ];

    const fechaHoy = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Produccion_Quesos_Zampa_${fechaHoy}.xlsx`);
  };

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
      grouped[date].litros += Number(row.litros_leche || 0);
      grouped[date].kg += Number(row.kg_totales || 0);
      grouped[date].lotes += 1;
    });

    return Object.values(grouped).map(day => ({
      fecha: day.fecha,
      Rendimiento: day.litros > 0 ? Number(((day.kg / day.litros) * 100).toFixed(2)) : 0,
      Leche: day.litros,
      Queso: day.kg
    }));
  }, [filteredData]);

  // Aggregation for Theoretical Stock in Chamber (now affected by date filters)
  const stockEstimado = useMemo(() => {
    const map = new Map();
    const today = new Date();
    today.setHours(12, 0, 0, 0); // normalize time

    filteredData.forEach(row => {
      const elaborationDate = new Date(row.fecha_elaboracion + 'T12:00:00Z');
      const diffTime = today.getTime() - elaborationDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      
      // Merma: 20% a los 60 días -> 0.20 / 60 por día. Cap en 35% de merma max para no desaparecer el queso.
      const mermaPct = Math.min((diffDays / 60) * 0.20, 0.35);
      const currentKg = Number(row.kg_totales) * (1 - mermaPct);

      const rawTipo = row.tipo_queso && row.tipo_queso.trim() !== '' ? row.tipo_queso.trim() : (row.producto || 'Sin Variedad');
      const tipoUpper = rawTipo.toUpperCase();
      const category = (tipoUpper === 'PECORINO' || tipoUpper === 'PROVOLETA') ? 'DURO'
        : (tipoUpper === 'MANCHEGO' || tipoUpper === 'SABORIZADO' || tipoUpper === 'AHUMADO') ? 'SEMIDURO'
        : (tipoUpper === 'RICOTA') ? 'RICOTA'
        : (row.producto ? row.producto.toUpperCase() : 'DURO');
      const key = `${category}-${tipoUpper}`;
      
      if (!map.has(key)) {
        map.set(key, { 
          id: key,
          producto: category, 
          variedad: tipoUpper, 
          kg_original: 0, 
          kg_estimado: 0,
          lotes: []
        });
      }
      const entry = map.get(key);
      entry.kg_original += Number(row.kg_totales);
      entry.kg_estimado += currentKg;
      entry.lotes.push({
        lote: row.lote,
        fecha: row.fecha_elaboracion,
        dias: diffDays,
        mermaPct: mermaPct * 100,
        kg_original: Number(row.kg_totales),
        kg_estimado: currentKg,
        maduracion: getMaduracionInfo(tipoUpper, category, diffDays)
      });
    });

    // Sort by largest estimated stock
    return Array.from(map.values()).map(group => {
      // Sort internal lotes by oldest first
      group.lotes.sort((a: any, b: any) => b.dias - a.dias);
      return group;
    }).sort((a, b) => b.kg_estimado - a.kg_estimado);
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
          <p className="text-[#8b7355] mt-1 text-sm md:text-base">Análisis de lotes elaborados, consumo de leche, maduración y eficiencia quesera.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportToExcel}
            className="bg-[#faf9f6] hover:bg-[#f4ebd8] text-[#8b7355] border border-[#e0d6c8] px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-xs hover:border-[#8b7355]"
            title="Exportar planilla de elaboración a Excel"
          >
            <Download size={17} />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="bg-[#8b7355] hover:bg-[#735f46] text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold tracking-wide uppercase text-sm"
          >
            <Plus size={18} strokeWidth={3} />
            Registrar Lote
          </button>
        </div>
      </div>

      {/* Filter Row with Presets & Variety Dropdown */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#e0d6c8] space-y-4">
        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e0d6c8]/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#6b645c] uppercase tracking-wider mr-1">Período:</span>
            {[
              { id: 'ALL', label: 'Histórico Completo' },
              { id: 'THIS_MONTH', label: 'Este Mes' },
              { id: 'LAST_30', label: 'Últimos 30 días' },
              { id: 'THIS_YEAR', label: 'Año en Curso' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  datePreset === p.id && !startDate && !endDate && p.id === 'ALL'
                    ? 'bg-[#8b7355] text-white shadow-xs'
                    : datePreset === p.id && p.id !== 'ALL'
                    ? 'bg-[#8b7355] text-white shadow-xs'
                    : 'bg-[#faf9f6] text-[#6b645c] hover:bg-[#f4ebd8] hover:text-[#2b2824] border border-[#e0d6c8]/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#8b7355] font-semibold">
            {filteredData.length} {filteredData.length === 1 ? 'lote filtrado' : 'lotes filtrados'}
          </div>
        </div>

        {/* Custom Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={14} /> Fecha Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('CUSTOM' as any);
              }}
              className="w-full bg-[#fcfbf9] border border-[#e0d6c8] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={14} /> Fecha Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('CUSTOM' as any);
              }}
              className="w-full bg-[#fcfbf9] border border-[#e0d6c8] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Award size={14} /> Variedad / Queso
            </label>
            <select
              value={selectedVariedad}
              onChange={(e) => setSelectedVariedad(e.target.value)}
              className="w-full bg-[#fcfbf9] border border-[#e0d6c8] rounded-lg px-3 py-2 text-sm font-semibold text-[#2b2824] focus:ring-2 focus:ring-[#8b7355]/20 focus:border-[#8b7355] transition-all"
            >
              <option value="TODAS">Todas las variedades ({availableVariedades.length})</option>
              {availableVariedades.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={clearFilters}
              disabled={!startDate && !endDate && selectedVariedad === 'TODAS'}
              className={`w-full py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                startDate || endDate || selectedVariedad !== 'TODAS'
                  ? 'bg-[#f4ebd8] text-[#8b7355] hover:bg-[#e0d6c8] hover:text-[#2b2824] border border-[#e0d6c8]' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              <Filter size={15} />
              <span>Limpiar Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (6 Métricas Clave) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        {/* Leche Procesada */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Leche Procesada</p>
              <h3 className="text-xl font-black text-[#2b2824] mt-1 font-mono">{totalLitros.toLocaleString()} L</h3>
              <span className="text-[10px] text-gray-400">Total en el período</span>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Droplets size={18} />
            </div>
          </div>
        </div>

        {/* Queso Producido */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Queso Producido</p>
              <h3 className="text-xl font-black text-[#2b2824] mt-1 font-mono">
                {totalKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kg
              </h3>
              <span className="text-[10px] text-gray-400">Peso en fresco de tina</span>
            </div>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <Scale size={18} />
            </div>
          </div>
        </div>

        {/* Rendimiento Promedio */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rendimiento Prom.</p>
              <h3 className={`text-xl font-black mt-1 font-mono ${averageYield >= 12 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {averageYield.toFixed(2)} %
              </h3>
              <span className="text-[10px] text-gray-400">Kg queso / 100 L leche</span>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        {/* Consumo Lácteo (L / Kg) */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Consumo Lácteo</p>
              <h3 className="text-xl font-black text-[#8b7355] mt-1 font-mono">
                {litrosPorKg > 0 ? litrosPorKg.toFixed(2) : '-'} <span className="text-xs font-semibold">L/Kg</span>
              </h3>
              <span className="text-[10px] text-gray-400">Litros por cada kg</span>
            </div>
            <div className="p-2 bg-[#f4ebd8] text-[#8b7355] rounded-xl border border-[#e0d6c8]">
              <Milk size={18} />
            </div>
          </div>
        </div>

        {/* Hormas / Piezas Físicas */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Piezas Elaboradas</p>
              <h3 className="text-xl font-black text-[#2b2824] mt-1 font-mono">
                {totalPiezas.toLocaleString()} <span className="text-xs font-semibold">U</span>
              </h3>
              <span className="text-[10px] text-gray-400">Grandes, barras, tubos, etc.</span>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
              <Boxes size={18} />
            </div>
          </div>
        </div>

        {/* Lotes Totales */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-4 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Lotes Totales</p>
              <h3 className="text-xl font-black text-[#2b2824] mt-1 font-mono">{totalLotes}</h3>
              <span className="text-[10px] text-gray-400">Elaboraciones registradas</span>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Layers size={18} />
            </div>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      {chartData.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolución del Rendimiento */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-[#2b2824] flex items-center gap-2">
                  <TrendingUp size={20} className="text-[#8b7355]" />
                  Evolución del Rendimiento (%)
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Promedio: {averageYield.toFixed(2)}%
                </span>
              </div>
              <div className="h-64 sm:h-72 w-full">
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
                      formatter={(val: any) => [`${val}%`, 'Rendimiento']}
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

            {/* Producción Diaria (Kg) */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-[#2b2824] flex items-center gap-2">
                  <Scale size={20} className="text-[#8b7355]" />
                  Producción Diaria (Kg)
                </h3>
                <span className="text-xs font-bold text-[#8b7355] bg-[#f4ebd8] px-2.5 py-1 rounded-lg border border-[#e0d6c8]">
                  Total: {totalKg.toFixed(1)} Kg
                </span>
              </div>
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0d6c8" />
                    <XAxis 
                      dataKey="fecha" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#6b645c' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#6b645c' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e0d6c8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#2b2824', marginBottom: '4px' }}
                      cursor={{ fill: '#f4ebd8', opacity: 0.4 }}
                      formatter={(val: any) => [`${val} Kg`, 'Queso Producido']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar 
                      dataKey="Queso" 
                      name="Queso Producido (Kg)" 
                      fill="#8b7355" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Comparativa por Variedad de Queso */}
          {varietyStats.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#e0d6c8]">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#2b2824] flex items-center gap-2">
                    <BarChart3 size={20} className="text-[#8b7355]" />
                    Eficiencia y Rendimiento por Variedad de Queso
                  </h3>
                  <p className="text-xs text-[#6b645c] mt-0.5">Comparativa de volumen elaborado, aprovechamiento de leche (L/Kg) y rendimiento porcentual</p>
                </div>
                <span className="text-xs font-bold text-[#6b645c] bg-[#faf9f6] px-3 py-1.5 rounded-lg border border-[#e0d6c8]">
                  {varietyStats.length} {varietyStats.length === 1 ? 'variedad' : 'variedades'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {varietyStats.map((item) => (
                  <div key={item.variedad} className="bg-[#fcfbf9] border border-[#e0d6c8] rounded-xl p-4 space-y-3 hover:border-[#8b7355] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getBadgeColor(item.producto)}`}>
                          {item.producto}
                        </span>
                        <h4 className="font-bold text-[#2b2824] text-sm">{item.variedad}</h4>
                      </div>
                      <span className="text-[11px] font-bold text-gray-500">
                        {item.lotes} {item.lotes === 1 ? 'lote' : 'lotes'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#e0d6c8]/60 text-center">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Volumen</p>
                        <p className="text-sm font-black text-[#2b2824] font-mono">{item.kg.toFixed(1)} <span className="text-[10px] font-normal text-gray-500">Kg</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Rendimiento</p>
                        <p className={`text-sm font-black font-mono ${item.rendimiento >= 12 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {item.rendimiento}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Consumo</p>
                        <p className="text-sm font-black text-[#8b7355] font-mono">{item.litrosPorKg} <span className="text-[10px] font-normal text-gray-500">L/Kg</span></p>
                      </div>
                    </div>

                    {/* Barra de proporción de producción */}
                    <div className="w-full bg-[#e0d6c8]/50 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#8b7355] h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalKg > 0 ? Math.min(100, Math.round((item.kg / totalKg) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Teórico en Cámara */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] overflow-hidden">
        <div className="p-5 border-b border-[#e0d6c8] bg-[#fdfcfb] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-[#2b2824] flex items-center gap-2">
            <Snowflake size={20} className="text-blue-500" />
            Stock Estimado en Cámara
          </h3>
          <span className="text-xs text-[#8b7355] font-semibold bg-[#f4ebd8]/50 px-3 py-1.5 rounded-lg border border-[#e0d6c8] flex items-center gap-2 shadow-sm">
            <TrendingUp size={14} className="text-red-400" />
            Contempla 20% merma a 60 días
          </span>
        </div>
        <div className="p-5 flex flex-col gap-4 bg-gray-50/30">
          {stockEstimado.map((stock) => (
            <div key={stock.id} className="bg-white border border-[#e0d6c8] rounded-xl shadow-sm overflow-hidden">
               {/* Header / Summary */}
               <div 
                 className="p-5 flex flex-col sm:flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                 onClick={() => setExpandedStock(expandedStock === stock.id ? null : stock.id)}
               >
                 <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl border bg-white shadow-sm ${getBadgeColor(stock.producto)}`}>
                      <Snowflake size={24} className="opacity-80" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getBadgeColor(stock.producto)}`}>
                          {stock.producto}
                        </span>
                        <h4 className="text-lg font-bold text-[#2b2824]">{stock.variedad}</h4>
                      </div>
                      <p className="text-sm text-gray-500 font-medium flex flex-wrap items-center gap-1.5">
                        <span>{stock.lotes.length} {stock.lotes.length === 1 ? 'lote' : 'lotes'} en cámara</span>
                        {(() => {
                          const listos = stock.lotes.filter((l: any) => l.maduracion?.status === 'listo' || l.maduracion?.status === 'prolongado').length;
                          const madurando = stock.lotes.filter((l: any) => l.maduracion?.status === 'madurando').length;
                          return (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="text-emerald-700 font-semibold">{listos} listos</span>
                              {madurando > 0 && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <span className="text-amber-700 font-semibold">{madurando} en maduración</span>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-6 sm:gap-8">
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Peso Original</p>
                      <p className="text-lg font-semibold text-gray-500">{stock.kg_original.toFixed(1)} Kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Stock Estimado</p>
                      <p className="text-2xl font-black text-[#8b7355]">{stock.kg_estimado.toFixed(1)} Kg</p>
                    </div>
                    <div className="text-[#8b7355] bg-[#f4ebd8]/50 p-2 rounded-full">
                      {expandedStock === stock.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                 </div>
               </div>

               {/* Breakdown Table */}
               {expandedStock === stock.id && (
                 <div className="border-t border-[#e0d6c8] bg-[#fdfcfb] p-4 sm:p-5 overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                      <thead>
                        <tr className="text-gray-500 border-b border-[#e0d6c8]">
                          <th className="pb-3 px-2 font-semibold">Lote</th>
                          <th className="pb-3 px-2 font-semibold">Elaboración</th>
                          <th className="pb-3 px-2 font-semibold text-center">Estado Maduración</th>
                          <th className="pb-3 px-2 font-semibold text-right">Tiempo en Cámara</th>
                          <th className="pb-3 px-2 font-semibold text-right">Merma %</th>
                          <th className="pb-3 px-2 font-semibold text-right">Kg Iniciales</th>
                          <th className="pb-3 px-2 font-semibold text-right">Kg Estimados</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stock.lotes.map((lote: any, i: number) => {
                          const mad = lote.maduracion;
                          return (
                            <tr key={lote.lote + '-' + i} className="hover:bg-white transition-colors">
                              <td className="py-2.5 px-2 font-bold text-[#2b2824]">{lote.lote}</td>
                              <td className="py-2.5 px-2 text-gray-600 font-medium">
                                {new Date(lote.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                {mad && (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full border ${mad.badgeClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${mad.dotClass}`}></span>
                                    <span>{mad.label}</span>
                                    {mad.status === 'madurando' && (
                                      <span className="text-[10px] font-medium opacity-80">({mad.diasRestantes}d)</span>
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-right font-medium text-blue-600 bg-blue-50/30">
                                {lote.dias} días
                              </td>
                              <td className="py-2.5 px-2 text-right text-red-500 font-medium bg-red-50/30">
                                -{lote.mermaPct.toFixed(1)}%
                              </td>
                              <td className="py-2.5 px-2 text-right text-gray-500 font-semibold">
                                {lote.kg_original.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-2 text-right font-bold text-[#2b2824]">
                                {lote.kg_estimado.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>
          ))}
          {stockEstimado.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              <PackageCheck size={48} className="mx-auto mb-3 text-[#e0d6c8]" />
              <p className="text-lg font-medium text-[#6b645c]">No hay quesos en cámara.</p>
              <p className="text-sm mt-1">Registra elaboraciones para ver el stock teórico.</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e0d6c8] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#e0d6c8] bg-[#fdfcfb] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#2b2824]">Registros de Elaboración</h3>
            <p className="text-xs text-[#6b645c] mt-0.5">Historial de producción, lotes y rendimientos</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick search input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8b7355]" />
              <input
                type="text"
                placeholder="Buscar lote o queso..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 text-xs bg-[#faf9f6] border border-[#e0d6c8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8b7355] text-[#2b2824] w-36 sm:w-44"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick Sort Pills */}
            <div className="flex items-center space-x-1 bg-[#f4ebd8]/60 p-1 rounded-lg text-xs">
              <span className="text-[11px] text-[#6b645c] font-semibold px-1">Ordenar:</span>
              <button
                onClick={() => handleSort('fecha')}
                className={`px-2.5 py-1 rounded font-bold transition-all flex items-center space-x-1 ${
                  sortField === 'fecha'
                    ? 'bg-white text-[#2b2824] shadow-xs'
                    : 'text-[#6b645c] hover:text-[#2b2824]'
                }`}
                title="Ordenar por fecha"
              >
                <span>Fecha</span>
                {sortField === 'fecha' && (
                  sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#8b7355]" /> : <ArrowDown size={12} className="text-[#8b7355]" />
                )}
              </button>

              <button
                onClick={() => handleSort('lote')}
                className={`px-2.5 py-1 rounded font-bold transition-all flex items-center space-x-1 ${
                  sortField === 'lote'
                    ? 'bg-white text-[#2b2824] shadow-xs'
                    : 'text-[#6b645c] hover:text-[#2b2824]'
                }`}
                title="Ordenar por lote"
              >
                <span>Lote</span>
                {sortField === 'lote' && (
                  sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#8b7355]" /> : <ArrowDown size={12} className="text-[#8b7355]" />
                )}
              </button>
            </div>

            <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
              {sortedData.length} {sortedData.length === 1 ? 'lote' : 'lotes'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#f4ebd8]/50 text-[#8b7355] text-xs uppercase tracking-wider select-none">
                <th 
                  onClick={() => handleSort('fecha')}
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-[#e0d6c8]/40 transition-colors group"
                  title="Ordenar por fecha"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Fecha</span>
                    {sortField === 'fecha' ? (
                      sortDirection === 'asc' ? <ArrowUp size={13} className="text-[#8b7355]" /> : <ArrowDown size={13} className="text-[#8b7355]" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-400 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('lote')}
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-[#e0d6c8]/40 transition-colors group"
                  title="Ordenar por lote"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Lote</span>
                    {sortField === 'lote' ? (
                      sortDirection === 'asc' ? <ArrowUp size={13} className="text-[#8b7355]" /> : <ArrowDown size={13} className="text-[#8b7355]" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-400 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Variedad</th>
                <th 
                  onClick={() => handleSort('litros_leche')}
                  className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-[#e0d6c8]/40 transition-colors group"
                  title="Ordenar por litros de leche"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Leche (L)</span>
                    {sortField === 'litros_leche' ? (
                      sortDirection === 'asc' ? <ArrowUp size={13} className="text-[#8b7355]" /> : <ArrowDown size={13} className="text-[#8b7355]" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-400 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('kg_totales')}
                  className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-[#e0d6c8]/40 transition-colors group"
                  title="Ordenar por kg producidos"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Queso (Kg)</span>
                    {sortField === 'kg_totales' ? (
                      sortDirection === 'asc' ? <ArrowUp size={13} className="text-[#8b7355]" /> : <ArrowDown size={13} className="text-[#8b7355]" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-400 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('rendimiento')}
                  className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-[#e0d6c8]/40 transition-colors group"
                  title="Ordenar por rendimiento"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Rendimiento</span>
                    {sortField === 'rendimiento' ? (
                      sortDirection === 'asc' ? <ArrowUp size={13} className="text-[#8b7355]" /> : <ArrowDown size={13} className="text-[#8b7355]" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-400 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-right" title="Litros de leche necesarios por cada kg de queso">
                  Consumo (L/Kg)
                </th>
                <th className="px-6 py-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0d6c8]/60">
              {sortedData.map((row) => {
                const litros = Number(row.litros_leche) || 0;
                const kg = Number(row.kg_totales) || 0;
                const yieldVal = row.rendimiento ? Number(row.rendimiento) : (litros > 0 ? (kg / litros) * 100 : 0);
                const lPorKg = kg > 0 ? (litros / kg) : 0;
                const isAtipico = yieldVal > 0 && (yieldVal < 8.5 || yieldVal > 18.0);

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
                      {litros.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-[#2b2824]">
                      {kg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <span className={`font-bold ${yieldVal > 15 ? 'text-emerald-600' : yieldVal > 10 ? 'text-amber-600' : 'text-red-500'}`}>
                          {yieldVal.toFixed(2)}%
                        </span>
                        {isAtipico && (
                          <span 
                            className="text-amber-500 cursor-help" 
                            title="Rendimiento atípico (<8.5% o >18%). Verificar cuajada o pesaje."
                          >
                            <AlertTriangle size={13} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-mono font-semibold text-[#8b7355]">
                      {lPorKg > 0 ? lPorKg.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="text-[#8b7355] hover:text-[#2b2824] hover:bg-[#f4ebd8] transition-colors p-1.5 rounded-lg"
                          title={`Editar lote ${row.lote}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas eliminar el lote ${row.lote}?`)) {
                              deleteRecord(row.id!);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          title="Eliminar registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Filter size={48} className="mb-4 text-[#e0d6c8]" />
                      <p className="text-lg font-medium text-[#6b645c]">No hay registros para este filtro</p>
                      <p className="text-sm mt-1">
                        {tableSearch 
                          ? `No hay lotes que coincidan con "${tableSearch}".`
                          : 'Prueba cambiando las fechas o registrando un nuevo lote.'}
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        {tableSearch && (
                          <button 
                            onClick={() => setTableSearch('')}
                            className="text-[#8b7355] font-semibold hover:underline px-3 py-1 bg-[#f4ebd8] rounded-lg"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                        {(startDate || endDate) && (
                          <button 
                            onClick={clearFilters}
                            className="text-[#8b7355] font-semibold hover:underline px-3 py-1 bg-[#f4ebd8] rounded-lg"
                          >
                            Limpiar fechas
                          </button>
                        )}
                      </div>
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
                {editingRecordId ? <Pencil size={20} className="text-[#8b7355]" /> : <Plus size={20} className="text-[#8b7355]" />}
                {editingRecordId ? `Editar Lote #${formData.lote}` : 'Registrar Nuevo Lote'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRecordId(null);
                }} 
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
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRecordId(null);
                }}
                className="px-5 py-2.5 font-medium rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="produccion-form"
                className="px-6 py-2.5 font-bold uppercase tracking-wide text-sm bg-[#8b7355] text-white rounded-xl hover:bg-[#735f46] transition-all shadow-sm hover:shadow-md"
              >
                {editingRecordId ? 'Guardar Cambios' : 'Guardar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produccion;
