import { useState } from 'react';
import { useListas } from '../lib/api';
import { Plus, Trash2 } from 'lucide-react';

const Listas = () => {
  const { entidades, rubros, subrubros, cuentas, unidades, loading, addEntity, deleteEntity } = useListas();
  const [newItem, setNewItem] = useState('');
  const [itemType, setItemType] = useState('CLIENTE');

  const handleAdd = async (table: string, extraData = {}) => {
    if (!newItem.trim()) return;
    await addEntity(table, { nombre: newItem.trim(), ...extraData });
    setNewItem('');
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Cargando listas...</div>;
  }

  const renderSection = (title: string, table: string, items: any[], hasType = false) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      
      <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
        {hasType && (
          <select 
            value={itemType} 
            onChange={(e) => setItemType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="CLIENTE">Cliente</option>
            <option value="PROVEEDOR">Proveedor</option>
            <option value="AMBOS">Ambos</option>
          </select>
        )}
        <input 
          type="text" 
          placeholder={`Nuevo item para ${title}...`}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd(table, hasType ? { tipo: itemType } : {});
              e.currentTarget.value = '';
            }
          }}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button 
          onClick={() => handleAdd(table, hasType ? { tipo: itemType } : {})}
          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      <ul className="max-h-60 overflow-y-auto">
        {items.map(item => (
          <li key={item.id} className="px-6 py-3 border-b border-gray-50 flex justify-between items-center hover:bg-gray-50">
            <div>
              <span className="font-medium text-gray-700">{item.nombre}</span>
              {item.tipo && (
                <span className={`ml-3 text-xs px-2 py-1 rounded-full ${
                  item.tipo === 'CLIENTE' ? 'bg-blue-100 text-blue-800' :
                  item.tipo === 'PROVEEDOR' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {item.tipo}
                </span>
              )}
            </div>
            <button 
              onClick={() => deleteEntity(table, item.id)}
              className="text-gray-400 hover:text-rose-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-6 py-4 text-gray-500 text-sm text-center">No hay registros</li>
        )}
      </ul>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {renderSection('Entidades (Clientes/Proveedores)', 'zampa_entidades', entidades, true)}
      {renderSection('Rubros', 'zampa_rubros', rubros)}
      {renderSection('Subrubros / Productos', 'zampa_subrubros', subrubros)}
      {renderSection('Cuentas Financieras', 'zampa_cuentas', cuentas)}
      {renderSection('Unidades de Negocio', 'zampa_unidades_negocio', unidades)}
    </div>
  );
};

export default Listas;
