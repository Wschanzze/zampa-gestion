import { useState } from 'react';
import { LayoutDashboard, TableProperties, LineChart } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CashFlow from './pages/CashFlow';
import dataJson from './data/tambo_data.json';
import type { Transaction } from './utils/calculations';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'cashflow'>('dashboard');
  
  // Type assertion for the imported JSON data
  const data = dataJson.baseDeDatos as unknown as Transaction[];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Gestión Tambo</h1>
          <p className="text-indigo-200 text-sm mt-1">Ovino & Quesería</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800/50'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'cashflow' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800/50'}`}
          >
            <LineChart size={20} />
            <span>Flujo de Caja</span>
          </button>
          
          <button
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'transactions' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800/50'}`}
          >
            <TableProperties size={20} />
            <span>Base de Datos</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeTab === 'dashboard' && 'Resumen por Unidad de Negocio'}
            {activeTab === 'cashflow' && 'Flujo de Caja Mensual'}
            {activeTab === 'transactions' && 'Movimientos (Base de Datos)'}
          </h2>
        </header>
        
        <div className="p-8">
          {activeTab === 'dashboard' && <Dashboard data={data} />}
          {activeTab === 'cashflow' && <CashFlow data={data} />}
          {activeTab === 'transactions' && <Transactions data={data} />}
        </div>
      </main>
    </div>
  );
}

export default App;
