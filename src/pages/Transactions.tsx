import React from 'react';
import type { Transaction } from '../utils/calculations';

interface TransactionsProps {
  data: Transaction[];
}

const Transactions: React.FC<TransactionsProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Prov/Cliente</th>
              <th className="px-4 py-3">Cuenta</th>
              <th className="px-4 py-3 text-right">Ingresos</th>
              <th className="px-4 py-3 text-right">Egresos</th>
              <th className="px-4 py-3">Rubro</th>
              <th className="px-4 py-3">Subactividad</th>
              <th className="px-4 py-3">Subrubro/Prod</th>
              <th className="px-4 py-3 text-right">Cantidades</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">{row.Fecha}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{row['Prov/Cliente']}</td>
                <td className="px-4 py-3">{row.Cuenta}</td>
                <td className="px-4 py-3 text-right text-emerald-600">{row.Ingresos}</td>
                <td className="px-4 py-3 text-right text-rose-600">{row.Egresos}</td>
                <td className="px-4 py-3">{row.Rubro}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${row.Subactividad?.toUpperCase() === 'TAMBO' ? 'bg-blue-100 text-blue-800' : ''}
                    ${row.Subactividad?.toUpperCase() === 'QUESERIA' ? 'bg-amber-100 text-amber-800' : ''}
                    ${row.Subactividad?.toUpperCase() === 'RECRIA' ? 'bg-green-100 text-green-800' : ''}
                    ${row.Subactividad?.toUpperCase() === 'COMUN' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {row.Subactividad || 'COMUN'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{row['Subrubro/Producto']}</td>
                <td className="px-4 py-3 text-right font-medium">{row.Cantidades}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
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
