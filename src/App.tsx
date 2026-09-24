import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
// @ts-ignore
import { LayoutDashboard, TableProperties, LineChart, WalletCards, PackageCheck, Menu, X, ListTodo, Beaker } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CashFlow from './pages/CashFlow';
import CuentasCorrientes from './pages/CuentasCorrientes';
import Queseria from './pages/Queseria';
import Produccion from './pages/Produccion';
import Listas from './pages/Listas';
import Login from './components/Login';
import Sidebar from './components/Sidebar';

import { useSupabaseTransactions } from './lib/api';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Mover este Hook ARRIBA de los condicionales (regla de React)
  const { 
    data, 
    loading, 
    addTransaction: handleAddTransaction, 
    updateTransaction: handleUpdateTransaction, 
    deleteTransaction: handleDeleteTransaction,
    registerPayment 
  } = useSupabaseTransactions();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#8b7355] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const handleMobileNav = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const getPageTitle = (pathname: string) => {
    if (pathname === '/' || pathname === '/dashboard') return 'Resumen por Unidad de Negocio';
    if (pathname === '/queseria') return 'Gestión de Quesería & Control de Cámara';
    if (pathname === '/produccion') return 'Producción y Rendimiento';
    if (pathname === '/cuentas-corrientes') return 'Cuentas Corrientes y Saldos';
    if (pathname === '/flujo-caja' || pathname === '/cashflow') return 'Flujo de Caja Mensual';
    if (pathname === '/datos' || pathname === '/transactions') return 'Movimientos (Base de Datos)';
    if (pathname === '/configuracion/parametros' || pathname === '/listas') return 'Listas y Parámetros del Sistema';
    return 'Gestión Tambo Ovino';
  };

  const getMobileBadge = (pathname: string) => {
    if (pathname === '/' || pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/queseria') return 'Quesería';
    if (pathname === '/produccion') return 'Producción';
    if (pathname === '/cuentas-corrientes') return 'Ctas. Ctes.';
    if (pathname === '/flujo-caja' || pathname === '/cashflow') return 'Flujo Caja';
    if (pathname === '/datos' || pathname === '/transactions') return 'Base Datos';
    if (pathname === '/configuracion/parametros' || pathname === '/listas') return 'Parámetros';
    return 'Zampa';
  };

  const isCurrent = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    if (path === '/datos') return location.pathname === '/datos' || location.pathname === '/transactions';
    if (path === '/flujo-caja') return location.pathname === '/flujo-caja' || location.pathname === '/cashflow';
    if (path === '/produccion') return location.pathname === '/produccion';
    if (path === '/configuracion/parametros') return location.pathname === '/configuracion/parametros' || location.pathname === '/listas';
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#faf9f6] overflow-hidden">
      
      {/* Mobile Top App Bar */}
      <div className="md:hidden bg-[#f4ebd8] border-b border-[#e0d6c8] px-4 py-2.5 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-[#3e3a35] hover:bg-[#e0d6c8]/60 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <img src="/logo negro.png" alt="Zampa Gestión" className="w-8 h-8 object-contain mix-blend-multiply" />
          <div>
            <h1 className="text-sm font-bold text-[#3e3a35] leading-tight">Gestión Tambo</h1>
            <span className="text-[10px] text-[#6b645c] leading-none block">Ovino & Quesería</span>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2 py-0.5 bg-white/90 rounded-full text-[#8b7355] border border-[#e0d6c8]">
          {getMobileBadge(location.pathname)}
        </span>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <aside className={`fixed top-0 bottom-0 left-0 w-72 bg-[#f4ebd8] z-50 flex flex-col border-r border-[#e0d6c8] shadow-2xl transition-transform duration-300 md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } overflow-hidden`}>
        {/* Cheese Sidebar Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 bg-center bg-no-repeat bg-cover z-0 filter blur-[2px]"
          style={{ backgroundImage: 'url("/IMG_9858.JPG")' }}
        />

        <div className="p-5 flex items-center justify-between border-b border-[#e0d6c8]/70 relative z-10">
          <div className="flex items-center space-x-2.5">
            <img src="/logo negro.png" alt="Zampa Gestión" className="w-10 h-10 object-contain mix-blend-multiply" />
            <div>
              <h2 className="text-base font-bold text-[#3e3a35]">Gestión Tambo</h2>
              <p className="text-[#6b645c] text-xs">Ovino & Quesería</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 text-[#6b645c] hover:text-[#3e3a35] hover:bg-[#e0d6c8]/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 relative z-10">
          <button
            onClick={() => handleMobileNav('/dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              isCurrent('/dashboard')
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleMobileNav('/queseria')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              isCurrent('/queseria')
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <PackageCheck size={20} />
            <span>Quesería</span>
          </button>

          <button
            onClick={() => handleMobileNav('/produccion')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              isCurrent('/produccion')
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <Beaker size={20} />
            <span>Producción</span>
          </button>
          
          <button
            onClick={() => handleMobileNav('/cuentas-corrientes')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              isCurrent('/cuentas-corrientes')
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <WalletCards size={20} />
            <span>Cuentas Corrientes</span>
          </button>

          <button
            onClick={() => handleMobileNav('/flujo-caja')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              isCurrent('/flujo-caja')
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <LineChart size={20} />
            <span>Flujo de Caja</span>
          </button>
          
          <button
            onClick={() => handleMobileNav('/datos')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              isCurrent('/datos')
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <TableProperties size={20} />
            <span>Base de Datos</span>
          </button>

          <div className="pt-4 mt-4 border-t border-[#e0d6c8]/50">
            <button
              onClick={() => handleMobileNav('/configuracion/parametros')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                isCurrent('/configuracion/parametros')
                  ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                  : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
              }`}
            >
              <ListTodo size={20} />
              <span>Listas y Parámetros</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Desktop Sidebar Component */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[#fdfdfc] flex flex-col h-full">
        {/* Watermark Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.02] bg-center bg-no-repeat bg-cover z-0"
          style={{ backgroundImage: 'url("/ovejas_render.png")' }}
        />
        
        <div className="relative z-10 flex flex-col flex-1">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-[#e0d6c8] px-4 sm:px-6 md:px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-[#3e3a35] tracking-tight truncate">
              {getPageTitle(location.pathname)}
            </h2>
            <span className="text-[11px] font-semibold text-[#8b7355] bg-[#f4ebd8]/60 px-2.5 py-1 rounded-md hidden sm:inline border border-[#e0d6c8]/60">
              Gestión Ovina
            </span>
          </header>
          
          {/* Content Body with extra bottom padding on mobile for bottom bar */}
          <div className="p-3 sm:p-5 md:p-8 pb-20 md:pb-8 flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-[#6b645c] space-y-2">
                <div className="w-8 h-8 border-3 border-[#8b7355] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-semibold">Cargando datos desde Supabase...</span>
              </div>
            ) : (
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <Dashboard 
                      data={data} 
                      onNavigateToCuentas={() => navigate('/cuentas-corrientes')} 
                    />
                  } 
                />
                <Route path="/queseria" element={<Queseria data={data} />} />
                <Route path="/produccion" element={<Produccion />} />
                <Route 
                  path="/cuentas-corrientes" 
                  element={
                    <CuentasCorrientes 
                      data={data} 
                      onRegisterPayment={registerPayment} 
                    />
                  } 
                />
                <Route path="/flujo-caja" element={<CashFlow data={data} />} />
                <Route path="/cashflow" element={<Navigate to="/flujo-caja" replace />} />
                <Route 
                  path="/datos" 
                  element={
                    <Transactions 
                      data={data} 
                      onAdd={handleAddTransaction} 
                      onUpdate={handleUpdateTransaction}
                      onDelete={handleDeleteTransaction}
                    />
                  } 
                />
                <Route path="/transactions" element={<Navigate to="/datos" replace />} />
                <Route path="/configuracion/parametros" element={<Listas />} />
                <Route path="/listas" element={<Navigate to="/configuracion/parametros" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e0d6c8] z-30 flex items-center justify-around py-1.5 px-1 shadow-lg">
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            isCurrent('/dashboard') ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] mt-0.5 font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => navigate('/queseria')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            isCurrent('/queseria') ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
          }`}
        >
          <PackageCheck size={18} />
          <span className="text-[9px] mt-0.5 font-medium">Quesería</span>
        </button>

        <button
          onClick={() => navigate('/cuentas-corrientes')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            isCurrent('/cuentas-corrientes') ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
          }`}
        >
          <WalletCards size={18} />
          <span className="text-[9px] mt-0.5 font-medium">Ctas. Ctes.</span>
        </button>

        <button
          onClick={() => navigate('/flujo-caja')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            isCurrent('/flujo-caja') ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
          }`}
        >
          <LineChart size={18} />
          <span className="text-[9px] mt-0.5 font-medium">Flujo Caja</span>
        </button>

        <button
          onClick={() => navigate('/datos')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            isCurrent('/datos') ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
          }`}
        >
          <TableProperties size={18} />
          <span className="text-[9px] mt-0.5 font-medium">Base Datos</span>
        </button>
      </nav>

    </div>
  );
}

export default App;
