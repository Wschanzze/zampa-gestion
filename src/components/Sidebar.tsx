import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  TableProperties, 
  LineChart, 
  WalletCards, 
  PackageCheck, 
  ListTodo, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type TabType = 'dashboard' | 'queseria' | 'cuentas-corrientes' | 'cashflow' | 'transactions' | 'listas';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const [configOpen, setConfigOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItemClass = (tabId: string, isSubItem = false) => `
    group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer relative z-10
    ${isCollapsed ? 'justify-center' : 'space-x-3'}
    ${isSubItem && !isCollapsed ? 'pl-9' : ''}
    ${activeTab === tabId 
      ? 'bg-white/80 text-[#3e3a35] shadow-sm border border-[#e0d6c8]' 
      : 'text-[#6b645c] hover:bg-white/40 hover:text-[#3e3a35]'
    }
  `;

  return (
    <aside 
      className={`
        hidden md:flex flex-col relative z-20 flex-shrink-0 bg-[#f4ebd8] border-r border-[#e0d6c8] transition-all duration-300 overflow-hidden
        ${isCollapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* Cheese Sidebar Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 bg-center bg-no-repeat bg-cover z-0 filter blur-[2px]"
        style={{ backgroundImage: 'url("/IMG_9858.JPG")' }}
      />

      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 bg-[#f4ebd8] border border-[#e0d6c8] text-[#8b7355] hover:text-[#3e3a35] hover:bg-white rounded-full p-1 shadow-sm z-30 flex items-center justify-center transition-transform hover:scale-110"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header / Brand */}
      <div className="h-16 flex items-center border-b border-[#e0d6c8]/60 px-4 mt-2 relative z-10">
        <img 
          src="/logo negro.png" 
          alt="Zampa" 
          className={`transition-all duration-300 object-contain mix-blend-multiply opacity-90 ${isCollapsed ? 'w-8 h-8 mx-auto' : 'w-8 h-8 mr-3'}`} 
        />
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-[#3e3a35] tracking-tight leading-none truncate">ZAMPA GESTIÓN</span>
            <span className="text-[10px] text-[#8b7355] font-bold tracking-widest uppercase mt-1 truncate">Ovino & Quesería</span>
          </div>
        )}
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
        <div onClick={() => setActiveTab('dashboard')} className={navItemClass('dashboard')}>
          <LayoutDashboard size={18} className={`flex-shrink-0 ${activeTab === 'dashboard' ? 'text-[#3e3a35]' : 'text-[#8b7355] group-hover:text-[#3e3a35]'}`} />
          {!isCollapsed && <span>Dashboard</span>}
        </div>
        
        <div onClick={() => setActiveTab('queseria')} className={navItemClass('queseria')}>
          <PackageCheck size={18} className={`flex-shrink-0 ${activeTab === 'queseria' ? 'text-[#3e3a35]' : 'text-[#8b7355] group-hover:text-[#3e3a35]'}`} />
          {!isCollapsed && <span>Quesería</span>}
        </div>
        
        <div onClick={() => setActiveTab('cuentas-corrientes')} className={navItemClass('cuentas-corrientes')}>
          <WalletCards size={18} className={`flex-shrink-0 ${activeTab === 'cuentas-corrientes' ? 'text-[#3e3a35]' : 'text-[#8b7355] group-hover:text-[#3e3a35]'}`} />
          {!isCollapsed && <span>Ctas. Corrientes</span>}
        </div>

        <div onClick={() => setActiveTab('cashflow')} className={navItemClass('cashflow')}>
          <LineChart size={18} className={`flex-shrink-0 ${activeTab === 'cashflow' ? 'text-[#3e3a35]' : 'text-[#8b7355] group-hover:text-[#3e3a35]'}`} />
          {!isCollapsed && <span>Flujo de Caja</span>}
        </div>
        
        <div onClick={() => setActiveTab('transactions')} className={navItemClass('transactions')}>
          <TableProperties size={18} className={`flex-shrink-0 ${activeTab === 'transactions' ? 'text-[#3e3a35]' : 'text-[#8b7355] group-hover:text-[#3e3a35]'}`} />
          {!isCollapsed && <span>Base de Datos</span>}
        </div>
      </nav>

      {/* Footer Navigation (Settings & Logout) */}
      <div className="p-3 border-t border-[#e0d6c8]/60 bg-white/10 backdrop-blur-sm relative z-10">
        
        {/* Settings Submenu */}
        <div className="mb-2">
          <div 
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setConfigOpen(true);
              } else {
                setConfigOpen(!configOpen);
              }
            }}
            className={`group flex items-center w-full px-3 py-2 text-sm font-medium text-[#6b645c] hover:bg-white/40 hover:text-[#3e3a35] rounded-md transition-all duration-200 cursor-pointer ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            <div className="flex items-center space-x-3">
              <Settings size={18} className="flex-shrink-0 text-[#8b7355] group-hover:text-[#3e3a35]" />
              {!isCollapsed && <span>Configuración</span>}
            </div>
            {!isCollapsed && (
              <div className="text-[#8b7355]">
                {configOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            )}
          </div>
          
          {!isCollapsed && configOpen && (
            <div className="mt-1 mb-2 space-y-1">
              <div onClick={() => setActiveTab('listas')} className={navItemClass('listas', true)}>
                <ListTodo size={16} className={`flex-shrink-0 ${activeTab === 'listas' ? 'text-[#3e3a35]' : 'text-[#8b7355]'}`} />
                <span>Parámetros</span>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Logout */}
        <div className="pt-2 border-t border-[#e0d6c8]/40 mt-1">
          <button 
            onClick={handleLogout}
            className={`group flex items-center w-full px-3 py-2 text-sm font-medium text-[#6b645c] hover:bg-red-50/80 hover:text-red-700 rounded-md transition-all duration-200 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
          >
            <LogOut size={18} className="flex-shrink-0 text-[#8b7355] group-hover:text-red-600" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
