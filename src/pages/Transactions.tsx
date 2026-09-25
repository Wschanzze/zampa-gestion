import React, { useState, useMemo } from 'react';
import { parseCurrency } from '../utils/calculations';
import type { Transaction } from '../utils/calculations';
import TransactionForm from '../components/TransactionForm';
// @ts-ignore
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';

interface TransactionsProps {
  data: Transaction[];
  onAdd: (tx: Transaction) => Promise<boolean | void> | void;
  onUpdate?: (id: string, tx: Transaction) => Promise<boolean | void> | void;
  onDelete?: (id: string) => Promise<boolean | void> | void;
}

const Transactions: React.FC<TransactionsProps> = ({ data, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubactividad, setFilterSubactividad] = useState('TODAS');

  // Filtered list
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = searchTerm === '' || 
        item['Prov/Cliente']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Rubro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item['Subrubro/Producto']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Fecha?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Observaciones?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSub = filterSubactividad === 'TODAS' || 
        item.Subactividad?.toUpperCase() === filterSubactividad;

      return matchSearch && matchSub;
    });
  }, [data, searchTerm, filterSubactividad]);

  const handleEditClick = (item: Transaction) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleNewClick = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleDeleteClick = async (item: Transaction) => {
    if (!item.id) {
      alert('Esta transacción no tiene ID identificable.');
      return;
    }
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar el movimiento de ${item['Prov/Cliente'] || item.Rubro || 'este registro'} por ${
        item.Ingresos ? '$' + Number(item.Ingresos).toLocaleString('es-AR') : '$' + Number(item.Egresos).toLocaleString('es-AR')
      }?`
    );
    if (confirmDelete && onDelete) {
      await onDelete(item.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header card with action & search */}
      <div className="bg-white/95 p-3.5 sm:p-4 rounded-xl shadow-sm border border-[#e0d6c8] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64 md:w-80">
            <Search size={16} className="absolute left-3 top-2.5 text-[#6b645c]" />
            <input 
              type="text" 
              placeholder="Buscar cliente, rubro, fecha..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 sm:py-1.5 border border-[#e0d6c8] rounded-lg text-xs md:text-sm bg-[#faf9f6] text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Filter size={14} className="text-[#6b645c] flex-shrink-0" />
            <select
              value={filterSubactividad}
              onChange={(e) => setFilterSubactividad(e.target.value)}
              className="w-full sm:w-auto border border-[#e0d6c8] rounded-lg px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-[#3e3a35] bg-[#faf9f6] focus:ring-1 focus:ring-[#8b7355] outline-none"
            >
              <option value="TODAS">Todas las Unidades</option>
              <option value="TAMBO">TAMBO</option>
              <option value="RECRIA">RECRÍA</option>
              <option value="QUESERIA">QUESERÍA</option>
              <option value="COMUN">COMÚN</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e0d6c8]/50">
          <span className="text-xs text-[#6b645c] font-medium">
            {filteredData.length} {filteredData.length === 1 ? 'movimiento' : 'movimientos'}
          </span>
          <button 
            onClick={handleNewClick}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#8b7355] text-white rounded-xl text-xs md:text-sm hover:bg-[#7a6448] shadow-sm transition-colors font-bold"
          >
            <Plus size={16} />
            <span>Nueva Transacción</span>
          </button>
        </div>
      </div>

      {/* Mobile scroll hint */}
      <div className="sm:hidden text-[11px] text-[#8b7355] bg-[#f4ebd8]/70 px-3 py-1.5 rounded-lg border border-[#e0d6c8] text-center font-medium">
        ↔ Desliza hacia los lados para ver todas las columnas y quesos
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <TransactionForm 
          initialData={editingItem}
          existingData={data}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }} 
        />
      )}

      {/* Main Table */}
      <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)]">
          <table className="w-full text-xs md:text-sm text-left border-collapse">
            <thead className="text-[11px] sm:text-xs text-[#6b645c] uppercase bg-[#f4ebd8] border-b border-[#e0d6c8] sticky top-0 z-30 shadow-sm">
              <tr>
                {/* Sticky action header */}
                <th className="sticky left-0 bg-[#f4ebd8] z-40 px-2 sm:px-3 py-2.5 sm:py-3 text-center border-r border-[#e0d6c8]/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] min-w-[70px]">
                  Acciones
                </th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">Fecha</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3">Prov/Cliente</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3">Cuenta</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">Ingresos</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">Egresos</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3">Rubro</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3">Subactividad</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3">Subrubro/Prod</th>
                <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-900" title="Pecorino (kg)">Pecorino</th>
                <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-900" title="Manchego (kg)">Manchego</th>
                <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-900" title="Saborizado (kg)">Saboriz.</th>
                <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-900" title="Ahumado (kg)">Ahumado</th>
                <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-900" title="Provoleta (kg)">Provol.</th>
                <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right bg-amber-50/50 text-amber-900" title="Ricota (kg)">Ricota</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">Cantidades</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[180px] sm:min-w-[200px]">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => {
                const ingresosParsed = parseCurrency(row.Ingresos);
                const egresosParsed = parseCurrency(row.Egresos);
                
                return (
                  <tr key={row.id || idx} className="border-b border-[#e0d6c8]/40 hover:bg-[#f4ebd8]/30 transition-colors group">
                    {/* Sticky Action buttons */}
                    <td className="sticky left-0 bg-white/95 z-10 px-2 sm:px-3 py-2 sm:py-2.5 text-center whitespace-nowrap border-r border-[#e0d6c8]/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleEditClick(row)}
                          className="p-1 text-[#6b645c] hover:text-[#8b7355] hover:bg-[#e0d6c8]/40 rounded transition-colors"
                          title="Editar este movimiento"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(row)}
                          className="p-1 text-[#6b645c] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Eliminar este movimiento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap text-[#3e3a35] font-medium">{row.Fecha}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-[#3e3a35] whitespace-nowrap">{row['Prov/Cliente'] || '-'}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold ${
                        row.Cuenta?.toUpperCase() === 'PENDIENTE' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : row.Cuenta?.toUpperCase() === 'BANCO'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {row.Cuenta}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-bold text-emerald-600 font-mono text-[11px] sm:text-xs">
                      {ingresosParsed > 0 ? `$${ingresosParsed.toLocaleString('es-AR')}` : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-bold text-rose-600 font-mono text-[11px] sm:text-xs">
                      {egresosParsed > 0 ? `$${egresosParsed.toLocaleString('es-AR')}` : '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-[#3e3a35] whitespace-nowrap font-medium">{row.Rubro}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border
                        ${row.Subactividad?.toUpperCase() === 'TAMBO' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${row.Subactividad?.toUpperCase() === 'QUESERIA' ? 'bg-amber-50 text-amber-800 border-amber-200' : ''}
                        ${row.Subactividad?.toUpperCase() === 'RECRIA' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${row.Subactividad?.toUpperCase() === 'COMUN' ? 'bg-[#f4ebd8] text-[#6b645c] border-[#e0d6c8]' : ''}
                      `}>
                        {row.Subactividad || 'COMUN'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-[#6b645c] whitespace-nowrap">{row['Subrubro/Producto'] || '-'}</td>
                    
                    {/* Cheese weights */}
                    <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs text-amber-950 bg-amber-50/20">{row.Pecorino ? Number(row.Pecorino).toLocaleString('es-AR') : '-'}</td>
                    <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs text-amber-950 bg-amber-50/20">{row.Manchego ? Number(row.Manchego).toLocaleString('es-AR') : '-'}</td>
                    <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs text-amber-950 bg-amber-50/20">{row.Saborizado ? Number(row.Saborizado).toLocaleString('es-AR') : '-'}</td>
                    <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs text-amber-950 bg-amber-50/20">{row.Ahumado ? Number(row.Ahumado).toLocaleString('es-AR') : '-'}</td>
                    <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs text-amber-950 bg-amber-50/20">{row.Provoleta ? Number(row.Provoleta).toLocaleString('es-AR') : '-'}</td>
                    <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-mono text-[11px] sm:text-xs text-amber-950 bg-amber-50/20">{row.Ricota ? Number(row.Ricota).toLocaleString('es-AR') : '-'}</td>
                    
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-bold text-[#3e3a35] font-mono text-[11px] sm:text-xs">{row.Cantidades || '-'}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-[#6b645c] max-w-[220px] sm:max-w-[280px] truncate" title={row.Observaciones}>{row.Observaciones || '-'}</td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={17} className="px-4 py-12 text-center text-[#6b645c]">
                    No se encontraron transacciones que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
