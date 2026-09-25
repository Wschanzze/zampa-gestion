import { useState, useMemo } from 'react';
import { useListas } from '../lib/api';
import { 
  Users, 
  Tag, 
  Package, 
  WalletCards, 
  Layers, 
  Plus, 
  Trash2, 
  Search, 
  Pencil, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

type TabKey = 'entidades' | 'rubros' | 'subrubros' | 'cuentas' | 'unidades';

interface TabConfig {
  key: TabKey;
  label: string;
  tableName: string;
  icon: any;
  singular: string;
  description: string;
  hasType?: boolean;
}

const TABS: TabConfig[] = [
  {
    key: 'entidades',
    label: 'Clientes y Proveedores',
    tableName: 'zampa_entidades',
    icon: Users,
    singular: 'Cliente / Proveedor',
    description: 'Entidades comerciales que intervienen en las operaciones de compra, venta y cuentas corrientes.',
    hasType: true
  },
  {
    key: 'rubros',
    label: 'Rubros Principales',
    tableName: 'zampa_rubros',
    icon: Tag,
    singular: 'Rubro',
    description: 'Categorías principales para el flujo de fondos y los análisis de ingresos y egresos.'
  },
  {
    key: 'subrubros',
    label: 'Subrubros y Productos',
    tableName: 'zampa_subrubros',
    icon: Package,
    singular: 'Subrubro / Producto',
    description: 'Insumos, artículos específicos o clasificaciones secundarias para el registro de movimientos.'
  },
  {
    key: 'cuentas',
    label: 'Cuentas Financieras',
    tableName: 'zampa_cuentas',
    icon: WalletCards,
    singular: 'Cuenta',
    description: 'Cajas, cuentas bancarias y medios de pago utilizados para registrar la cancelación o devengo.'
  },
  {
    key: 'unidades',
    label: 'Unidades de Negocio',
    tableName: 'zampa_unidades_negocio',
    icon: Layers,
    singular: 'Unidad de Negocio',
    description: 'Centros de costos y actividades productivas según la metodología de costeo agropecuario.'
  }
];

const Listas = () => {
  const { 
    entidades, 
    rubros, 
    subrubros, 
    cuentas, 
    unidades, 
    loading, 
    addEntity, 
    updateEntity, 
    deleteEntity 
  } = useListas();

  const [activeTab, setActiveTab] = useState<TabKey>('entidades');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'TODOS' | 'CLIENTE' | 'PROVEEDOR' | 'AMBOS'>('TODOS');

  // Add form states
  const [newName, setNewName] = useState('');
  const [selectedType, setSelectedType] = useState<'CLIENTE' | 'PROVEEDOR' | 'AMBOS'>('CLIENTE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'CLIENTE' | 'PROVEEDOR' | 'AMBOS'>('CLIENTE');

  // Delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const currentTabConfig = useMemo(() => {
    return TABS.find(t => t.key === activeTab) || TABS[0];
  }, [activeTab]);

  const rawList = useMemo(() => {
    switch (activeTab) {
      case 'entidades': return entidades;
      case 'rubros': return rubros;
      case 'subrubros': return subrubros;
      case 'cuentas': return cuentas;
      case 'unidades': return unidades;
      default: return [];
    }
  }, [activeTab, entidades, rubros, subrubros, cuentas, unidades]);

  // Filtered and searched list
  const filteredList = useMemo(() => {
    return rawList.filter(item => {
      const matchesSearch = item.nombre?.toLowerCase().includes(searchTerm.toLowerCase().trim());
      if (activeTab === 'entidades' && filterType !== 'TODOS') {
        const matchesType = item.tipo?.toUpperCase() === filterType;
        return matchesSearch && matchesType;
      }
      return matchesSearch;
    });
  }, [rawList, searchTerm, activeTab, filterType]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const payload: any = { nombre: newName.trim() };
    if (currentTabConfig.hasType) {
      payload.tipo = selectedType;
    }

    const res = await addEntity(currentTabConfig.tableName, payload);
    if (res) {
      setNewName('');
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditName(item.nombre || '');
    if (item.tipo) {
      setEditType(item.tipo);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const payload: any = { nombre: editName.trim() };
    if (currentTabConfig.hasType) {
      payload.tipo = editType;
    }

    await updateEntity(currentTabConfig.tableName, id, payload);
    setEditingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteEntity(currentTabConfig.tableName, itemToDelete.id);
    setItemToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#6b645c] space-y-2">
        <div className="w-8 h-8 border-3 border-[#8b7355] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold">Cargando listas del sistema...</span>
      </div>
    );
  }

  const getTypeBadge = (tipo?: string) => {
    switch (tipo) {
      case 'CLIENTE':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Cliente</span>;
      case 'PROVEEDOR':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Proveedor</span>;
      case 'AMBOS':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">Cliente y Proveedor</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white/95 p-4 sm:p-6 rounded-2xl border border-[#e0d6c8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-[#f4ebd8] text-[#8b7355] rounded-xl">
              <Sparkles size={18} />
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#2b2824] tracking-tight">
              Parámetros y Tablas Maestras
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#6b645c] mt-1.5 max-w-2xl">
            Gestioná los catálogos relacionales del tambo. Los cambios se sincronizan en tiempo real con las listas desplegables de carga y cuentas corrientes.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#faf9f6] px-3.5 py-2 rounded-xl border border-[#e0d6c8] self-start md:self-auto">
          <HelpCircle size={16} className="text-[#8b7355]" />
          <span className="text-xs text-[#2b2824] font-bold">
            {rawList.length} {currentTabConfig.singular.toLowerCase()}s activos
          </span>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          let count = 0;
          if (tab.key === 'entidades') count = entidades.length;
          else if (tab.key === 'rubros') count = rubros.length;
          else if (tab.key === 'subrubros') count = subrubros.length;
          else if (tab.key === 'cuentas') count = cuentas.length;
          else if (tab.key === 'unidades') count = unidades.length;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchTerm('');
                setEditingId(null);
              }}
              className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                isSelected
                  ? 'bg-[#8b7355] text-white border-[#8b7355] shadow-sm'
                  : 'bg-white/80 text-[#6b645c] border-[#e0d6c8] hover:bg-white hover:text-[#2b2824]'
              }`}
            >
              <Icon size={16} className={isSelected ? 'text-white' : 'text-[#8b7355]'} />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                isSelected ? 'bg-white/20 text-white' : 'bg-[#f4ebd8] text-[#8b7355]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Section Content Card */}
      <div className="bg-white/95 rounded-2xl border border-[#e0d6c8] shadow-sm overflow-hidden">
        
        {/* Tab Description & Quick Add Form Bar */}
        <div className="p-4 sm:p-6 border-b border-[#e0d6c8] bg-[#faf9f6]/70">
          <div className="mb-4">
            <h4 className="text-base font-bold text-[#2b2824] flex items-center space-x-2">
              <span>{currentTabConfig.label}</span>
            </h4>
            <p className="text-xs text-[#6b645c] mt-0.5">{currentTabConfig.description}</p>
          </div>

          {/* Add Form */}
          <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-2.5">
            {currentTabConfig.hasType && (
              <div className="sm:w-48 flex-shrink-0">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full h-11 px-3 bg-white border border-[#e0d6c8] rounded-xl text-xs sm:text-sm font-bold text-[#2b2824] focus:outline-none focus:ring-2 focus:ring-[#8b7355]"
                >
                  <option value="CLIENTE">Rol: Cliente</option>
                  <option value="PROVEEDOR">Rol: Proveedor</option>
                  <option value="AMBOS">Rol: Ambos</option>
                </select>
              </div>
            )}

            <div className="relative flex-1">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`Nuevo nombre de ${currentTabConfig.singular.toLowerCase()}...`}
                className="w-full h-11 px-4 bg-white border border-[#e0d6c8] rounded-xl text-xs sm:text-sm text-[#2b2824] font-medium placeholder-[#6b645c]/60 focus:outline-none focus:ring-2 focus:ring-[#8b7355]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="h-11 px-5 bg-[#8b7355] hover:bg-[#705b42] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs flex items-center justify-center space-x-2 cursor-pointer flex-shrink-0"
            >
              <Plus size={16} />
              <span>Agregar {currentTabConfig.singular}</span>
            </button>
          </form>
        </div>

        {/* Search and Filter Sub-header */}
        <div className="p-3 sm:p-4 border-b border-[#e0d6c8]/60 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b7355]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar en ${currentTabConfig.label.toLowerCase()}...`}
              className="w-full pl-9 pr-8 py-2 bg-[#faf9f6] border border-[#e0d6c8] rounded-xl text-xs sm:text-sm text-[#2b2824] placeholder-[#6b645c]/60 focus:outline-none focus:ring-1 focus:ring-[#8b7355]"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter Pills for Entidades */}
          {currentTabConfig.hasType && (
            <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto">
              {(['TODOS', 'CLIENTE', 'PROVEEDOR', 'AMBOS'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterType === type
                      ? 'bg-[#f4ebd8] text-[#8b7355] border border-[#e0d6c8]'
                      : 'text-[#6b645c] hover:bg-gray-100'
                  }`}
                >
                  {type === 'TODOS' ? 'Todos' : type === 'CLIENTE' ? 'Clientes' : type === 'PROVEEDOR' ? 'Proveedores' : 'Ambos'}
                </button>
              ))}
            </div>
          )}

          <div className="text-xs text-[#6b645c] font-medium self-end sm:self-auto">
            Mostrando <span className="font-bold text-[#2b2824]">{filteredList.length}</span> de {rawList.length}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="text-[11px] text-[#6b645c] uppercase bg-[#f4ebd8] border-b border-[#e0d6c8] sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 sm:px-6 py-3 font-semibold w-16 text-center">#</th>
                <th className="px-4 sm:px-6 py-3 font-semibold">Nombre del Registro</th>
                {currentTabConfig.hasType && (
                  <th className="px-4 sm:px-6 py-3 font-semibold w-48">Tipo / Rol</th>
                )}
                <th className="px-4 sm:px-6 py-3 font-semibold w-28 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0d6c8]/40">
              {filteredList.map((item, idx) => {
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id || idx} className="hover:bg-[#f4ebd8]/20 transition-colors">
                    <td className="px-4 sm:px-6 py-3 text-center font-mono text-xs text-[#8b7355] font-semibold">
                      {idx + 1}
                    </td>

                    <td className="px-4 sm:px-6 py-3 font-bold text-[#2b2824]">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-3 py-1.5 border border-[#8b7355] rounded-lg text-sm text-[#2b2824] w-full max-w-sm focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-sm">{item.nombre}</span>
                      )}
                    </td>

                    {currentTabConfig.hasType && (
                      <td className="px-4 sm:px-6 py-3">
                        {isEditing ? (
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as any)}
                            className="px-2 py-1.5 border border-[#8b7355] rounded-lg text-xs font-bold text-[#2b2824]"
                          >
                            <option value="CLIENTE">Cliente</option>
                            <option value="PROVEEDOR">Proveedor</option>
                            <option value="AMBOS">Ambos</option>
                          </select>
                        ) : (
                          getTypeBadge(item.tipo)
                        )}
                      </td>
                    )}

                    <td className="px-4 sm:px-6 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                            title="Guardar cambios"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                            title="Cancelar edición"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-[#6b645c] hover:text-[#8b7355] hover:bg-[#f4ebd8] rounded-lg transition-colors cursor-pointer"
                            title="Editar nombre"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setItemToDelete({ id: item.id, name: item.nombre })}
                            className="p-1.5 text-[#6b645c] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar de la lista"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={currentTabConfig.hasType ? 4 : 3} className="px-6 py-12 text-center text-[#6b645c]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-[#f4ebd8]/70 rounded-full text-[#8b7355]">
                        <AlertCircle size={24} />
                      </div>
                      <p className="text-sm font-bold text-[#2b2824]">
                        {searchTerm ? 'No se encontraron resultados para la búsqueda' : `No hay ${currentTabConfig.label.toLowerCase()} cargados`}
                      </p>
                      <p className="text-xs text-[#6b645c] max-w-sm">
                        {searchTerm ? 'Probá con otra palabra clave o limpiá el filtro.' : 'Utilizá el formulario superior para dar de alta el primer elemento.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#e0d6c8] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 size={22} />
              </div>
              <h4 className="text-base font-bold text-[#2b2824]">Confirmar Eliminación</h4>
            </div>

            <p className="text-xs sm:text-sm text-[#6b645c]">
              ¿Estás seguro de que querés eliminar <span className="font-bold text-[#2b2824]">"{itemToDelete.name}"</span> de {currentTabConfig.label.toLowerCase()}?
            </p>

            <div className="p-3 bg-[#faf9f6] rounded-xl border border-[#e0d6c8] text-[11px] text-[#6b645c]">
              ⚠️ Los movimientos históricos que ya utilicen este nombre se mantendrán, pero dejará de estar disponible en las opciones desplegables futuras.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-[#e0d6c8] text-[#6b645c] rounded-xl text-xs sm:text-sm font-bold hover:bg-[#f4ebd8] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs cursor-pointer"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Listas;
