import React from 'react';
import { calculateSummaryByUnit, calculatePendientes } from '../utils/calculations';
import type { Transaction } from '../utils/calculations';

interface DashboardProps {
  data: Transaction[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const summary = calculateSummaryByUnit(data);
  const pendientes = calculatePendientes(data);
  const units = ['TAMBO', 'RECRIA', 'QUESERIA', 'COMUN'] as const;

  return (
    <div className="space-y-8">
      {/* Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">RESUMEN POR UNIDAD DE NEGOCIO</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200 uppercase">
            <tr>
              <th className="px-6 py-3">Unidad de Negocio</th>
              <th className="px-6 py-3 text-right">Ingresos</th>
              <th className="px-6 py-3 text-right">Egresos</th>
              <th className="px-6 py-3 text-right">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => {
              const stats = summary[unit];
              const isPositive = stats.resultado >= 0;
              return (
                <tr key={unit} className="border-b border-gray-100">
                  <td className="px-6 py-3 font-medium text-gray-900">{unit}</td>
                  <td className="px-6 py-3 text-right text-emerald-600">{formatCurrency(stats.ingresos)}</td>
                  <td className="px-6 py-3 text-right text-rose-600">{formatCurrency(stats.egresos)}</td>
                  <td className={`px-6 py-3 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(stats.resultado)}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-indigo-50 border-t-2 border-indigo-200">
              <td className="px-6 py-4 font-bold text-indigo-900">TOTAL</td>
              <td className="px-6 py-4 text-right font-bold text-emerald-700">{formatCurrency(summary.TOTAL.ingresos)}</td>
              <td className="px-6 py-4 text-right font-bold text-rose-700">{formatCurrency(summary.TOTAL.egresos)}</td>
              <td className={`px-6 py-4 text-right font-bold text-lg ${summary.TOTAL.resultado >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(summary.TOTAL.resultado)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pendientes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">PENDIENTES DE COBRO Y PAGO</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200 uppercase">
            <tr>
              <th className="px-6 py-3">Proveedor/Cliente</th>
              <th className="px-6 py-3 text-right text-emerald-600">Nos deben (a cobrar)</th>
              <th className="px-6 py-3 text-right text-rose-600">Debemos (a pagar)</th>
              <th className="px-6 py-3 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {pendientes.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{row.entity}</td>
                <td className="px-6 py-3 text-right">{row.cobrar > 0 ? formatCurrency(row.cobrar) : '-'}</td>
                <td className="px-6 py-3 text-right">{row.pagar > 0 ? formatCurrency(row.pagar) : '-'}</td>
                <td className={`px-6 py-3 text-right font-medium ${row.saldo > 0 ? 'text-emerald-600' : row.saldo < 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                  {formatCurrency(row.saldo)}
                </td>
              </tr>
            ))}
            {pendientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay cuentas pendientes registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
