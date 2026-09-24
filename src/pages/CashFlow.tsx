import React, { useState } from 'react';
import { calculateCashFlow, getAvailableYears } from '../utils/calculations';
import type { Transaction } from '../utils/calculations';

interface CashFlowProps {
  data: Transaction[];
}

const formatCurrency = (value: number) => {
  if (value === 0) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

const CashFlow: React.FC<CashFlowProps> = ({ data }) => {
  const availableYears = getAvailableYears(data);
  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());

  const { sortedMonths, rubrosIngreso, rubrosEgreso, matrix, saldoMensual, saldoAcumulado } = calculateCashFlow(data, selectedYear);

  const calculateRowTotal = (rubro: string) => {
    return sortedMonths.reduce((acc, m) => acc + (matrix[rubro]?.[m] || 0), 0);
  };

  const calculateMonthTotalIngresos = (month: string) => {
    return rubrosIngreso.reduce((acc, r) => acc + (matrix[r]?.[month] || 0), 0);
  };

  const calculateMonthTotalEgresos = (month: string) => {
    return rubrosEgreso.reduce((acc, r) => acc + (matrix[r]?.[month] || 0), 0);
  };

  const totalIngresosYear = rubrosIngreso.reduce((acc, r) => acc + calculateRowTotal(r), 0);
  const totalEgresosYear = rubrosEgreso.reduce((acc, r) => acc + calculateRowTotal(r), 0);
  const resultadoNetoYear = totalIngresosYear - totalEgresosYear;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Year Selector & KPI Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 p-4 sm:p-5 rounded-xl border border-[#e0d6c8] shadow-sm">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#3e3a35]">Flujo de Caja Mensual</h3>
          <p className="text-xs text-[#6b645c] mt-0.5">Control de ingresos, egresos y evolución de liquidez por mes</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white/90 p-3.5 sm:p-4 rounded-xl border border-emerald-200/70 shadow-sm">
          <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">Total Ingresos ({selectedYear})</span>
          <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totalIngresosYear)}</p>
        </div>
        <div className="bg-white/90 p-3.5 sm:p-4 rounded-xl border border-rose-200/70 shadow-sm">
          <span className="text-[11px] font-medium text-rose-800 uppercase tracking-wider">Total Egresos ({selectedYear})</span>
          <p className="text-lg sm:text-xl font-bold text-rose-700 mt-1">{formatCurrency(totalEgresosYear)}</p>
        </div>
        <div className="bg-white/90 p-3.5 sm:p-4 rounded-xl border border-[#e0d6c8] shadow-sm">
          <span className="text-[11px] font-medium text-[#6b645c] uppercase tracking-wider">Resultado Anual ({selectedYear})</span>
          <p className={`text-lg sm:text-xl font-bold mt-1 ${resultadoNetoYear >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(resultadoNetoYear)}
          </p>
        </div>
      </div>

      {/* Mobile scroll hint */}
      <div className="sm:hidden text-xs text-[#8b7355] bg-[#f4ebd8]/70 px-3 py-2 rounded-lg border border-[#e0d6c8] text-center font-bold flex items-center justify-center gap-2">
        <span>↔</span> Desliza la tabla hacia los lados para ver los 12 meses
      </div>

      {/* Main Cash Flow Table */}
      <div className="bg-white rounded-xl shadow-md border border-[#e0d6c8] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs sm:text-sm text-left border-separate border-spacing-0 whitespace-nowrap">
            <thead className="text-[11px] sm:text-xs text-[#6b645c] bg-[#f4ebd8] border-b-2 border-[#e0d6c8]">
              <tr>
                {/* Sticky Concept Column */}
                <th className="sticky left-0 bg-[#f4ebd8] z-20 px-4 py-3 min-w-[160px] sm:min-w-[200px] font-bold text-[#3e3a35] border-r border-[#e0d6c8] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  RUBRO / MES
                </th>
                {sortedMonths.map(m => (
                  <th key={m} className="px-3 py-3 text-right font-bold uppercase tracking-wider min-w-[85px]">{m}</th>
                ))}
                <th className="px-4 py-3 text-right bg-[#e8deca] text-[#3e3a35] font-black min-w-[110px]">
                  TOTAL {selectedYear}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* INGRESOS SECTION */}
              <tr className="bg-emerald-50 border-b border-emerald-200">
                <td className="sticky left-0 bg-[#ecfdf5] z-10 px-4 py-2.5 font-black text-emerald-900 tracking-widest text-xs sm:text-sm uppercase border-r border-emerald-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  ▲ INGRESOS
                </td>
                <td colSpan={sortedMonths.length + 1} className="bg-emerald-50"></td>
              </tr>
              {rubrosIngreso.length === 0 ? (
                <tr>
                  <td className="sticky left-0 bg-white z-10 border-r border-[#e0d6c8]/60"></td>
                  <td colSpan={sortedMonths.length + 1} className="px-4 py-4 text-center text-[#6b645c] italic">
                    Sin ingresos registrados para el año {selectedYear}
                  </td>
                </tr>
              ) : (
                rubrosIngreso.map(rubro => (
                  <tr key={rubro} className="bg-white border-b border-[#e0d6c8]/50 hover:bg-emerald-50/40 transition-colors">
                    <td className="sticky left-0 bg-white z-10 px-4 py-2.5 text-[#4a443c] font-semibold border-r border-[#e0d6c8]/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] max-w-[180px] sm:max-w-none overflow-hidden text-ellipsis" title={rubro}>
                      {rubro}
                    </td>
                    {sortedMonths.map(m => (
                      <td key={m} className="px-3 py-2.5 text-right font-mono text-xs sm:text-sm text-[#3e3a35]">{formatCurrency(matrix[rubro]?.[m] || 0)}</td>
                    ))}
                    <td className="px-4 py-2.5 text-right font-black font-mono text-xs sm:text-sm bg-emerald-50/50 text-emerald-900">
                      {formatCurrency(calculateRowTotal(rubro))}
                    </td>
                  </tr>
                ))
              )}
              <tr className="border-b-[3px] border-emerald-400 bg-emerald-100/60 font-semibold">
                <td className="sticky left-0 bg-[#ecfdf5] z-10 px-4 py-3 font-black text-emerald-950 border-r border-emerald-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  TOTAL INGRESOS
                </td>
                {sortedMonths.map(m => (
                  <td key={m} className="px-3 py-3 text-right font-bold font-mono text-xs sm:text-sm text-emerald-900">
                    {formatCurrency(calculateMonthTotalIngresos(m))}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-black font-mono text-xs sm:text-sm text-emerald-950 bg-emerald-200/60">
                  {formatCurrency(totalIngresosYear)}
                </td>
              </tr>

              {/* SPACER */}
              <tr className="bg-[#faf9f6]">
                <td className="sticky left-0 bg-[#faf9f6] z-10 py-2 border-r border-[#e0d6c8]/60 border-y border-[#e0d6c8]/30"></td>
                <td colSpan={sortedMonths.length + 1} className="py-2 border-y border-[#e0d6c8]/30"></td>
              </tr>

              {/* EGRESOS SECTION */}
              <tr className="bg-rose-50 border-b border-rose-200">
                <td className="sticky left-0 bg-[#fff1f2] z-10 px-4 py-2.5 font-black text-rose-900 tracking-widest text-xs sm:text-sm uppercase border-r border-rose-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  ▼ EGRESOS
                </td>
                <td colSpan={sortedMonths.length + 1} className="bg-rose-50"></td>
              </tr>
              {rubrosEgreso.length === 0 ? (
                <tr>
                  <td className="sticky left-0 bg-white z-10 border-r border-[#e0d6c8]/60"></td>
                  <td colSpan={sortedMonths.length + 1} className="px-4 py-4 text-center text-[#6b645c] italic">
                    Sin egresos registrados para el año {selectedYear}
                  </td>
                </tr>
              ) : (
                rubrosEgreso.map(rubro => (
                  <tr key={rubro} className="bg-white border-b border-[#e0d6c8]/50 hover:bg-rose-50/40 transition-colors">
                    <td className="sticky left-0 bg-white z-10 px-4 py-2.5 text-[#4a443c] font-semibold border-r border-[#e0d6c8]/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] max-w-[180px] sm:max-w-none overflow-hidden text-ellipsis" title={rubro}>
                      {rubro}
                    </td>
                    {sortedMonths.map(m => (
                      <td key={m} className="px-3 py-2.5 text-right font-mono text-xs sm:text-sm text-[#3e3a35]">{formatCurrency(matrix[rubro]?.[m] || 0)}</td>
                    ))}
                    <td className="px-4 py-2.5 text-right font-black font-mono text-xs sm:text-sm bg-rose-50/50 text-rose-900">
                      {formatCurrency(calculateRowTotal(rubro))}
                    </td>
                  </tr>
                ))
              )}
              <tr className="border-b-[3px] border-rose-400 bg-rose-100/60 font-semibold">
                <td className="sticky left-0 bg-[#fff1f2] z-10 px-4 py-3 font-black text-rose-950 border-r border-rose-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  TOTAL EGRESOS
                </td>
                {sortedMonths.map(m => (
                  <td key={m} className="px-3 py-3 text-right font-bold font-mono text-xs sm:text-sm text-rose-900">
                    {formatCurrency(calculateMonthTotalEgresos(m))}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-black font-mono text-xs sm:text-sm text-rose-950 bg-rose-200/60">
                  {formatCurrency(totalEgresosYear)}
                </td>
              </tr>

              {/* SPACER */}
              <tr className="bg-[#faf9f6]">
                <td className="sticky left-0 bg-[#faf9f6] z-10 py-2 border-r border-[#e0d6c8]/60 border-y border-[#e0d6c8]/30"></td>
                <td colSpan={sortedMonths.length + 1} className="py-2 border-y border-[#e0d6c8]/30"></td>
              </tr>

              {/* SALDO MENSUAL NETO */}
              <tr className="bg-[#f4ebd8] border-t border-b border-[#e0d6c8]">
                <td className="sticky left-0 bg-[#f4ebd8] z-10 px-4 py-3.5 font-black text-[#3e3a35] uppercase border-r border-[#e0d6c8] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  SALDO MENSUAL
                </td>
                {sortedMonths.map(m => {
                  const net = saldoMensual[m] || 0;
                  return (
                    <td key={m} className={`px-3 py-3.5 text-right font-black font-mono text-sm ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatCurrency(net)}
                    </td>
                  );
                })}
                <td className={`px-4 py-3.5 text-right font-black font-mono text-sm sm:text-base ${resultadoNetoYear >= 0 ? 'text-emerald-800' : 'text-rose-800'} bg-[#e8deca]`}>
                  {formatCurrency(resultadoNetoYear)}
                </td>
              </tr>

              {/* SALDO ACUMULADO */}
              <tr className="bg-[#eae0cd] border-b-[3px] border-[#d4c3ab]">
                <td className="sticky left-0 bg-[#eae0cd] z-10 px-4 py-3.5 font-black text-[#2d2a26] uppercase border-r border-[#d4c3ab] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  SALDO ACUMULADO
                </td>
                {sortedMonths.map(m => {
                  const acc = saldoAcumulado[m] || 0;
                  return (
                    <td key={m} className={`px-3 py-3.5 text-right font-black font-mono text-sm ${acc >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {formatCurrency(acc)}
                    </td>
                  );
                })}
                <td className="px-4 py-3.5 text-right font-black font-mono text-sm sm:text-base text-[#2d2a26] bg-[#d9cbb2]">
                  {formatCurrency(saldoAcumulado[sortedMonths[sortedMonths.length - 1]] || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashFlow;
