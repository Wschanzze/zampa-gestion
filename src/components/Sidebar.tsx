import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  ChevronUp,
  Beaker,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onNavigate?: () => void;
  onNewTransaction?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, onNavigate, onNewTransaction }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isConfigRoute = location.pathname.startsWith('/configuracion') || location.pathname === '/listas';
  const [configOpen, setConfigOpen] = useState(isConfigRoute);

  useEffect(() => {
    if (isConfigRoute) {
      setConfigOpen(true);
    }
  }, [isConfigRoute]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (path === '/datos') {
      return location.pathname === '/datos' || location.pathname === '/transactions';
    }
    if (path === '/flujo-caja') {
      return location.pathname === '/flujo-caja' || location.pathname === '/cashflow';
    }
    if (path === '/configuracion/parametros') {
      return location.pathname === '/configuracion/parametros' || location.pathname === '/listas';
    }
    return location.pathname.startsWith(path);
  };

  const handleItemClick = (path: string) => {
    navigate(path);
    if (onNavigate) {
      onNavigate();
    }
  };

  const navItemClass = (path: string, isSubItem = false) => `
    group flex items-center w-full px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer relative z-10 overflow-hidden
    ${isCollapsed ? 'justify-center' : 'space-x-3'}
    ${isSubItem && !isCollapsed ? 'pl-9' : ''}
    ${isActive(path) 
      ? 'bg-white/80 text-[#2b2824] shadow-sm border border-[#e0d6c8] font-bold' 
      : 'text-[#4a443c] font-semibold hover:bg-white/50 hover:text-[#2b2824]'
    }
  `;

  return (
    <aside 
      className={`
        hidden md:flex flex-col relative z-20 flex-shrink-0 bg-[#f4ebd8] border-r border-[#e0d6c8] transition-all duration-300
        ${isCollapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Cheese Sidebar Background */}
        <div 
          className="absolute inset-0 opacity-20 bg-center bg-no-repeat bg-cover filter blur-[2px]"
          style={{ backgroundImage: 'url("/IMG_9858.JPG")' }}
        />
        {/* Top Fade to White */}
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white via-white/80 to-transparent" />
      </div>

      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 bg-[#f4ebd8] border border-[#e0d6c8] text-[#8b7355] hover:text-[#2b2824] hover:bg-white rounded-full p-1 shadow-sm z-30 flex items-center justify-center transition-transform hover:scale-110"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header / Brand */}
      <div className={`flex flex-col items-center border-b border-[#e0d6c8]/60 px-3 pt-5 relative z-10 transition-all duration-300 ${isCollapsed ? 'pb-4' : 'pb-6'}`}>
        <img 
          src="/logo negro.png" 
          alt="Zampa" 
          className={`transition-all duration-300 object-contain mix-blend-multiply opacity-95 ${isCollapsed ? 'w-11 h-11' : 'w-28 h-28 mb-2'}`} 
        />
        <div className={`flex flex-col items-center text-center transition-all duration-300 origin-top overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0 scale-y-0 m-0' : 'max-h-28 opacity-100 scale-y-100 mt-1'}`}>
          <span className="text-base font-extrabold text-[#2b2824] tracking-tight leading-normal whitespace-nowrap">ZAMPA GESTIÓN</span>
          <span className="text-[11px] text-[#8b7355] font-bold tracking-widest uppercase mt-0.5 leading-normal whitespace-nowrap">Ovino & Quesería</span>
        </div>
      </div>
      
      {/* Quick Action */}
      {onNewTransaction && (
        <div className="px-3 pt-4 pb-2 relative z-10 border-b border-[#e0d6c8]/40 mx-2 mb-2">
          <button 
            onClick={onNewTransaction}
            title="Registrar Movimiento"
            className={`w-full flex items-center justify-center space-x-2 bg-[#8b7355] text-white py-2.5 rounded-xl hover:bg-[#7a6448] shadow-sm transition-all font-bold ${isCollapsed ? 'px-0' : 'px-2'}`}
          >
            <Plus size={18} className="flex-shrink-0" />
            <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>Nuevo Mov.</span>
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
        <div onClick={() => handleItemClick('/dashboard')} className={navItemClass('/dashboard')} title="Dashboard">
          <LayoutDashboard size={18} className={`flex-shrink-0 ${isActive('/dashboard') ? 'text-[#2b2824]' : 'text-[#8b7355] group-hover:text-[#2b2824]'}`} />
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Dashboard</span>
        </div>
        
        <div onClick={() => handleItemClick('/queseria')} className={navItemClass('/queseria')} title="Quesería">
          <PackageCheck size={18} className={`flex-shrink-0 ${isActive('/queseria') ? 'text-[#2b2824]' : 'text-[#8b7355] group-hover:text-[#2b2824]'}`} />
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Quesería</span>
        </div>

        <div onClick={() => handleItemClick('/produccion')} className={navItemClass('/produccion')} title="Producción">
          <Beaker size={18} className={`flex-shrink-0 ${isActive('/produccion') ? 'text-[#2b2824]' : 'text-[#8b7355] group-hover:text-[#2b2824]'}`} />
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Producción</span>
        </div>
        
        <div onClick={() => handleItemClick('/cuentas-corrientes')} className={navItemClass('/cuentas-corrientes')} title="Cuentas Corrientes">
          <WalletCards size={18} className={`flex-shrink-0 ${isActive('/cuentas-corrientes') ? 'text-[#2b2824]' : 'text-[#8b7355] group-hover:text-[#2b2824]'}`} />
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Ctas. Corrientes</span>
        </div>

        <div onClick={() => handleItemClick('/flujo-caja')} className={navItemClass('/flujo-caja')} title="Flujo de Caja">
          <LineChart size={18} className={`flex-shrink-0 ${isActive('/flujo-caja') ? 'text-[#2b2824]' : 'text-[#8b7355] group-hover:text-[#2b2824]'}`} />
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Flujo de Caja</span>
        </div>
        
        <div onClick={() => handleItemClick('/datos')} className={navItemClass('/datos')} title="Base de Datos">
          <TableProperties size={18} className={`flex-shrink-0 ${isActive('/datos') ? 'text-[#2b2824]' : 'text-[#8b7355] group-hover:text-[#2b2824]'}`} />
          <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Base de Datos</span>
        </div>
      </nav>

      {/* Footer Navigation (Settings & Logout) */}
      <div className="p-3 border-t border-[#e0d6c8]/60 bg-white/30 backdrop-blur-sm relative z-10">
        
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
            title="Configuración"
            className={`group flex items-center w-full px-3 py-2 text-sm font-semibold text-[#4a443c] hover:bg-white/60 hover:text-[#2b2824] rounded-md transition-all duration-200 cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
              <Settings size={18} className="flex-shrink-0 text-[#8b7355] group-hover:text-[#2b2824]" />
              <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Configuración</span>
            </div>
            {!isCollapsed && (
              <div className="text-[#8b7355]">
                {configOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            )}
          </div>
          
          <div className={`transition-all duration-300 overflow-hidden ${!isCollapsed && configOpen ? 'max-h-20 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0 m-0'}`}>
            <div onClick={() => handleItemClick('/configuracion/parametros')} className={navItemClass('/configuracion/parametros', true)}>
              <ListTodo size={16} className={`flex-shrink-0 ${isActive('/configuracion/parametros') ? 'text-[#2b2824]' : 'text-[#8b7355]'}`} />
              <span className="whitespace-nowrap">Parámetros</span>
            </div>
          </div>
        </div>

        {/* User Account / Logout */}
        <div className="pt-2 border-t border-[#e0d6c8]/50 mt-1">
          <button 
            onClick={handleLogout}
            title="Cerrar Sesión"
            className={`group flex items-center w-full px-3 py-2 text-sm font-semibold text-[#4a443c] hover:bg-red-50/90 hover:text-red-700 rounded-md transition-all duration-200 overflow-hidden ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
          >
            <LogOut size={18} className="flex-shrink-0 text-[#8b7355] group-hover:text-red-600" />
            <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Cerrar Sesión</span>
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
