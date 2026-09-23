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
    <div className="space-y-6">
      {/* Header with Year Selector & KPI Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 p-5 rounded-xl border border-[#e0d6c8] shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-[#3e3a35]">Flujo de Caja Mensual Proyectado y Real</h3>
          <p className="text-xs text-[#6b645c] mt-0.5">Control de ingresos, egresos y evolución de liquidez por mes</p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-[#6b645c] uppercase">Año:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-[#e0d6c8] rounded-lg px-3 py-1.5 text-sm font-semibold text-[#3e3a35] bg-[#faf9f6] focus:ring-1 focus:ring-[#8b7355] outline-none"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/90 p-4 rounded-xl border border-emerald-200/70 shadow-sm">
          <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Total Ingresos ({selectedYear})</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totalIngresosYear)}</p>
        </div>
        <div className="bg-white/90 p-4 rounded-xl border border-rose-200/70 shadow-sm">
          <span className="text-xs font-medium text-rose-800 uppercase tracking-wider">Total Egresos ({selectedYear})</span>
          <p className="text-xl font-bold text-rose-700 mt-1">{formatCurrency(totalEgresosYear)}</p>
        </div>
        <div className="bg-white/90 p-4 rounded-xl border border-[#e0d6c8] shadow-sm">
          <span className="text-xs font-medium text-[#6b645c] uppercase tracking-wider">Resultado Anual ({selectedYear})</span>
          <p className={`text-xl font-bold mt-1 ${resultadoNetoYear >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(resultadoNetoYear)}
          </p>
        </div>
      </div>

      {/* Main Cash Flow Table */}
      <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left">
            <thead className="text-xs text-[#6b645c] bg-[#fdfdfc] border-b border-[#e0d6c8]">
              <tr>
                <th className="px-4 py-3 min-w-[200px] font-semibold">RUBRO / MES</th>
                {sortedMonths.map(m => (
                  <th key={m} className="px-3 py-3 text-right font-medium">{m}</th>
                ))}
                <th className="px-4 py-3 text-right bg-[#f4ebd8] text-[#3e3a35] font-bold">TOTAL {selectedYear}</th>
              </tr>
            </thead>
            <tbody>
              {/* INGRESOS SECTION */}
              <tr className="bg-emerald-50/60 border-y border-emerald-100">
                <td colSpan={sortedMonths.length + 2} className="px-4 py-2 font-bold text-emerald-900 tracking-wider">
                  ▲ INGRESOS
                </td>
              </tr>
              {rubrosIngreso.length === 0 ? (
                <tr>
                  <td colSpan={sortedMonths.length + 2} className="px-4 py-2 text-center text-gray-400 italic">
                    Sin ingresos registrados para el año {selectedYear}
                  </td>
                </tr>
              ) : (
                rubrosIngreso.map(rubro => (
                  <tr key={rubro} className="border-b border-[#e0d6c8]/40 hover:bg-[#f4ebd8]/30 transition-colors">
                    <td className="px-4 py-2 text-[#5c544d] font-medium">{rubro}</td>
                    {sortedMonths.map(m => (
                      <td key={m} className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(matrix[rubro]?.[m] || 0)}</td>
                    ))}
                    <td className="px-4 py-2 text-right font-bold font-mono text-xs bg-[#f4ebd8]/40 text-emerald-900">
                      {formatCurrency(calculateRowTotal(rubro))}
                    </td>
                  </tr>
                ))
              )}
              <tr className="border-b-2 border-emerald-300 bg-emerald-50 font-semibold">
                <td className="px-4 py-2.5 font-bold text-emerald-950">TOTAL INGRESOS</td>
                {sortedMonths.map(m => (
                  <td key={m} className="px-3 py-2.5 text-right font-bold font-mono text-xs text-emerald-900">
                    {formatCurrency(calculateMonthTotalIngresos(m))}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-bold font-mono text-xs text-emerald-950 bg-emerald-100/70">
                  {formatCurrency(totalIngresosYear)}
                </td>
              </tr>

              {/* SPACER */}
              <tr className="bg-[#faf9f6]"><td colSpan={sortedMonths.length + 2} className="py-2 border-y border-[#e0d6c8]/30"></td></tr>

              {/* EGRESOS SECTION */}
              <tr className="bg-rose-50/60 border-y border-rose-100">
                <td colSpan={sortedMonths.length + 2} className="px-4 py-2 font-bold text-rose-900 tracking-wider">
                  ▼ EGRESOS
                </td>
              </tr>
              {rubrosEgreso.length === 0 ? (
                <tr>
                  <td colSpan={sortedMonths.length + 2} className="px-4 py-2 text-center text-gray-400 italic">
                    Sin egresos registrados para el año {selectedYear}
                  </td>
                </tr>
              ) : (
                rubrosEgreso.map(rubro => (
                  <tr key={rubro} className="border-b border-[#e0d6c8]/40 hover:bg-[#f4ebd8]/30 transition-colors">
                    <td className="px-4 py-2 text-[#5c544d] font-medium">{rubro}</td>
                    {sortedMonths.map(m => (
                      <td key={m} className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(matrix[rubro]?.[m] || 0)}</td>
                    ))}
                    <td className="px-4 py-2 text-right font-bold font-mono text-xs bg-[#f4ebd8]/40 text-rose-900">
                      {formatCurrency(calculateRowTotal(rubro))}
                    </td>
                  </tr>
                ))
              )}
              <tr className="border-b-2 border-rose-300 bg-rose-50 font-semibold">
                <td className="px-4 py-2.5 font-bold text-rose-950">TOTAL EGRESOS</td>
                {sortedMonths.map(m => (
                  <td key={m} className="px-3 py-2.5 text-right font-bold font-mono text-xs text-rose-900">
                    {formatCurrency(calculateMonthTotalEgresos(m))}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-bold font-mono text-xs text-rose-950 bg-rose-100/70">
                  {formatCurrency(totalEgresosYear)}
                </td>
              </tr>

              {/* SPACER */}
              <tr className="bg-[#faf9f6]"><td colSpan={sortedMonths.length + 2} className="py-2 border-y border-[#e0d6c8]/30"></td></tr>

              {/* SALDO MENSUAL NETO */}
              <tr className="bg-[#f4ebd8] border-t border-b border-[#e0d6c8]">
                <td className="px-4 py-3 font-bold text-[#3e3a35] uppercase">SALDO MENSUAL (Flujo Neto)</td>
                {sortedMonths.map(m => {
                  const net = saldoMensual[m] || 0;
                  return (
                    <td key={m} className={`px-3 py-3 text-right font-bold font-mono text-xs ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatCurrency(net)}
                    </td>
                  );
                })}
                <td className={`px-4 py-3 text-right font-bold font-mono text-xs ${resultadoNetoYear >= 0 ? 'text-emerald-800' : 'text-rose-800'} bg-[#e8deca]`}>
                  {formatCurrency(resultadoNetoYear)}
                </td>
              </tr>

              {/* SALDO ACUMULADO */}
              <tr className="bg-[#eae0cd] border-b-2 border-[#d4c3ab]">
                <td className="px-4 py-3 font-bold text-[#2d2a26] uppercase">SALDO ACUMULADO</td>
                {sortedMonths.map(m => {
                  const acc = saldoAcumulado[m] || 0;
                  return (
                    <td key={m} className={`px-3 py-3 text-right font-bold font-mono text-xs ${acc >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {formatCurrency(acc)}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-bold font-mono text-xs text-[#2d2a26] bg-[#d9cbb2]">
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
