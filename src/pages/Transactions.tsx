import React, { useState } from 'react';
import { parseCurrency } from '../utils/calculations';
import type { Transaction } from '../utils/calculations';
import TransactionForm from '../components/TransactionForm';
// @ts-ignore
import { Plus } from 'lucide-react';

interface TransactionsProps {
  data: Transaction[];
  onAdd: (tx: Transaction) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ data, onAdd }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] overflow-hidden">
      
      {/* Header action */}
      <div className="p-4 border-b border-[#e0d6c8] flex justify-between items-center bg-[#fdfdfc]">
        <h3 className="text-lg font-semibold text-[#3e3a35]">Historial de Movimientos</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-1 px-3 py-2 bg-[#8b7355] text-white rounded-lg text-sm hover:bg-[#7a6448] shadow-sm transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Nuevo Movimiento</span>
        </button>
      </div>

      {showForm && <TransactionForm onAdd={onAdd} onClose={() => setShowForm(false)} />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#6b645c] uppercase bg-[#f4ebd8]/50 border-b border-[#e0d6c8]">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Prov/Cliente</th>
              <th className="px-4 py-3">Cuenta</th>
              <th className="px-4 py-3 text-right">Ingresos</th>
              <th className="px-4 py-3 text-right">Egresos</th>
              <th className="px-4 py-3">Rubro</th>
              <th className="px-4 py-3">Subactividad</th>
              <th className="px-4 py-3">Subrubro/Prod</th>
              <th className="px-3 py-3 text-right bg-amber-50/50 text-amber-900" title="Pecorino (kg)">Pecorino</th>
              <th className="px-3 py-3 text-right bg-amber-50/50 text-amber-900" title="Manchego (kg)">Manchego</th>
              <th className="px-3 py-3 text-right bg-amber-50/50 text-amber-900" title="Saborizado (kg)">Saboriz.</th>
              <th className="px-3 py-3 text-right bg-amber-50/50 text-amber-900" title="Ahumado (kg)">Ahumado</th>
              <th className="px-3 py-3 text-right bg-amber-50/50 text-amber-900" title="Provoleta (kg)">Provol.</th>
              <th className="px-3 py-3 text-right bg-amber-50/50 text-amber-900" title="Ricota (kg)">Ricota</th>
              <th className="px-4 py-3 text-right">Cantidades</th>
              <th className="px-4 py-3">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const ingresosParsed = parseCurrency(row.Ingresos);
              const egresosParsed = parseCurrency(row.Egresos);
              
              return (
                <tr key={idx} className="border-b border-[#e0d6c8]/50 hover:bg-[#f4ebd8]/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-[#3e3a35] font-medium">{row.Fecha}</td>
                  <td className="px-4 py-3 font-medium text-[#3e3a35]">{row['Prov/Cliente']}</td>
                  <td className="px-4 py-3 text-[#6b645c]">{row.Cuenta}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{ingresosParsed > 0 ? `$${ingresosParsed.toLocaleString('es-AR')}` : '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-rose-600">{egresosParsed > 0 ? `$${egresosParsed.toLocaleString('es-AR')}` : '-'}</td>
                  <td className="px-4 py-3 text-[#3e3a35]">{row.Rubro}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border
                      ${row.Subactividad?.toUpperCase() === 'TAMBO' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                      ${row.Subactividad?.toUpperCase() === 'QUESERIA' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                      ${row.Subactividad?.toUpperCase() === 'RECRIA' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      ${row.Subactividad?.toUpperCase() === 'COMUN' ? 'bg-[#f4ebd8] text-[#6b645c] border-[#e0d6c8]' : ''}
                    `}>
                      {row.Subactividad || 'COMUN'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6b645c]">{row['Subrubro/Producto']}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs text-amber-950 bg-amber-50/20">{row.Pecorino ? Number(row.Pecorino).toLocaleString('es-AR') : '-'}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs text-amber-950 bg-amber-50/20">{row.Manchego ? Number(row.Manchego).toLocaleString('es-AR') : '-'}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs text-amber-950 bg-amber-50/20">{row.Saborizado ? Number(row.Saborizado).toLocaleString('es-AR') : '-'}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs text-amber-950 bg-amber-50/20">{row.Ahumado ? Number(row.Ahumado).toLocaleString('es-AR') : '-'}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs text-amber-950 bg-amber-50/20">{row.Provoleta ? Number(row.Provoleta).toLocaleString('es-AR') : '-'}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs text-amber-950 bg-amber-50/20">{row.Ricota ? Number(row.Ricota).toLocaleString('es-AR') : '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#3e3a35]">{row.Cantidades || '-'}</td>
                  <td className="px-4 py-3 text-xs text-[#6b645c] max-w-[200px] truncate" title={row.Observaciones}>{row.Observaciones || '-'}</td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={16} className="px-4 py-8 text-center text-[#6b645c]">
                  No hay transacciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
