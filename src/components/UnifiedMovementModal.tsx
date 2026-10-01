import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction } from '../utils/calculations';
import { normalizeDecimal, parseDecimalNumber, parseCurrency, parseFechaToTime } from '../utils/calculations';
import { useListas } from '../lib/api';
import ComboboxSelect from './ComboboxSelect';
// @ts-ignore
import { X, Sparkles, Calculator, ArrowDownLeft, ArrowUpRight, DollarSign, WalletCards, Receipt, Calendar, CheckCircle2 } from 'lucide-react';

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
    selectedCargoIds?: string[];
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
    Subactividad: 'QUESERIA',
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
      ['QUESERIA', 'TAMBO', 'RECRIA', 'COMUN'].forEach(u => unids.add(u));
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
  const [selectedCargoIds, setSelectedCargoIds] = useState<string[]>([]);

  // Pending cargos for the selected entity & payment type
  const pendingCargos = useMemo(() => {
    if (!paymentEntity.trim()) return [];
    const normalized = paymentEntity.trim().toLowerCase();
    const isCobro = paymentType === 'COBRO_CLIENTE';

    return existingData
      .filter(tx => {
        if (!tx['Prov/Cliente'] || tx['Prov/Cliente'].trim().toLowerCase() !== normalized) return false;
        const c = (tx.Cuenta || '').trim().toUpperCase();
        if (c !== 'PENDIENTE') return false;

        const ing = parseCurrency(tx.Ingresos);
        const eg = parseCurrency(tx.Egresos);
        return isCobro ? ing > 0 : eg > 0;
      })
      .sort((a, b) => parseFechaToTime(a.Fecha) - parseFechaToTime(b.Fecha)); // Oldest first
  }, [existingData, paymentEntity, paymentType]);

  // Synchronize on modal open or prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      const entityToUse = initialEntity || '';
      const typeToUse = initialPaymentType || 'COBRO_CLIENTE';
      setPaymentEntity(entityToUse);
      setPaymentType(typeToUse);

      if (entityToUse) {
        const normalized = entityToUse.trim().toLowerCase();
        const isCobro = typeToUse === 'COBRO_CLIENTE';
        const matches = existingData
          .filter(tx => {
            if (!tx['Prov/Cliente'] || tx['Prov/Cliente'].trim().toLowerCase() !== normalized) return false;
            if ((tx.Cuenta || '').trim().toUpperCase() !== 'PENDIENTE') return false;
            const ing = parseCurrency(tx.Ingresos);
            const eg = parseCurrency(tx.Egresos);
            return isCobro ? ing > 0 : eg > 0;
          })
          .sort((a, b) => parseFechaToTime(a.Fecha) - parseFechaToTime(b.Fecha));

        const ids = matches.map(c => c.id).filter(Boolean) as string[];
        setSelectedCargoIds(ids);

        const sum = matches.reduce((acc, c) => acc + (isCobro ? parseCurrency(c.Ingresos) : parseCurrency(c.Egresos)), 0);
        if (sum > 0) {
          setPaymentAmount(String(sum));
        } else if (Math.abs(pendingBalance) > 0) {
          setPaymentAmount(String(Math.abs(pendingBalance)));
        } else {
          setPaymentAmount('');
        }
      } else {
        setSelectedCargoIds([]);
        setPaymentAmount('');
      }

      if (!initialTransactionData) {
        setFormData({
          Fecha: getTodayDisplayDate(),
          Subactividad: 'QUESERIA',
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
        setPaymentNotes('');
      }
    }
  }, [isOpen, initialMode, initialEntity, initialPaymentType, initialTransactionData, pendingBalance, existingData]);

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

  const handleEntityChange = (val: string) => {
    setPaymentEntity(val);
    const normalized = val.trim().toLowerCase();
    const isCobro = paymentType === 'COBRO_CLIENTE';
    const matches = existingData
      .filter(tx => {
        if (!tx['Prov/Cliente'] || tx['Prov/Cliente'].trim().toLowerCase() !== normalized) return false;
        if ((tx.Cuenta || '').trim().toUpperCase() !== 'PENDIENTE') return false;
        const ing = parseCurrency(tx.Ingresos);
        const eg = parseCurrency(tx.Egresos);
        return isCobro ? ing > 0 : eg > 0;
      })
      .sort((a, b) => parseFechaToTime(a.Fecha) - parseFechaToTime(b.Fecha));

    const ids = matches.map(c => c.id).filter(Boolean) as string[];
    setSelectedCargoIds(ids);

    const sum = matches.reduce((acc, c) => acc + (isCobro ? parseCurrency(c.Ingresos) : parseCurrency(c.Egresos)), 0);
    if (sum > 0) {
      setPaymentAmount(String(sum));
    } else {
      const match = availableEntities.find(e => e.name.toLowerCase().trim() === normalized);
      if (match && Math.abs(match.saldo) > 0) {
        setPaymentAmount(String(Math.abs(match.saldo)));
      } else {
        setPaymentAmount('');
      }
    }
  };

  const handlePaymentTypeChange = (newType: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR') => {
    setPaymentType(newType);
    if (!paymentEntity) return;
    const normalized = paymentEntity.trim().toLowerCase();
    const isCobro = newType === 'COBRO_CLIENTE';
    const matches = existingData
      .filter(tx => {
        if (!tx['Prov/Cliente'] || tx['Prov/Cliente'].trim().toLowerCase() !== normalized) return false;
        if ((tx.Cuenta || '').trim().toUpperCase() !== 'PENDIENTE') return false;
        const ing = parseCurrency(tx.Ingresos);
        const eg = parseCurrency(tx.Egresos);
        return isCobro ? ing > 0 : eg > 0;
      })
      .sort((a, b) => parseFechaToTime(a.Fecha) - parseFechaToTime(b.Fecha));

    const ids = matches.map(c => c.id).filter(Boolean) as string[];
    setSelectedCargoIds(ids);

    const sum = matches.reduce((acc, c) => acc + (isCobro ? parseCurrency(c.Ingresos) : parseCurrency(c.Egresos)), 0);
    setPaymentAmount(sum > 0 ? String(sum) : '');
  };

  const handleFillTotal = () => {
    const isCobro = paymentType === 'COBRO_CLIENTE';
    if (pendingCargos.length > 0) {
      const allIds = pendingCargos.map(c => c.id).filter(Boolean) as string[];
      setSelectedCargoIds(allIds);
      const sum = pendingCargos.reduce((acc, c) => acc + (isCobro ? parseCurrency(c.Ingresos) : parseCurrency(c.Egresos)), 0);
      setPaymentAmount(String(sum));
    } else if (Math.abs(currentPending) > 0) {
      setPaymentAmount(String(Math.abs(currentPending)));
    }
  };

  const handleToggleCargo = (cargoId: string) => {
    const isCobro = paymentType === 'COBRO_CLIENTE';
    const nextSelected = selectedCargoIds.includes(cargoId)
      ? selectedCargoIds.filter(id => id !== cargoId)
      : [...selectedCargoIds, cargoId];

    setSelectedCargoIds(nextSelected);

    const sum = pendingCargos
      .filter(c => c.id && nextSelected.includes(c.id))
      .reduce((acc, c) => acc + (isCobro ? parseCurrency(c.Ingresos) : parseCurrency(c.Egresos)), 0);

    setPaymentAmount(sum > 0 ? String(sum) : '');
  };

  const handleSelectAllCargos = () => {
    const isCobro = paymentType === 'COBRO_CLIENTE';
    const allIds = pendingCargos.map(c => c.id).filter(Boolean) as string[];
    setSelectedCargoIds(allIds);
    const sum = pendingCargos.reduce((acc, c) => acc + (isCobro ? parseCurrency(c.Ingresos) : parseCurrency(c.Egresos)), 0);
    setPaymentAmount(sum > 0 ? String(sum) : '');
  };

  const handleDeselectAllCargos = () => {
    setSelectedCargoIds([]);
    setPaymentAmount('');
  };

  // Map each selected cargo to its live coverage status (FULL, PARTIAL, UNPAID)
  const cargoStatusMap = useMemo(() => {
    const map: Record<string, { status: 'FULL' | 'PARTIAL' | 'UNPAID'; paidAmount: number; pendingRemainder: number }> = {};
    let remaining = parseDecimalNumber(paymentAmount);
    const isCobro = paymentType === 'COBRO_CLIENTE';

    const selectedList = pendingCargos.filter(c => c.id && selectedCargoIds.includes(c.id));

    selectedList.forEach(c => {
      const id = c.id!;
      const total = isCobro ? parseCurrency(c.Ingresos) : parseCurrency(c.Egresos);

      if (remaining <= 0.001) {
        map[id] = { status: 'UNPAID', paidAmount: 0, pendingRemainder: total };
      } else if (remaining >= total - 0.01) {
        map[id] = { status: 'FULL', paidAmount: total, pendingRemainder: 0 };
        remaining -= total;
      } else {
        const paid = remaining;
        const rest = parseFloat((total - remaining).toFixed(2));
        map[id] = { status: 'PARTIAL', paidAmount: paid, pendingRemainder: rest };
        remaining = 0;
      }
    });

    return map;
  }, [pendingCargos, selectedCargoIds, paymentAmount, paymentType]);

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
      notes: paymentNotes.trim(),
      selectedCargoIds: selectedCargoIds
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
                className={`flex-1 py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 text-center ${
                  activeTab === 'TRANSACCION'
                    ? 'bg-white text-[#2b2824] shadow-sm border border-[#e0d6c8]/80'
                    : 'text-[#6b645c] hover:text-[#2b2824]'
                }`}
              >
                <Receipt size={16} className={activeTab === 'TRANSACCION' ? 'text-[#8b7355] shrink-0' : 'text-gray-400 shrink-0'} />
                <span className="hidden sm:inline">Transacción Comercial (Ventas / Gastos / Quesos)</span>
                <span className="sm:hidden">Transacción</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CUENTA_CORRIENTE')}
                className={`flex-1 py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 text-center ${
                  activeTab === 'CUENTA_CORRIENTE'
                    ? 'bg-white text-[#2b2824] shadow-sm border border-[#e0d6c8]/80'
                    : 'text-[#6b645c] hover:text-[#2b2824]'
                }`}
              >
                <WalletCards size={16} className={activeTab === 'CUENTA_CORRIENTE' ? 'text-emerald-700 shrink-0' : 'text-gray-400 shrink-0'} />
                <span className="hidden sm:inline">Cobro / Pago Cta. Cte. (Saldar Deudas)</span>
                <span className="sm:hidden">Cobro / Pago Cta. Cte.</span>
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
              <div className="p-3.5 sm:p-4 border-t border-[#e0d6c8] bg-[#faf9f6] flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-[#e0d6c8] text-[#6b645c] rounded-xl text-sm hover:bg-[#f4ebd8] font-semibold transition-colors bg-white text-center justify-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5 ${
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
                    onClick={() => handlePaymentTypeChange('COBRO_CLIENTE')}
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
                    onClick={() => handlePaymentTypeChange('PAGO_PROVEEDOR')}
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
                  onChange={handleEntityChange}
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

                {/* Lista de Cargos / Facturas Pendientes a Imputar */}
                {paymentEntity && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-[#3e3a35] flex items-center gap-1.5">
                          <Receipt size={14} className="text-[#8b7355]" />
                          <span>Cargos Pendientes en Base de Datos ({pendingCargos.length})</span>
                        </label>
                        <p className="text-[11px] text-[#6b645c]">
                          Selecciona a qué cargo(s) asignar este pago. Al saldarse, pasarán de <strong className="text-amber-800">Pendiente</strong> a <strong className="text-blue-800">{paymentAccount}</strong>.
                        </p>
                      </div>
                      {pendingCargos.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={handleSelectAllCargos}
                            className="text-[11px] font-semibold text-[#8b7355] hover:text-[#735f46] hover:underline"
                          >
                            Todas
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={handleDeselectAllCargos}
                            className="text-[11px] font-semibold text-[#6b645c] hover:text-[#3e3a35] hover:underline"
                          >
                            Ninguna
                          </button>
                        </div>
                      )}
                    </div>

                    {pendingCargos.length > 0 ? (
                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 rounded-xl border border-[#e0d6c8] bg-white p-2">
                        {pendingCargos.map((cargo) => {
                          const isSelected = !!cargo.id && selectedCargoIds.includes(cargo.id);
                          const cargoAmount = paymentType === 'COBRO_CLIENTE' ? parseCurrency(cargo.Ingresos) : parseCurrency(cargo.Egresos);
                          const statusInfo = cargo.id ? cargoStatusMap[cargo.id] : undefined;

                          return (
                            <div
                              key={cargo.id}
                              onClick={() => cargo.id && handleToggleCargo(cargo.id)}
                              className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                                isSelected
                                  ? 'bg-[#f4ebd8]/40 border-[#8b7355] shadow-2xs'
                                  : 'bg-white border-[#e0d6c8]/60 hover:border-[#8b7355]/50 hover:bg-[#faf7f2]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => cargo.id && handleToggleCargo(cargo.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded text-[#8b7355] border-[#e0d6c8] focus:ring-[#8b7355] cursor-pointer"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center space-x-2 flex-wrap">
                                      <span className="text-xs font-bold text-[#3e3a35]">{cargo.Fecha}</span>
                                      <span className="text-xs font-semibold text-[#6b645c] truncate">
                                        {cargo.Rubro || 'Sin rubro'}
                                      </span>
                                      {cargo['Subrubro/Producto'] && (
                                        <span className="text-[10px] bg-[#eae0cd]/60 text-[#5c544d] px-1.5 py-0.5 rounded font-medium">
                                          {cargo['Subrubro/Producto']}
                                        </span>
                                      )}
                                    </div>
                                    {cargo.Observaciones && (
                                      <p className="text-[10px] text-[#8c827a] truncate max-w-sm">
                                        {cargo.Observaciones}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`text-xs font-bold font-mono ${paymentType === 'COBRO_CLIENTE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {formatCurrency(cargoAmount)}
                                  </span>
                                  <div className="text-[9px] uppercase tracking-wider text-amber-700 font-semibold">
                                    Pendiente
                                  </div>
                                </div>
                              </div>

                              {/* Status Badge when selected */}
                              {isSelected && statusInfo && (
                                <div className="pt-1.5 border-t border-[#e0d6c8]/50 flex items-center justify-between text-[11px]">
                                  {statusInfo.status === 'FULL' && (
                                    <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      <CheckCircle2 size={12} className="text-emerald-600" />
                                      Pasa completo a {paymentAccount} (Saldado 100%)
                                    </span>
                                  )}
                                  {statusInfo.status === 'PARTIAL' && (
                                    <span className="inline-flex items-center gap-1 text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      <span>⚡ Pago parcial:</span>
                                      <span>${formatCurrency(statusInfo.paidAmount)} a {paymentAccount}</span>
                                      <span className="text-gray-400 font-normal">|</span>
                                      <span>${formatCurrency(statusInfo.pendingRemainder)} resta en Pendiente</span>
                                    </span>
                                  )}
                                  {statusInfo.status === 'UNPAID' && (
                                    <span className="text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                                      El monto ingresado aún no cubre este cargo
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-[#faf7f2] rounded-xl border border-dashed border-[#e0d6c8] text-center text-xs text-[#6b645c]">
                        No hay facturas pendientes registradas para esta cuenta. El importe se registrará como pago general o anticipo a cuenta.
                      </div>
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
                      {selectedCargoIds.length > 0 ? (
                        <span>Impacta en {paymentAccount} y cambia {selectedCargoIds.length} cargo(s) de Pendiente a {paymentAccount}</span>
                      ) : (
                        <span>Impacta en {paymentAccount} como cobro/pago general a cuenta</span>
                      )}
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
              <div className="p-3.5 sm:p-4 border-t border-[#e0d6c8] bg-[#faf9f6] flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-[#e0d6c8] text-[#6b645c] rounded-xl text-sm hover:bg-[#f4ebd8] font-semibold transition-colors bg-white text-center justify-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={paymentSubmitting}
                  className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5 ${
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
