import React from 'react';
import { calculateSummaryByUnit } from '../utils/calculations';
import type { Transaction } from '../utils/calculations';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

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
  const units = ['TAMBO', 'RECRIA', 'QUESERIA', 'COMUN'] as const;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {units.map((unit) => {
          const stats = summary[unit];
          const isPositive = stats.resultado >= 0;
          return (
            <div key={unit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-gray-500 font-medium text-sm tracking-wider uppercase mb-4">{unit}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Ingresos</span>
                  <span className="text-sm font-medium text-emerald-600">{formatCurrency(stats.ingresos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Egresos</span>
                  <span className="text-sm font-medium text-rose-600">{formatCurrency(stats.egresos)}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Resultado</span>
                    <span className={`text-lg font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {formatCurrency(stats.resultado)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Total Card */}
        <div className="bg-indigo-600 text-white rounded-xl shadow-sm p-6">
          <h3 className="text-indigo-100 font-medium text-sm tracking-wider uppercase mb-4">TOTAL GENERAL</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-indigo-200 text-sm">Ingresos</span>
              <span className="text-sm font-medium">{formatCurrency(summary.TOTAL.ingresos)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-indigo-200 text-sm">Egresos</span>
              <span className="text-sm font-medium">{formatCurrency(summary.TOTAL.egresos)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-indigo-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Resultado</span>
                <span className="text-xl font-bold flex items-center gap-1">
                  <DollarSign size={20} />
                  {formatCurrency(summary.TOTAL.resultado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
