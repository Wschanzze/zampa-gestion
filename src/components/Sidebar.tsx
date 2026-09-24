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
    w-full flex items-center px-4 py-3 transition-colors font-medium cursor-pointer
    ${isCollapsed ? 'justify-center' : 'space-x-3'}
    ${isSubItem && !isCollapsed ? 'pl-11' : ''}
    ${activeTab === tabId 
      ? 'bg-white/90 text-[#3e3a35] shadow-sm border border-[#e0d6c8] rounded-xl' 
      : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm rounded-xl'
    }
  `;

  return (
    <aside className={`
      hidden md:flex flex-col relative z-20 flex-shrink-0 overflow-visible transition-all duration-300
      bg-[#f4ebd8] border-r border-[#e0d6c8] shadow-sm
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}>
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-[#e0d6c8] text-[#6b645c] hover:text-[#3e3a35] rounded-full p-1 shadow-md z-30 flex items-center justify-center transition-transform"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Cheese Sidebar Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 bg-center bg-no-repeat bg-cover z-0 filter blur-[2px]"
        style={{ backgroundImage: 'url("/IMG_9858.JPG")' }}
      />
      
      <div className="p-5 flex flex-col items-center relative z-10 min-h-[120px]">
        <img 
          src="/logo negro.png" 
          alt="Zampa Gestión" 
          className={`transition-all duration-300 opacity-90 mix-blend-multiply ${isCollapsed ? 'w-10 mb-2' : 'w-20 mb-3'}`} 
        />
        {!isCollapsed && (
          <>
            <h1 className="text-lg font-bold text-center text-[#3e3a35] leading-tight">Gestión Tambo</h1>
            <p className="text-[#8b7355] text-[10px] font-bold tracking-widest uppercase mt-0.5 text-center">Ovino & Quesería</p>
          </>
        )}
      </div>
      
      <nav className="flex-1 px-3 space-y-1.5 relative z-10 overflow-y-auto pb-4 custom-scrollbar">
        <div onClick={() => setActiveTab('dashboard')} className={navItemClass('dashboard')}>
          <LayoutDashboard size={20} className="flex-shrink-0" />
          {!isCollapsed && <span>Dashboard</span>}
        </div>
        
        <div onClick={() => setActiveTab('queseria')} className={navItemClass('queseria')}>
          <PackageCheck size={20} className="flex-shrink-0" />
          {!isCollapsed && <span>Quesería</span>}
        </div>
        
        <div onClick={() => setActiveTab('cuentas-corrientes')} className={navItemClass('cuentas-corrientes')}>
          <WalletCards size={20} className="flex-shrink-0" />
          {!isCollapsed && <span>Cuentas Corrientes</span>}
        </div>

        <div onClick={() => setActiveTab('cashflow')} className={navItemClass('cashflow')}>
          <LineChart size={20} className="flex-shrink-0" />
          {!isCollapsed && <span>Flujo de Caja</span>}
        </div>
        
        <div onClick={() => setActiveTab('transactions')} className={navItemClass('transactions')}>
          <TableProperties size={20} className="flex-shrink-0" />
          {!isCollapsed && <span>Base de Datos</span>}
        </div>

        {/* Separator */}
        <div className="pt-3 pb-1">
          <div className="border-t border-[#e0d6c8]/60"></div>
        </div>

        {/* Settings Accordion */}
        <div>
          <div 
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setConfigOpen(true);
              } else {
                setConfigOpen(!configOpen);
              }
            }}
            className={`w-full flex items-center px-4 py-3 transition-colors font-medium cursor-pointer rounded-xl text-[#5c544d] hover:bg-white/50 backdrop-blur-sm ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            <div className="flex items-center space-x-3">
              <Settings size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>Configuración</span>}
            </div>
            {!isCollapsed && (
              <div className="text-[#8b7355]">
                {configOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            )}
          </div>
          
          {/* Submenus */}
          {!isCollapsed && configOpen && (
            <div className="mt-1 space-y-1">
              <div onClick={() => setActiveTab('listas')} className={navItemClass('listas', true)}>
                <ListTodo size={16} className="flex-shrink-0 text-[#8b7355]" />
                <span className="text-sm">Listas y Parámetros</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="p-4 relative z-10 border-t border-[#e0d6c8]/60">
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center px-4 py-2 text-rose-700 bg-rose-50/50 hover:bg-rose-100 rounded-lg transition-colors font-semibold ${isCollapsed ? 'justify-center' : 'space-x-2'}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
