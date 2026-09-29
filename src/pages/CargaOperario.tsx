import React, { useState } from 'react';
import { useProduccion } from '../lib/api';
import { normalizeDecimal, parseDecimalNumber } from '../utils/calculations';
// @ts-ignore
import { Trash2, CheckCircle2, ChevronRight, Save } from 'lucide-react';

const PIN_ACCESO = '2024';

const CargaOperario: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const { data: historial, addRecord, deleteRecord, loading, refreshData } = useProduccion();

  // Form State
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [litros, setLitros] = useState('');
  const [producto, setProducto] = useState('PECORINO');
  const [tipoPasta, setTipoPasta] = useState('DURO');
  
  const [quesoGrande, setQuesoGrande] = useState('');
  const [quesoBarra, setQuesoBarra] = useState('');
  const [quesoTubo, setQuesoTubo] = useState('');
  const [quesoChico, setQuesoChico] = useState('');
  const [quesoCamembert, setQuesoCamembert] = useState('');
  
  const [kgTotales, setKgTotales] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authenticate
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === PIN_ACCESO) {
      setIsAuthenticated(true);
      refreshData(); // Fetch latest data on login
    } else {
      alert('PIN Incorrecto');
      setPinInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!litros || !kgTotales) {
      alert('Por favor ingrese litros y kilos totales.');
      return;
    }

    setIsSubmitting(true);
    
    // Generar un lote base temporal si es necesario
    const [year, month, day] = fecha.split('-');
    const pUpper = producto.trim().toUpperCase();
    const loteCalculado = `${day}${month}${year.substring(2)}-${pUpper.substring(0,3)}`;

    const success = await addRecord({
      fecha_elaboracion: fecha,
      lote: loteCalculado,
      litros_leche: parseDecimalNumber(litros),
      producto: tipoPasta.trim().toUpperCase(),
      tipo_queso: pUpper,
      cantidad_grande: quesoGrande ? parseInt(quesoGrande) : 0,
      cantidad_barra: quesoBarra ? parseInt(quesoBarra) : 0,
      cantidad_tubo: quesoTubo ? parseInt(quesoTubo) : 0,
      cantidad_chico: quesoChico ? parseInt(quesoChico) : 0,
      cantidad_camambert: quesoCamembert ? parseInt(quesoCamembert) : 0,
      cantidad_otro: 0,
      cantidad_ricota: 0,
      kg_totales: parseDecimalNumber(kgTotales)
    });

    setIsSubmitting(false);

    if (success) {
      // Reset form
      setLitros('');
      setQuesoGrande('');
      setQuesoBarra('');
      setQuesoTubo('');
      setQuesoChico('');
      setQuesoCamembert('');
      setKgTotales('');
      alert('¡Carga guardada con éxito!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] flex flex-col items-center justify-center p-6 relative">
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.06] bg-center bg-no-repeat bg-cover z-0"
          style={{ backgroundImage: 'url("/ovejas_render.png")' }}
        />
        <div className="w-full max-w-sm relative z-10">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#e0d6c8] text-center">
            <img 
              src="/logo negro.png" 
              alt="ZAMPA" 
              className="h-24 w-auto mx-auto mb-2 object-contain opacity-90 mix-blend-multiply" 
            />
            <h2 className="text-xl font-black text-[#3e3a35] mb-1 uppercase tracking-wide">Quesería</h2>
            <p className="text-[#6b645c] text-sm mb-6">Ingrese su código de operario</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-3xl tracking-[1em] font-black border-2 border-[#e0d6c8] rounded-xl py-4 focus:outline-none focus:border-[#8b7355] text-[#3e3a35]"
                maxLength={4}
              />
              <button
                type="submit"
                className="w-full bg-[#8b7355] text-white font-bold text-lg py-4 rounded-xl shadow-md active:scale-95 transition-all"
              >
                Ingresar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const ultimasCargas = historial.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f4ebd8] pb-12 font-sans relative">
      <header className="bg-white px-5 py-4 shadow-sm border-b border-[#e0d6c8] sticky top-0 z-20 text-center">
        <img 
          src="/logo negro.png" 
          alt="ZAMPA" 
          className="h-10 w-auto mx-auto object-contain opacity-95 mix-blend-multiply" 
        />
        <p className="text-[10px] text-[#6b645c] font-bold mt-1.5 uppercase tracking-widest">
          Registro de Planta
        </p>
      </header>

      <main className="px-4 pt-6 space-y-6 max-w-md mx-auto">
        
        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-[#e0d6c8] space-y-5">
          
          <div>
            <label className="block text-sm font-bold text-[#3e3a35] mb-2 uppercase tracking-wide">
              Fecha
            </label>
            <input 
              type="date" 
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-[#fdfdfc] border-2 border-[#e0d6c8] rounded-xl p-3.5 text-lg font-bold text-[#3e3a35] focus:border-[#8b7355] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#3e3a35] mb-2 uppercase tracking-wide">
                Litros Proces.
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                required
                placeholder="0"
                value={litros}
                onChange={(e) => setLitros(normalizeDecimal(e.target.value))}
                className="w-full bg-[#fcfbf9] border-2 border-blue-200 focus:border-blue-500 rounded-xl p-3.5 text-xl font-black text-center text-blue-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#3e3a35] mb-2 uppercase tracking-wide">
                Kilos Totales
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                required
                placeholder="0.0"
                value={kgTotales}
                onChange={(e) => setKgTotales(normalizeDecimal(e.target.value))}
                className="w-full bg-[#fcfbf9] border-2 border-emerald-200 focus:border-emerald-500 rounded-xl p-3.5 text-xl font-black text-center text-emerald-900 outline-none"
              />
            </div>
          </div>

          {/* Variedad y Tipo de Pasta */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#3e3a35] mb-2 uppercase tracking-wide">
                Variedad / Producto
              </label>
              <select
                value={producto}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setProducto(val);
                  // Sugerir automáticamente el tipo de pasta según la variedad
                  if (val === 'PECORINO' || val === 'PROVOLETA') {
                    setTipoPasta('DURO');
                  } else if (val === 'RICOTA') {
                    setTipoPasta('RICOTA');
                  } else {
                    setTipoPasta('SEMIDURO');
                  }
                }}
                className="w-full bg-[#fdfdfc] border-2 border-[#e0d6c8] rounded-xl p-3.5 text-lg font-bold text-[#3e3a35] focus:border-[#8b7355] outline-none uppercase"
                style={{ textTransform: 'uppercase' }}
              >
                <option value="PECORINO" className="uppercase font-bold">PECORINO</option>
                <option value="MANCHEGO" className="uppercase font-bold">MANCHEGO</option>
                <option value="SABORIZADO" className="uppercase font-bold">SABORIZADO</option>
                <option value="AHUMADO" className="uppercase font-bold">AHUMADO</option>
                <option value="PROVOLETA" className="uppercase font-bold">PROVOLETA</option>
                <option value="RICOTA" className="uppercase font-bold">RICOTA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#3e3a35] mb-2 uppercase tracking-wide">
                Tipo de Pasta (Categoría)
              </label>
              <select
                value={tipoPasta}
                onChange={(e) => setTipoPasta(e.target.value.toUpperCase())}
                className="w-full bg-[#fdfdfc] border-2 border-[#e0d6c8] rounded-xl p-3.5 text-lg font-bold text-[#3e3a35] focus:border-[#8b7355] outline-none uppercase"
                style={{ textTransform: 'uppercase' }}
              >
                <option value="DURO" className="uppercase font-bold">PASTA DURA (DURO)</option>
                <option value="SEMIDURO" className="uppercase font-bold">PASTA SEMIDURA (SEMIDURO)</option>
                <option value="BLANDO" className="uppercase font-bold">PASTA BLANDA (BLANDO)</option>
                <option value="RICOTA" className="uppercase font-bold">RICOTA</option>
                <option value="OTRO" className="uppercase font-bold">OTRO</option>
              </select>
              <span className="text-[11px] text-[#8b7355] font-semibold mt-1 block">
                Podés cambiar manualmente el tipo de pasta si este lote corresponde a otra categoría.
              </span>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold text-[#6b645c] mb-3 uppercase tracking-wider border-b border-[#e0d6c8] pb-2">
              Detalle de Hormas (Opcional)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold w-16">Grande:</span>
                <input type="number" inputMode="numeric" value={quesoGrande} onChange={e => setQuesoGrande(e.target.value)} placeholder="0" className="w-full border-2 border-[#e0d6c8] rounded-lg p-2 text-center font-bold" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold w-16">Barra:</span>
                <input type="number" inputMode="numeric" value={quesoBarra} onChange={e => setQuesoBarra(e.target.value)} placeholder="0" className="w-full border-2 border-[#e0d6c8] rounded-lg p-2 text-center font-bold" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold w-16">Tubo:</span>
                <input type="number" inputMode="numeric" value={quesoTubo} onChange={e => setQuesoTubo(e.target.value)} placeholder="0" className="w-full border-2 border-[#e0d6c8] rounded-lg p-2 text-center font-bold" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold w-16">Chico:</span>
                <input type="number" inputMode="numeric" value={quesoChico} onChange={e => setQuesoChico(e.target.value)} placeholder="0" className="w-full border-2 border-[#e0d6c8] rounded-lg p-2 text-center font-bold" />
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#8b7355] hover:bg-[#735f46] text-white font-black text-lg py-4 rounded-xl shadow-[0_4px_14px_0_rgba(139,115,85,0.39)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save size={24} />
              {isSubmitting ? 'GUARDANDO...' : 'GUARDAR PRODUCCIÓN'}
            </button>
          </div>
        </form>

        {/* Últimas Cargas */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e0d6c8]">
          <h3 className="text-sm font-bold text-[#3e3a35] mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Últimas 3 Cargas
          </h3>
          
          {loading ? (
            <p className="text-xs text-center py-4 text-[#6b645c]">Cargando historial...</p>
          ) : ultimasCargas.length === 0 ? (
            <p className="text-xs text-center py-4 text-[#6b645c]">Aún no hay cargas hoy.</p>
          ) : (
            <div className="space-y-3">
              {ultimasCargas.map(carga => (
                <div key={carga.id} className="flex justify-between items-center p-3 rounded-xl bg-[#faf9f6] border border-[#e0d6c8]">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-black text-[#3e3a35] uppercase">{carga.tipo_queso || carga.producto}</p>
                      {carga.producto && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4ebd8] text-[#8b7355] border border-[#e0d6c8] uppercase">
                          {carga.producto}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b645c] mt-0.5">
                      {carga.kg_totales} kg / {carga.litros_leche} Lts ({carga.fecha_elaboracion})
                    </p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (carga.id && window.confirm('¿Seguro que deseas eliminar esta carga?')) {
                        await deleteRecord(carga.id);
                      }
                    }}
                    className="p-2.5 text-rose-600 bg-rose-50 rounded-lg active:scale-90 transition-transform"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default CargaOperario;
