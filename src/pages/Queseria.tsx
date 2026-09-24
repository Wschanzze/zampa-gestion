import React, { useState } from 'react';
import type { Transaction } from '../utils/calculations';
import { calculateCheeseSales, getAvailableYears } from '../utils/calculations';
import { useProduccion } from '../lib/api';
// @ts-ignore
import { Sparkles, Layers, ArrowUpRight, Plus, Pencil, X, Check, BarChart3, PackageCheck, AlertCircle } from 'lucide-react';
// @ts-ignore
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface QueseriaProps {
  data: Transaction[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(val);
};

const formatKg = (val: number) => {
  return `${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
};

const Queseria: React.FC<QueseriaProps> = ({ data }) => {
  const availableYears = getAvailableYears(data);
  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());

  const { data: produccionData } = useProduccion();

  const { monthNames, variedades, monthlyData, chartData, totals } = calculateCheeseSales(data, selectedYear);
  const { totals: allTimeSales } = React.useMemo(() => calculateCheeseSales(data), [data]);

  // Dynamic calculation for chamber inventory
  const stockEstimado = React.useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const stockMap: Record<string, { variedad: string; producido: number; merma: number; estimado: number; vendido: number; disponible: number }> = {};
    
    variedades.forEach(v => {
      stockMap[v.toLowerCase()] = { variedad: v, producido: 0, merma: 0, estimado: 0, vendido: allTimeSales[v] || 0, disponible: 0 };
    });

    produccionData.forEach(row => {
      const tipo = (row.tipo_queso || '').trim().toLowerCase();
      // Match type directly or if it contains a known variety
      const match = variedades.find(v => tipo.includes(v.toLowerCase()) || v.toLowerCase() === tipo);
      
      if (match) {
        const key = match.toLowerCase();
        const elaborationDate = new Date(row.fecha_elaboracion + 'T12:00:00Z');
        const diffTime = today.getTime() - elaborationDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        const mermaPct = Math.min((diffDays / 60) * 0.20, 0.35); // Max 35% shrinkage
        const currentKg = Number(row.kg_totales) * (1 - mermaPct);

        stockMap[key].producido += Number(row.kg_totales);
        stockMap[key].estimado += currentKg;
        stockMap[key].merma += (Number(row.kg_totales) - currentKg);
      }
    });

    // Final calculations
    Object.values(stockMap).forEach(s => {
      s.disponible = Math.max(0, s.estimado - s.vendido); // Don't show negative stock natively unless required
    });

    return stockMap;
  }, [produccionData, allTimeSales, variedades]);

  // Total stock in chamber
  const totalStockCamara = Object.values(stockEstimado).reduce((acc, item) => acc + item.disponible, 0);

  // Star cheese (highest sold)
  const starCheese = [...variedades].sort((a, b) => totals[b] - totals[a])[0];

  // Color mapping for varieties
  const cheeseColors: Record<string, string> = {
    Pecorino: '#b45309', // amber-700
    Manchego: '#d97706', // amber-600
    Saborizado: '#059669', // emerald-600
    Ahumado: '#78350f', // warm brown
    Provoleta: '#ea580c', // orange-600
    Ricota: '#0284c7', // sky-600
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Title & Year Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 p-4 sm:p-5 rounded-xl border border-[#e0d6c8] shadow-sm">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#3e3a35] flex items-center space-x-2">
            <Sparkles size={18} className="text-amber-700" />
            <span>Gestión de Quesería & Control de Cámara</span>
          </h3>
          <p className="text-xs text-[#6b645c] mt-0.5">Ventas mensuales por variedad, kilos comercializados y stock disponible en cámara de frío</p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <label className="text-xs font-semibold text-[#6b645c] uppercase">Año:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-[#e0d6c8] rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#3e3a35] bg-[#faf9f6] focus:ring-1 focus:ring-[#8b7355] outline-none"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Stock in Chamber */}
        <div className="bg-white/95 p-4 rounded-xl border border-amber-300 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold uppercase tracking-wider">
            <span>Stock en Cámara</span>
            <PackageCheck size={18} className="text-amber-700" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-1">{formatKg(totalStockCamara)}</p>
          <span className="text-[11px] text-[#6b645c]">Disponible para venta y maduración</span>
        </div>

        {/* Total Kg Sold in Year */}
        <div className="bg-white/95 p-4 rounded-xl border border-emerald-200/80 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Total Kilos Vendidos ({selectedYear})</span>
            <Layers size={18} className="text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatKg(totals.totalKg)}</p>
          <span className="text-[11px] text-[#6b645c]">Suma de las 6 variedades</span>
        </div>

        {/* Star Variety */}
        <div className="bg-white/95 p-4 rounded-xl border border-[#e0d6c8] shadow-sm">
          <span className="text-[#6b645c] text-xs font-bold uppercase tracking-wider">Variedad Más Vendida</span>
          <p className="text-xl font-black text-[#3e3a35] mt-1">{starCheese} ({formatKg(totals[starCheese])})</p>
          <span className="text-[11px] text-[#6b645c]">Líder en volumen de ventas</span>
        </div>

        {/* Total Sales and Average Price */}
        <div className="bg-white/95 p-4 rounded-xl border border-blue-200/70 shadow-sm">
          <span className="text-blue-900 text-xs font-bold uppercase tracking-wider">Facturación Quesería</span>
          <p className="text-xl font-black text-blue-800 mt-1">{formatCurrency(totals.ingresos)}</p>
          <span className="text-[11px] font-bold text-[#8b7355]">
            Promedio: {totals.totalKg > 0 ? formatCurrency(totals.ingresos / totals.totalKg) + '/kg' : '-'}
          </span>
        </div>

      </div>

      {/* Control de Stock Disponible en Cámara (Dinámico desde /produccion) */}
      <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e0d6c8]/60 pb-3">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-[#3e3a35] flex items-center space-x-2">
              <PackageCheck size={18} className="text-[#8b7355]" />
              <span>Inventario Disponible en Cámara de Maduración / Frío</span>
            </h4>
            <p className="text-xs text-[#6b645c]">Calculado dinámicamente sumando la producción, descontando la merma y restando las ventas históricas totales.</p>
          </div>
          
          <div className="bg-[#f4ebd8]/70 px-3 py-1.5 rounded-lg border border-[#e0d6c8] text-xs font-bold text-[#8b7355]">
            Sincronizado con Producción y Ventas
          </div>
        </div>

        {/* Cheese Stock Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {variedades.map(varName => {
            const stockItem = stockEstimado[varName.toLowerCase()] || {
              variedad: varName,
              producido: 0,
              merma: 0,
              estimado: 0,
              vendido: 0,
              disponible: 0
            };
            const kgSoldYear = totals[varName];

            return (
              <div 
                key={varName} 
                className="bg-[#faf9f6] rounded-xl border border-[#e0d6c8] p-3 flex flex-col justify-between hover:border-[#8b7355] transition-colors relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#3e3a35]">{varName}</span>
                  </div>

                  <p className="text-lg font-black text-amber-950 font-mono">
                    {formatKg(stockItem.disponible)}
                  </p>

                  <div className="mt-1 flex flex-col gap-0.5">
                    <p className="text-[9px] text-emerald-700 font-medium">
                      + Producido: {formatKg(stockItem.estimado)} 
                    </p>
                    <p className="text-[9px] text-rose-700 font-medium">
                      - Ventas Totales: {formatKg(stockItem.vendido)}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#e0d6c8]/60 text-[10px] text-[#6b645c] flex justify-between" title="Ventas del año seleccionado">
                  <span>Vendido ({selectedYear}):</span>
                  <span className="font-bold text-[#3e3a35]">{formatKg(kgSoldYear)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla Mensual de Ventas por Tipo de Queso (Kg) */}
      <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] overflow-hidden">
        <div className="p-4 border-b border-[#e0d6c8] bg-[#fdfdfc] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-[#3e3a35]">Kilos Vendidos por Mes ({selectedYear})</h4>
            <p className="text-xs text-[#6b645c]">Detalle mensual de kilogramos entregados por variedad y facturación</p>
          </div>
          <div className="sm:hidden text-[10px] text-[#8b7355] bg-[#f4ebd8]/70 px-2.5 py-1 rounded border border-[#e0d6c8]">
            ↔ Desliza la tabla para ver todos los quesos
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead className="text-[11px] sm:text-xs text-[#6b645c] uppercase bg-[#f4ebd8]/50 border-b border-[#e0d6c8]">
              <tr>
                <th className="sticky left-0 bg-[#f4ebd8] z-20 px-3 sm:px-4 py-2.5 sm:py-3 font-semibold border-r border-[#e0d6c8]/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] min-w-[70px]">
                  MES
                </th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-950 font-semibold min-w-[85px]">Pecorino (kg)</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-950 font-semibold min-w-[85px]">Manchego (kg)</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-950 font-semibold min-w-[85px]">Saborizado (kg)</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-950 font-semibold min-w-[85px]">Ahumado (kg)</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-950 font-semibold min-w-[85px]">Provoleta (kg)</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-950 font-semibold min-w-[85px]">Ricota (kg)</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right bg-[#f4ebd8] text-[#3e3a35] font-bold min-w-[95px]">TOTAL KG</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-bold text-emerald-800 min-w-[110px]">VENTAS ($)</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-[#6b645c] min-w-[90px]">PRECIO $/KG</th>
              </tr>
            </thead>
            <tbody>
              {monthNames.map(m => {
                const row = monthlyData[m];
                const avgPrice = row.totalKg > 0 ? row.ingresos / row.totalKg : 0;

                return (
                  <tr key={m} className="border-b border-[#e0d6c8]/40 hover:bg-[#f4ebd8]/30 transition-colors">
                    <td className="sticky left-0 bg-white/95 z-10 px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-[#3e3a35] border-r border-[#e0d6c8]/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      {m}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs">
                      {row.Pecorino > 0 ? formatKg(row.Pecorino) : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs">
                      {row.Manchego > 0 ? formatKg(row.Manchego) : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs">
                      {row.Saborizado > 0 ? formatKg(row.Saborizado) : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs">
                      {row.Ahumado > 0 ? formatKg(row.Ahumado) : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs">
                      {row.Provoleta > 0 ? formatKg(row.Provoleta) : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs">
                      {row.Ricota > 0 ? formatKg(row.Ricota) : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-bold font-mono text-[11px] sm:text-xs bg-[#f4ebd8]/30 text-amber-950">
                      {row.totalKg > 0 ? formatKg(row.totalKg) : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-bold font-mono text-[11px] sm:text-xs text-emerald-700">
                      {row.ingresos > 0 ? formatCurrency(row.ingresos) : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs text-[#6b645c]">
                      {avgPrice > 0 ? formatCurrency(avgPrice) : '-'}
                    </td>
                  </tr>
                );
              })}

              {/* Totals Row */}
              <tr className="bg-[#f4ebd8] font-bold border-t-2 border-[#d4c3ab]">
                <td className="sticky left-0 bg-[#f4ebd8] z-10 px-3 sm:px-4 py-3 font-bold text-[#3e3a35] border-r border-[#e0d6c8] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                  TOTAL {selectedYear}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right font-mono">{totals.Pecorino > 0 ? formatKg(totals.Pecorino) : '-'}</td>
                <td className="px-3 sm:px-4 py-3 text-right font-mono">{totals.Manchego > 0 ? formatKg(totals.Manchego) : '-'}</td>
                <td className="px-3 sm:px-4 py-3 text-right font-mono">{totals.Saborizado > 0 ? formatKg(totals.Saborizado) : '-'}</td>
                <td className="px-3 sm:px-4 py-3 text-right font-mono">{totals.Ahumado > 0 ? formatKg(totals.Ahumado) : '-'}</td>
                <td className="px-3 sm:px-4 py-3 text-right font-mono">{totals.Provoleta > 0 ? formatKg(totals.Provoleta) : '-'}</td>
                <td className="px-3 sm:px-4 py-3 text-right font-mono">{totals.Ricota > 0 ? formatKg(totals.Ricota) : '-'}</td>
                <td className="px-3 sm:px-4 py-3 text-right font-mono text-amber-950 bg-[#e8deca]">{formatKg(totals.totalKg)}</td>
                <td className="px-3 sm:px-4 py-3 text-right font-mono text-emerald-800 bg-[#e8deca]">{formatCurrency(totals.ingresos)}</td>
                <td className="px-3 sm:px-4 py-3 text-right font-mono text-[#3e3a35] bg-[#e8deca]">
                  {totals.totalKg > 0 ? formatCurrency(totals.ingresos / totals.totalKg) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] p-4 sm:p-6 space-y-3">
        <div className="flex items-center space-x-2">
          <BarChart3 size={18} className="text-[#8b7355]" />
          <h4 className="text-sm sm:text-base font-bold text-[#3e3a35]">Evolución Mensual de Kilos Vendidos</h4>
        </div>
        <p className="text-xs text-[#6b645c]">Distribución de kilogramos comercializados por variedad a lo largo del año</p>
        
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e9df" />
              <XAxis dataKey="mes" stroke="#6b645c" fontSize={11} />
              <YAxis stroke="#6b645c" fontSize={11} unit=" kg" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#faf9f6', borderColor: '#e0d6c8', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any) => [`${val} kg`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Pecorino" stackId="a" fill={cheeseColors.Pecorino} />
              <Bar dataKey="Manchego" stackId="a" fill={cheeseColors.Manchego} />
              <Bar dataKey="Saborizado" stackId="a" fill={cheeseColors.Saborizado} />
              <Bar dataKey="Ahumado" stackId="a" fill={cheeseColors.Ahumado} />
              <Bar dataKey="Provoleta" stackId="a" fill={cheeseColors.Provoleta} />
              <Bar dataKey="Ricota" stackId="a" fill={cheeseColors.Ricota} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Queseria;
