import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction } from '../utils/calculations';
import { normalizeDecimal, parseDecimalNumber } from '../utils/calculations';
import { useListas } from '../lib/api';
import ComboboxSelect from './ComboboxSelect';
// @ts-ignore
import { X, Sparkles, Calculator, ArrowDownLeft, ArrowUpRight, DollarSign, WalletCards, Receipt, Calendar } from 'lucide-react';

interface UnifiedMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'TRANSACCION' | 'CUENTA_CORRIENTE';
  // Transaction props
  onAddTransaction?: (tx: Transaction) => Promise<boolean | void> | void;
  onUpdateTransaction?: (id: string, tx: Transaction) => Promise<boolean | void> | void;
  initialTransactionData?: Transaction | null;
  existingData?: Transaction[];
  // Payment / Cta Cte props
  onRegisterPayment?: (payment: {
    entity: string;
    amount: number;
    type: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR';
    account: string;
    date: string;
    subactividad?: string;
    notes?: string;
  }) => Promise<boolean | void>;
  initialEntity?: string;
  initialPaymentType?: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR';
  pendingBalance?: number;
  availableEntities?: { name: string; saldo: number }[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(Math.abs(val));
};

// Date conversion utilities for <input type="date"> (YYYY-MM-DD) <-> App storage (D/M/YYYY or DD/MM/YYYY)
const getTodayDisplayDate = (): string => {
  const now = new Date();
  return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
};

const toISODateString = (val?: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parts[0].trim().padStart(2, '0');
      const month = parts[1].trim().padStart(2, '0');
      let year = parts[2].trim();
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }
  }
  if (trimmed.includes('T')) {
    return trimmed.split('T')[0];
  }
  return '';
};

const toDisplayDateString = (isoVal: string): string => {
  if (!isoVal) return '';
  const trimmed = isoVal.trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      const y = parts[0].trim();
      const m = parseInt(parts[1].trim(), 10);
      const d = parseInt(parts[2].trim(), 10);
      if (!isNaN(m) && !isNaN(d) && y) {
        return `${d}/${m}/${y}`;
      }
    }
  }
  return trimmed;
};

