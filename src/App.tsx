import { useState } from 'react';
// @ts-ignore
import { LayoutDashboard, TableProperties, LineChart } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CashFlow from './pages/CashFlow';

import { useSupabaseTransactions } from './lib/api';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'cashflow'>('dashboard');
  
  const { 
    data, 
    loading, 
    addTransaction: handleAddTransaction, 
    updateTransaction: handleUpdateTransaction, 
    deleteTransaction: handleDeleteTransaction 
  } = useSupabaseTransactions();

  return (
    <div className="flex h-screen bg-[#faf9f6]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#f4ebd8] text-[#3e3a35] flex flex-col border-r border-[#e0d6c8] shadow-sm relative z-20 overflow-hidden">
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-[#fdfdfc]">
        {/* Watermark Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] bg-center bg-no-repeat bg-cover z-0"
          style={{ backgroundImage: 'url("/ovejas_render.png")' }}
        />
        
        <div className="relative z-10 flex flex-col h-full">
          <header className="bg-white/80 backdrop-blur-sm border-b border-[#e0d6c8] px-8 py-4 shadow-sm sticky top-0 z-20">
            <h2 className="text-xl font-semibold text-[#3e3a35]">
              {activeTab === 'dashboard' && 'Resumen por Unidad de Negocio'}
              {activeTab === 'cashflow' && 'Flujo de Caja Mensual'}
              {activeTab === 'transactions' && 'Movimientos (Base de Datos)'}
            </h2>
          </header>
          
          <div className="p-8 flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-[#6b645c]">
                Cargando datos desde Supabase...
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && <Dashboard data={data} />}
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
    </div>
  );
}

export default App;
