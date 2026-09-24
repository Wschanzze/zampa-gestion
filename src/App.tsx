import { useState } from 'react';
// @ts-ignore
import { LayoutDashboard, TableProperties, LineChart, WalletCards, PackageCheck, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CashFlow from './pages/CashFlow';
import CuentasCorrientes from './pages/CuentasCorrientes';
import Queseria from './pages/Queseria';

import { useSupabaseTransactions } from './lib/api';

type TabType = 'dashboard' | 'queseria' | 'cuentas-corrientes' | 'cashflow' | 'transactions';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { 
    data, 
    loading, 
    addTransaction: handleAddTransaction, 
    updateTransaction: handleUpdateTransaction, 
    deleteTransaction: handleDeleteTransaction,
    registerPayment 
  } = useSupabaseTransactions();

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
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
          {activeTab === 'dashboard' && 'Dashboard'}
          {activeTab === 'queseria' && 'Quesería'}
          {activeTab === 'cuentas-corrientes' && 'Ctas. Ctes.'}
          {activeTab === 'cashflow' && 'Flujo Caja'}
          {activeTab === 'transactions' && 'Base Datos'}
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
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              activeTab === 'dashboard' 
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleTabChange('queseria')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              activeTab === 'queseria' 
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <PackageCheck size={20} />
            <span>Quesería</span>
          </button>
          
          <button
            onClick={() => handleTabChange('cuentas-corrientes')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              activeTab === 'cuentas-corrientes' 
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <WalletCards size={20} />
            <span>Cuentas Corrientes</span>
          </button>

          <button
            onClick={() => handleTabChange('cashflow')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              activeTab === 'cashflow' 
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <LineChart size={20} />
            <span>Flujo de Caja</span>
          </button>
          
          <button
            onClick={() => handleTabChange('transactions')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              activeTab === 'transactions' 
                ? 'bg-white text-[#3e3a35] shadow-sm border border-[#e0d6c8] font-bold' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <TableProperties size={20} />
            <span>Base de Datos</span>
          </button>
        </nav>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#f4ebd8] text-[#3e3a35] flex-col border-r border-[#e0d6c8] shadow-sm relative z-20 flex-shrink-0 overflow-hidden">
        {/* Cheese Sidebar Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 bg-center bg-no-repeat bg-cover z-0 filter blur-[2px]"
          style={{ backgroundImage: 'url("/IMG_9858.JPG")' }}
        />
        
        <div className="p-6 flex flex-col items-center relative z-10">
          <img src="/logo negro.png" alt="Zampa Gestión" className="w-24 mb-4 opacity-90 mix-blend-multiply" />
          <h1 className="text-xl font-bold text-center">Gestión Tambo</h1>
          <p className="text-[#6b645c] text-sm mt-1 text-center font-medium">Ovino & Quesería</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
              activeTab === 'dashboard' 
                ? 'bg-white/90 text-[#3e3a35] shadow-sm border border-[#e0d6c8]' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('queseria')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
              activeTab === 'queseria' 
                ? 'bg-white/90 text-[#3e3a35] shadow-sm border border-[#e0d6c8]' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <PackageCheck size={20} />
            <span>Quesería</span>
          </button>
          
          <button
            onClick={() => setActiveTab('cuentas-corrientes')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
              activeTab === 'cuentas-corrientes' 
                ? 'bg-white/90 text-[#3e3a35] shadow-sm border border-[#e0d6c8]' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <WalletCards size={20} />
            <span>Cuentas Corrientes</span>
          </button>

          <button
            onClick={() => setActiveTab('cashflow')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
              activeTab === 'cashflow' 
                ? 'bg-white/90 text-[#3e3a35] shadow-sm border border-[#e0d6c8]' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <LineChart size={20} />
            <span>Flujo de Caja</span>
          </button>
          
          <button
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
              activeTab === 'transactions' 
                ? 'bg-white/90 text-[#3e3a35] shadow-sm border border-[#e0d6c8]' 
                : 'text-[#5c544d] hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            <TableProperties size={20} />
            <span>Base de Datos</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[#fdfdfc] flex flex-col h-full">
        {/* Watermark Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] bg-center bg-no-repeat bg-cover z-0"
          style={{ backgroundImage: 'url("/ovejas_render.png")' }}
        />
        
        <div className="relative z-10 flex flex-col flex-1">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-[#e0d6c8] px-4 sm:px-6 md:px-8 py-3.5 shadow-xs sticky top-0 z-20 flex items-center justify-between">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#3e3a35] truncate">
              {activeTab === 'dashboard' && 'Resumen por Unidad de Negocio'}
              {activeTab === 'queseria' && 'Gestión de Quesería & Control de Cámara'}
              {activeTab === 'cuentas-corrientes' && 'Cuentas Corrientes y Saldos'}
              {activeTab === 'cashflow' && 'Flujo de Caja Mensual'}
              {activeTab === 'transactions' && 'Movimientos (Base de Datos)'}
            </h2>
            <span className="text-[11px] font-semibold text-[#8b7355] bg-[#f4ebd8]/60 px-2 py-0.5 rounded-md hidden sm:inline border border-[#e0d6c8]/60">
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
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    data={data} 
                    onNavigateToCuentas={() => setActiveTab('cuentas-corrientes')} 
                  />
                )}
                {activeTab === 'queseria' && <Queseria data={data} />}
                {activeTab === 'cuentas-corrientes' && (
                  <CuentasCorrientes 
                    data={data} 
                    onRegisterPayment={registerPayment} 
                  />
                )}
                {activeTab === 'cashflow' && <CashFlow data={data} />}
                {activeTab === 'transactions' && (
                  <Transactions 
                    data={data} 
                    onAdd={handleAddTransaction} 
                    onUpdate={handleUpdateTransaction}
                    onDelete={handleDeleteTransaction}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e0d6c8] z-30 flex items-center justify-around py-1.5 px-1 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] mt-0.5 font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('queseria')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            activeTab === 'queseria' ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
          }`}
        >
          <PackageCheck size={18} />
          <span className="text-[9px] mt-0.5 font-medium">Quesería</span>
        </button>

        <button
          onClick={() => setActiveTab('cuentas-corrientes')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            activeTab === 'cuentas-corrientes' ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
          }`}
        >
          <WalletCards size={18} />
          <span className="text-[9px] mt-0.5 font-medium">Ctas. Ctes.</span>
        </button>

        <button
          onClick={() => setActiveTab('cashflow')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            activeTab === 'cashflow' ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
          }`}
        >
          <LineChart size={18} />
          <span className="text-[9px] mt-0.5 font-medium">Flujo Caja</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-lg transition-colors ${
            activeTab === 'transactions' ? 'text-[#8b7355] font-bold' : 'text-[#6b645c]'
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