const UnifiedMovementModal: React.FC<UnifiedMovementModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'TRANSACCION',
  onAddTransaction,
  onUpdateTransaction,
  initialTransactionData = null,
  existingData = [],
  onRegisterPayment,
  initialEntity = '',
  initialPaymentType = 'COBRO_CLIENTE',
  pendingBalance = 0,
  availableEntities = []
}) => {
  const isEditing = !!initialTransactionData?.id;

  // Active top-level Tab
  const [activeTab, setActiveTab] = useState<'TRANSACCION' | 'CUENTA_CORRIENTE'>(initialMode);

  // -------------------------------------------------------------
  // TAB 1: TRANSACCION FORM STATE
  // -------------------------------------------------------------
  const [tipoMovimiento, setTipoMovimiento] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [formData, setFormData] = useState<Partial<Transaction>>({
    Fecha: getTodayDisplayDate(),
    Subactividad: 'TAMBO',
    Cuenta: 'BANCO',
    Ingresos: 0,
    Egresos: 0,
    Cantidades: 0,
    Pecorino: 0,
    Manchego: 0,
    Saborizado: 0,
    Ahumado: 0,
    Provoleta: 0,
    Ricota: 0,
  });

  const { entidades, rubros, subrubros, cuentas, unidades } = useListas();

  // Autocomplete options derived dynamically
  const autocompleteLists = useMemo(() => {
    const provs = new Set<string>(entidades.map(e => e.nombre?.trim()).filter(Boolean));
    const rubs = new Set<string>(rubros.map(r => r.nombre?.trim()).filter(Boolean));
    const subrubs = new Set<string>(subrubros.map(s => s.nombre?.trim()).filter(Boolean));
    const cuents = new Set<string>(cuentas.map(c => c.nombre?.trim()).filter(Boolean));
    const unids = new Set<string>(unidades.map(u => u.nombre?.trim()).filter(Boolean));

    if (cuents.size === 0) {
      cuents.add('BANCO');
      cuents.add('EFECTIVO');
      cuents.add('PENDIENTE');
    }
    if (unids.size === 0) {
      ['TAMBO', 'RECRÍA', 'QUESERÍA', 'COMÚN'].forEach(u => unids.add(u));
    }

    existingData.forEach(item => {
      if (item['Prov/Cliente']) provs.add(item['Prov/Cliente'].trim());
      if (item.Rubro) rubs.add(item.Rubro.trim());
      if (item['Subrubro/Producto']) subrubs.add(item['Subrubro/Producto'].trim());
      if (item.Cuenta) cuents.add(item.Cuenta.trim());
      if (item.Subactividad) unids.add(item.Subactividad.trim());
    });

    const sortFn = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });

    return {
      proveedores: Array.from(provs).sort(sortFn),
      rubros: Array.from(rubs).sort(sortFn),
      subrubros: Array.from(subrubs).sort(sortFn),
      cuentas: Array.from(cuents).sort(sortFn),
      unidades: Array.from(unids).sort(sortFn),
    };
  }, [existingData, entidades, rubros, subrubros, cuentas, unidades]);

  // -------------------------------------------------------------
  // TAB 2: CUENTA CORRIENTE FORM STATE
  // -------------------------------------------------------------
  const [paymentEntity, setPaymentEntity] = useState(initialEntity);
  const [paymentType, setPaymentType] = useState<'COBRO_CLIENTE' | 'PAGO_PROVEEDOR'>(initialPaymentType);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentAccount, setPaymentAccount] = useState('BANCO');
  const [paymentDate, setPaymentDate] = useState(getTodayDisplayDate());
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Synchronize on modal open or prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      if (initialEntity) setPaymentEntity(initialEntity);
      if (initialPaymentType) setPaymentType(initialPaymentType);
      if (!initialTransactionData) {
        setFormData({
          Fecha: getTodayDisplayDate(),
          Subactividad: 'TAMBO',
          Cuenta: 'BANCO',
          Ingresos: 0,
          Egresos: 0,
          Cantidades: 0,
          Pecorino: 0,
          Manchego: 0,
          Saborizado: 0,
          Ahumado: 0,
          Provoleta: 0,
          Ricota: 0,
        });
        setTipoMovimiento('INGRESO');
        setPaymentDate(getTodayDisplayDate());
        setPaymentAmount('');
        setPaymentNotes('');
      }
    }
  }, [isOpen, initialMode, initialEntity, initialPaymentType, initialTransactionData]);

  // Load initialTransactionData when in Edit mode
  useEffect(() => {
    if (initialTransactionData) {
      const isIngreso = Number(initialTransactionData.Ingresos) > 0 || (Number(initialTransactionData.Egresos) === 0 && initialTransactionData.Rubro?.toUpperCase().includes('VENTA'));
      setTipoMovimiento(isIngreso ? 'INGRESO' : 'EGRESO');
      setFormData({
        ...initialTransactionData,
        Fecha: initialTransactionData.Fecha || getTodayDisplayDate(),
        Ingresos: Number(initialTransactionData.Ingresos) || 0,
        Egresos: Number(initialTransactionData.Egresos) || 0,
        Cantidades: Number(initialTransactionData.Cantidades) || 0,
        Pecorino: Number(initialTransactionData.Pecorino) || 0,
        Manchego: Number(initialTransactionData.Manchego) || 0,
        Saborizado: Number(initialTransactionData.Saborizado) || 0,
        Ahumado: Number(initialTransactionData.Ahumado) || 0,
        Provoleta: Number(initialTransactionData.Provoleta) || 0,
        Ricota: Number(initialTransactionData.Ricota) || 0,
      });
      setActiveTab('TRANSACCION');
    }
  }, [initialTransactionData]);

  // Pending balance for selected payment entity
  const currentPending = useMemo(() => {
    if (!paymentEntity) return pendingBalance;
    const match = availableEntities.find(e => e.name.toLowerCase().trim() === paymentEntity.toLowerCase().trim());
    return match ? match.saldo : pendingBalance;
  }, [paymentEntity, availableEntities, pendingBalance]);

  const handleFillTotal = () => {
    if (Math.abs(currentPending) > 0) {
      setPaymentAmount(String(Math.abs(currentPending)));
    }
  };

  // Helper display for inputs
  const displayValue = (val: any) => {
    if (val === 0 || val === undefined || val === null) return '';
    return String(val);
  };

  // -------------------------------------------------------------
  // TAB 1 HANDLERS
  // -------------------------------------------------------------
  const handleTxChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTxDecimalChange = (name: string, rawValue: string) => {
    const value = normalizeDecimal(rawValue);
    const cheeseFields = ['Pecorino', 'Manchego', 'Saborizado', 'Ahumado', 'Provoleta', 'Ricota'];

    if (cheeseFields.includes(name)) {
      const updated = { ...formData, [name]: value };
      const p = parseDecimalNumber(name === 'Pecorino' ? value : updated.Pecorino);
      const m = parseDecimalNumber(name === 'Manchego' ? value : updated.Manchego);
      const s = parseDecimalNumber(name === 'Saborizado' ? value : updated.Saborizado);
      const a = parseDecimalNumber(name === 'Ahumado' ? value : updated.Ahumado);
      const pr = parseDecimalNumber(name === 'Provoleta' ? value : updated.Provoleta);
      const r = parseDecimalNumber(name === 'Ricota' ? value : updated.Ricota);
      const totalCheese = parseFloat((p + m + s + a + pr + r).toFixed(2));

      setFormData({
        ...updated,
        Cantidades: totalCheese > 0 ? totalCheese : updated.Cantidades
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTxMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = normalizeDecimal(e.target.value);
    if (tipoMovimiento === 'INGRESO') {
      setFormData(prev => ({ ...prev, Ingresos: val, Egresos: 0 }));
    } else {
      setFormData(prev => ({ ...prev, Egresos: val, Ingresos: 0 }));
    }
  };

  const totalKgQuesos = useMemo(() => {
    const p = parseDecimalNumber(formData.Pecorino);
    const m = parseDecimalNumber(formData.Manchego);
    const s = parseDecimalNumber(formData.Saborizado);
    const a = parseDecimalNumber(formData.Ahumado);
    const pr = parseDecimalNumber(formData.Provoleta);
    const r = parseDecimalNumber(formData.Ricota);
    return parseFloat((p + m + s + a + pr + r).toFixed(2));
  }, [formData.Pecorino, formData.Manchego, formData.Saborizado, formData.Ahumado, formData.Provoleta, formData.Ricota]);

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Fecha) {
      alert('Por favor especifica una fecha');
      return;
    }

    const p = parseDecimalNumber(formData.Pecorino);
    const m = parseDecimalNumber(formData.Manchego);
    const s = parseDecimalNumber(formData.Saborizado);
    const a = parseDecimalNumber(formData.Ahumado);
    const pr = parseDecimalNumber(formData.Provoleta);
    const r = parseDecimalNumber(formData.Ricota);
    const calculatedCheeseTotal = parseFloat((p + m + s + a + pr + r).toFixed(2));

    const finalCantidades = calculatedCheeseTotal > 0 
      ? calculatedCheeseTotal 
      : parseDecimalNumber(formData.Cantidades);

    const finalData: Transaction = {
      ...formData,
      Fecha: formData.Fecha,
      Ingresos: tipoMovimiento === 'INGRESO' ? parseDecimalNumber(formData.Ingresos) : 0,
      Egresos: tipoMovimiento === 'EGRESO' ? parseDecimalNumber(formData.Egresos) : 0,
      Cantidades: finalCantidades,
      Pecorino: p,
      Manchego: m,
      Saborizado: s,
      Ahumado: a,
      Provoleta: pr,
      Ricota: r,
    };

    if (isEditing && initialTransactionData?.id && onUpdateTransaction) {
      await onUpdateTransaction(initialTransactionData.id, finalData);
    } else if (onAddTransaction) {
      await onAddTransaction(finalData);
    }
    onClose();
  };

  // -------------------------------------------------------------
  // TAB 2 HANDLERS
  // -------------------------------------------------------------
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentEntity.trim()) {
      alert('Por favor especifica un cliente o proveedor');
      return;
    }
    const numAmount = parseDecimalNumber(paymentAmount);
    if (numAmount <= 0) {
      alert('El monto a registrar debe ser mayor a cero');
      return;
    }

    if (!onRegisterPayment) {
      alert('Función de registro de pago no disponible');
      return;
    }

    setPaymentSubmitting(true);
    const success = await onRegisterPayment({
      entity: paymentEntity.trim(),
      amount: numAmount,
      type: paymentType,
      account: paymentAccount,
      date: paymentDate,
      notes: paymentNotes.trim()
    });
    setPaymentSubmitting(false);

    if (success !== false) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#faf9f6] rounded-2xl border border-[#e0d6c8] shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e0d6c8] flex justify-between items-center bg-[#f4ebd8]/80 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <h3 className="text-base sm:text-lg font-bold text-[#3e3a35]">
                {isEditing ? 'Editar Movimiento' : 'Registrar Movimiento'}
              </h3>
            </div>
            <p className="text-xs text-[#6b645c] mt-0.5">
              {isEditing 
                ? 'Modifica los campos del registro seleccionado'
                : 'Carga transacciones comerciales (ventas, compras, quesos) o cancela deudas pendientes'
              }
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-[#6b645c] hover:text-[#3e3a35] hover:bg-[#e0d6c8]/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Level 1 Tabs: Transacción Comercial vs Cuenta Corriente */}
        {!isEditing && (
          <div className="px-4 sm:px-6 pt-3 pb-0 bg-[#faf9f6] border-b border-[#e0d6c8]/70 shrink-0">
            <div className="flex p-1 bg-[#eae0cd]/50 rounded-xl border border-[#e0d6c8]">
              <button
                type="button"
                onClick={() => setActiveTab('TRANSACCION')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'TRANSACCION'
                    ? 'bg-white text-[#2b2824] shadow-sm border border-[#e0d6c8]/80'
                    : 'text-[#6b645c] hover:text-[#2b2824]'
                }`}
              >
                <Receipt size={16} className={activeTab === 'TRANSACCION' ? 'text-[#8b7355]' : 'text-gray-400'} />
                <span>Transacción Comercial (Ventas / Gastos / Quesos)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CUENTA_CORRIENTE')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'CUENTA_CORRIENTE'
                    ? 'bg-white text-[#2b2824] shadow-sm border border-[#e0d6c8]/80'
                    : 'text-[#6b645c] hover:text-[#2b2824]'
                }`}
              >
                <WalletCards size={16} className={activeTab === 'CUENTA_CORRIENTE' ? 'text-emerald-700' : 'text-gray-400'} />
                <span>Cobro / Pago Cta. Cte. (Saldar Deudas)</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          
          {/* ============================================================== */}
          {/* TAB 1: TRANSACCION COMERCIAL                                   */}
          {/* ============================================================== */}
          {activeTab === 'TRANSACCION' && (
            <form onSubmit={handleTxSubmit} className="flex flex-col h-full">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
                
                {/* Selector Verde / Rojo de Tipo */}
                <div className="flex p-1 bg-[#eae0cd]/60 rounded-xl max-w-sm border border-[#e0d6c8]">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoMovimiento('INGRESO');
                      setFormData(prev => ({ ...prev, Ingresos: prev.Egresos || prev.Ingresos, Egresos: 0 }));
                    }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                      tipoMovimiento === 'INGRESO'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-[#5c544d] hover:text-[#2d2a26]'
                    }`}
                  >
                    <ArrowDownLeft size={16} />
                    <span>Ingreso / Venta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoMovimiento('EGRESO');
                      setFormData(prev => ({ ...prev, Egresos: prev.Ingresos || prev.Egresos, Ingresos: 0 }));
                    }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                      tipoMovimiento === 'EGRESO'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-[#5c544d] hover:text-[#2d2a26]'
                    }`}
                  >
                    <ArrowUpRight size={16} />
                    <span>Egreso / Gasto</span>
                  </button>
                </div>

                {/* Grid de campos principales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
                  {/* Fecha */}
                  <div>
                    <label className="text-xs font-semibold text-[#6b645c] mb-1 flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#8b7355]" />
                      <span>Fecha</span>
                      <span className="text-rose-600">*</span>
                    </label>
                    <input 
                      required 
                      type="date" 
                      name="Fecha" 
                      value={toISODateString(formData.Fecha)} 
                      onChange={(e) => {
                        const isoVal = e.target.value;
                        setFormData(prev => ({ ...prev, Fecha: toDisplayDateString(isoVal) }));
                      }} 
                      onClick={(e) => {
                        try {
                          (e.currentTarget as any).showPicker?.();
                        } catch {}
                      }}
                      className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-base md:text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] focus:border-[#8b7355] outline-none font-medium cursor-pointer" 
                    />
                  </div>

                  {/* Proveedor / Cliente */}
                  <ComboboxSelect
                    label="Proveedor / Cliente"
                    name="Prov/Cliente"
                    placeholder="Selecciona o escribe..."
                    value={formData['Prov/Cliente'] || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, 'Prov/Cliente': val }))}
                    options={autocompleteLists.proveedores}
                  />

                  {/* Cuenta */}
                  <ComboboxSelect
                    label="Cuenta"
                    name="Cuenta"
                    placeholder="Selecciona cuenta..."
                    value={formData.Cuenta || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, Cuenta: val }))}
                    options={autocompleteLists.cuentas}
                  />

                  {/* Unidad de Negocio */}
                  <ComboboxSelect
                    label="Unidad de Negocio"
                    name="Subactividad"
                    placeholder="Selecciona unidad..."
                    value={formData.Subactividad || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, Subactividad: val }))}
                    options={autocompleteLists.unidades}
                  />

                  {/* Rubro */}
                  <ComboboxSelect
                    label="Rubro"
                    name="Rubro"
                    placeholder="Ej. VENTA QUESO, ALIMENTACION"
                    value={formData.Rubro || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, Rubro: val }))}
                    options={autocompleteLists.rubros}
                  />

                  {/* Subrubro / Producto */}
                  <ComboboxSelect
                    label="Subrubro / Producto"
                    name="Subrubro/Producto"
                    placeholder="Ej. Cuajo, Balanceado..."
                    value={formData['Subrubro/Producto'] || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, 'Subrubro/Producto': val }))}
                    options={autocompleteLists.subrubros}
                  />

                  {/* Monto */}
                  <div>
                    <label className="block text-xs font-semibold text-[#6b645c] mb-1">
                      {tipoMovimiento === 'INGRESO' ? 'Monto Ingreso ($)' : 'Monto Egreso ($)'}
                    </label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="0.00"
                      value={displayValue(tipoMovimiento === 'INGRESO' ? formData.Ingresos : formData.Egresos)} 
                      onChange={handleTxMontoChange} 
                      className={`w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-base md:text-sm font-bold outline-none focus:ring-1 ${
                        tipoMovimiento === 'INGRESO' ? 'text-emerald-700 focus:ring-emerald-500' : 'text-rose-700 focus:ring-rose-500'
                      }`} 
                    />
                  </div>

                  {/* Cantidades generales */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-[#6b645c]">
                        Cantidades Totales {totalKgQuesos > 0 ? '(Kg Quesos)' : ''}
                      </label>
                      {totalKgQuesos > 0 && (
                        <span className="text-[10px] text-amber-900 font-bold bg-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Calculator size={10} /> Suma auto: {totalKgQuesos} kg
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      name="Cantidades" 
                      placeholder="0.00"
                      value={displayValue(formData.Cantidades)} 
                      onChange={(e) => handleTxDecimalChange('Cantidades', e.target.value)} 
                      className={`w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-base md:text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none font-bold ${
                        totalKgQuesos > 0 ? 'bg-amber-50/40 border-amber-300 text-amber-950' : ''
                      }`} 
                    />
                  </div>
                </div>

                {/* Sección de Quesos (Kg) */}
                <div className="p-3.5 sm:p-4 bg-amber-50/40 rounded-xl border border-amber-200/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles size={16} className="text-amber-800" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                        Detalle de Quesos (Kilogramos)
                      </h4>
                    </div>
                    {totalKgQuesos > 0 && (
                      <span className="text-xs font-bold bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full">
                        Total Quesos: {totalKgQuesos} kg
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {[
                      { name: 'Pecorino', label: 'Pecorino (kg)' },
                      { name: 'Manchego', label: 'Manchego (kg)' },
                      { name: 'Saborizado', label: 'Saborizado (kg)' },
                      { name: 'Ahumado', label: 'Ahumado (kg)' },
                      { name: 'Provoleta', label: 'Provoleta (kg)' },
                      { name: 'Ricota', label: 'Ricota (kg)' },
                    ].map(({ name, label }) => (
                      <div key={name}>
                        <label className="block text-[11px] font-semibold text-amber-950 mb-1">{label}</label>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          name={name} 
                          placeholder="0.00"
                          value={displayValue(formData[name as keyof Transaction])} 
                          onChange={(e) => handleTxDecimalChange(name, e.target.value)} 
                          className="w-full border border-amber-200 bg-white rounded-lg px-2.5 py-1.5 text-base md:text-xs text-[#3e3a35] focus:ring-1 focus:ring-amber-600 outline-none font-mono" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-xs font-semibold text-[#6b645c] mb-1">Observaciones / Detalle factura</label>
                  <input 
                    type="text" 
                    name="Observaciones" 
                    placeholder="Ej. Fc 1027-00050711 - Entrega quesería..." 
                    value={formData.Observaciones || ''} 
                    onChange={handleTxChange} 
                    className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-base md:text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none" 
                  />
                </div>

              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-[#e0d6c8] bg-[#faf9f6] flex justify-end space-x-3 shrink-0">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 border border-[#e0d6c8] text-[#6b645c] rounded-xl text-sm hover:bg-[#f4ebd8] font-semibold transition-colors bg-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`px-5 py-2 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center space-x-1.5 ${
                    tipoMovimiento === 'INGRESO' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <span>{isEditing ? 'Guardar Cambios' : 'Registrar Movimiento'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CUENTAS CORRIENTES (COBRO / PAGO PARCIAL O TOTAL)       */}
          {/* ============================================================== */}
          {activeTab === 'CUENTA_CORRIENTE' && (
            <form onSubmit={handlePaymentSubmit} className="flex flex-col h-full">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
                
                {/* Selector Verde / Rojo de Tipo Cta. Cte. */}
                <div className="flex p-1 bg-[#eae0cd]/60 rounded-xl border border-[#e0d6c8]">
                  <button
                    type="button"
                    onClick={() => setPaymentType('COBRO_CLIENTE')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                      paymentType === 'COBRO_CLIENTE'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-[#5c544d] hover:text-[#2d2a26]'
                    }`}
                  >
                    <ArrowDownLeft size={16} />
                    <span>Cobro a Cliente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('PAGO_PROVEEDOR')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                      paymentType === 'PAGO_PROVEEDOR'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-[#5c544d] hover:text-[#2d2a26]'
                    }`}
                  >
                    <ArrowUpRight size={16} />
                    <span>Pago a Proveedor</span>
                  </button>
                </div>

                {/* Cliente / Proveedor Selector */}
                <ComboboxSelect
                  label={paymentType === 'COBRO_CLIENTE' ? 'Cliente que paga' : 'Proveedor al que se paga'}
                  name="entity"
                  required
                  placeholder="Selecciona o escribe cliente/proveedor..."
                  value={paymentEntity}
                  onChange={(val) => setPaymentEntity(val)}
                  options={availableEntities.length > 0 ? availableEntities.map(e => e.name) : autocompleteLists.proveedores}
                />

                {/* Alerta / Tarjeta de Deuda en Vivo */}
                {paymentEntity && (
                  <div className="p-3.5 bg-[#f4ebd8]/50 rounded-xl border border-[#e0d6c8] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-[#6b645c] uppercase">Saldo Pendiente Actual</span>
                      <p className={`text-base sm:text-lg font-bold font-mono ${currentPending > 0 ? 'text-emerald-700' : currentPending < 0 ? 'text-rose-700' : 'text-[#6b645c]'}`}>
                        {currentPending > 0 
                          ? `Nos debe ${formatCurrency(currentPending)}`
                          : currentPending < 0
                          ? `Le debemos ${formatCurrency(currentPending)}`
                          : 'Cuenta al día ($0,00)'}
                      </p>
                    </div>

                    {Math.abs(currentPending) > 0 && (
                      <button
                        type="button"
                        onClick={handleFillTotal}
                        className="px-3 py-1.5 text-xs font-bold bg-[#8b7355] text-white hover:bg-[#735f46] rounded-lg transition-colors shadow-xs"
                      >
                        Saldar Todo
                      </button>
                    )}
                  </div>
                )}

                {/* Monto y Cuenta Financiera */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#6b645c] mb-1">Monto del Pago ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[#6b645c] font-bold text-sm">$</span>
                      <input 
                        required
                        type="text" 
                        inputMode="decimal"
                        placeholder="0.00"
                        value={paymentAmount} 
                        onChange={(e) => setPaymentAmount(normalizeDecimal(e.target.value))} 
                        className={`w-full border border-[#e0d6c8] bg-white rounded-lg pl-8 pr-3 py-2 text-base md:text-sm font-mono font-bold outline-none focus:ring-1 ${
                          paymentType === 'COBRO_CLIENTE' ? 'text-emerald-700 focus:ring-emerald-500' : 'text-rose-700 focus:ring-rose-500'
                        }`} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6b645c] mb-1">Medio / Cuenta Real</label>
                    <select
                      value={paymentAccount}
                      onChange={(e) => setPaymentAccount(e.target.value)}
                      className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-base md:text-sm font-semibold text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none"
                    >
                      <option value="BANCO">BANCO (Transferencia / Cheque)</option>
                      <option value="EFECTIVO">EFECTIVO (Caja chica)</option>
                    </select>
                  </div>
                </div>

                {/* Fecha y Unidad de Negocio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[#6b645c] mb-1 flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#8b7355]" />
                      <span>Fecha del Cobro / Pago</span>
                      <span className="text-rose-600">*</span>
                    </label>
                    <input 
                      required
                      type="date" 
                      value={toISODateString(paymentDate)} 
                      onChange={(e) => setPaymentDate(toDisplayDateString(e.target.value))} 
                      onClick={(e) => {
                        try {
                          (e.currentTarget as any).showPicker?.();
                        } catch {}
                      }}
                      className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-base md:text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none cursor-pointer font-medium" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6b645c] mb-1">Asignación Contable</label>
                    <div className="w-full bg-[#f4ebd8]/40 border border-[#e0d6c8] rounded-lg px-3 py-2 text-xs text-[#6b645c] font-medium flex items-center">
                      <span>Doble asiento auto: Real ({paymentAccount}) + Compensatorio (PENDIENTE)</span>
                    </div>
                  </div>
                </div>

                {/* Notas / Observaciones */}
                <div>
                  <label className="block text-xs font-semibold text-[#6b645c] mb-1">Detalle / Notas del Recibo (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Pago transferencia Banco Provincia s/ Factura..."
                    value={paymentNotes} 
                    onChange={(e) => setPaymentNotes(e.target.value)} 
                    className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-base md:text-sm text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none" 
                  />
                </div>

              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-[#e0d6c8] bg-[#faf9f6] flex justify-end space-x-3 shrink-0">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 border border-[#e0d6c8] text-[#6b645c] rounded-xl text-sm hover:bg-[#f4ebd8] font-semibold transition-colors bg-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={paymentSubmitting}
                  className={`px-5 py-2 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center space-x-1.5 ${
                    paymentType === 'COBRO_CLIENTE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <span>{paymentSubmitting ? 'Guardando...' : paymentType === 'COBRO_CLIENTE' ? 'Confirmar Cobro' : 'Confirmar Pago'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default UnifiedMovementModal;
