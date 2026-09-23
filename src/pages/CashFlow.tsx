import React from 'react';
import { calculateCashFlow } from '../utils/calculations';
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
  const { sortedMonths, rubrosIngreso, rubrosEgreso, matrix } = calculateCashFlow(data);

  const calculateRowTotal = (rubro: string) => {
    return sortedMonths.reduce((acc, m) => acc + (matrix[rubro]?.[m] || 0), 0);
  };

  const calculateMonthTotalIngresos = (month: string) => {
    return rubrosIngreso.reduce((acc, r) => acc + (matrix[r]?.[month] || 0), 0);
  };

  const calculateMonthTotalEgresos = (month: string) => {
    return rubrosEgreso.reduce((acc, r) => acc + (matrix[r]?.[month] || 0), 0);
  };

  return (
    <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#6b645c] bg-[#fdfdfc] border-b border-[#e0d6c8]">
            <tr>
              <th className="px-4 py-3 min-w-[200px]">FLUJO DE CAJA MENSUAL</th>
              {sortedMonths.map(m => (
                <th key={m} className="px-4 py-3 text-right">{m}</th>
              ))}
              <th className="px-4 py-3 text-right bg-[#f4ebd8] text-[#3e3a35] font-bold">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {/* Ingresos Section */}
            <tr className="bg-emerald-50/50">
              <td colSpan={sortedMonths.length + 2} className="px-4 py-2 font-bold text-emerald-800">INGRESOS</td>
            </tr>
            {rubrosIngreso.map(rubro => (
              <tr key={rubro} className="border-b border-[#e0d6c8]/50 hover:bg-[#f4ebd8]/30 transition-colors">
                <td className="px-4 py-2 text-[#6b645c]">{rubro}</td>
                {sortedMonths.map(m => (
                  <td key={m} className="px-4 py-2 text-right">{formatCurrency(matrix[rubro]?.[m] || 0)}</td>
                ))}
                <td className="px-4 py-2 text-right font-medium bg-[#f4ebd8]/50">{formatCurrency(calculateRowTotal(rubro))}</td>
              </tr>
            ))}
            <tr className="border-b-2 border-emerald-200 bg-emerald-50">
              <td className="px-4 py-2 font-bold text-emerald-900">TOTAL INGRESOS</td>
              {sortedMonths.map(m => (
                <td key={m} className="px-4 py-2 text-right font-bold text-emerald-900">{formatCurrency(calculateMonthTotalIngresos(m))}</td>
              ))}
              <td className="px-4 py-2 text-right font-bold text-emerald-900 bg-emerald-100/50">
                {formatCurrency(rubrosIngreso.reduce((acc, r) => acc + calculateRowTotal(r), 0))}
              </td>
            </tr>

            {/* Spacer */}
            <tr><td colSpan={sortedMonths.length + 2} className="py-2"></td></tr>

            {/* Egresos Section */}
            <tr className="bg-rose-50/50">
              <td colSpan={sortedMonths.length + 2} className="px-4 py-2 font-bold text-rose-800">EGRESOS</td>
            </tr>
            {rubrosEgreso.map(rubro => (
              <tr key={rubro} className="border-b border-[#e0d6c8]/50 hover:bg-[#f4ebd8]/30 transition-colors">
                <td className="px-4 py-2 text-[#6b645c]">{rubro}</td>
                {sortedMonths.map(m => (
                  <td key={m} className="px-4 py-2 text-right">{formatCurrency(matrix[rubro]?.[m] || 0)}</td>
                ))}
                <td className="px-4 py-2 text-right font-medium bg-[#f4ebd8]/50">{formatCurrency(calculateRowTotal(rubro))}</td>
              </tr>
            ))}
            <tr className="border-b-2 border-rose-200 bg-rose-50">
              <td className="px-4 py-2 font-bold text-rose-900">TOTAL EGRESOS</td>
              {sortedMonths.map(m => (
                <td key={m} className="px-4 py-2 text-right font-bold text-rose-900">{formatCurrency(calculateMonthTotalEgresos(m))}</td>
              ))}
              <td className="px-4 py-2 text-right font-bold text-rose-900 bg-rose-100/50">
                {formatCurrency(rubrosEgreso.reduce((acc, r) => acc + calculateRowTotal(r), 0))}
              </td>
            </tr>

            {/* Spacer */}
            <tr><td colSpan={sortedMonths.length + 2} className="py-2"></td></tr>

            {/* SALDO MENSUAL */}
            <tr className="bg-[#eae0cd] border-t border-b border-[#d4c3ab]">
              <td className="px-4 py-3 font-bold text-[#3e3a35] uppercase">Flujo de Caja Mensual</td>
              {sortedMonths.map(m => {
                const diff = calculateMonthTotalIngresos(m) - calculateMonthTotalEgresos(m);
                return (
                  <td key={m} className={`px-4 py-3 text-right font-bold ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(diff)}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right font-bold text-[#3e3a35] bg-[#d4c3ab]/50">
                {formatCurrency(
                  rubrosIngreso.reduce((acc, r) => acc + calculateRowTotal(r), 0) -
                  rubrosEgreso.reduce((acc, r) => acc + calculateRowTotal(r), 0)
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlow;
