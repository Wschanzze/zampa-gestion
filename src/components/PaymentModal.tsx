import React, { useState, useEffect } from 'react';
import ComboboxSelect from './ComboboxSelect';
// @ts-ignore
import { X, CheckCircle, ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (payment: {
    entity: string;
    amount: number;
    type: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR';
    account: string;
    date: string;
    subactividad?: string;
    notes?: string;
  }) => Promise<boolean | void>;
  initialEntity?: string;
  initialType?: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR';
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

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  initialEntity = '',
  initialType = 'COBRO_CLIENTE',
  pendingBalance = 0,
  availableEntities = []
}) => {
  const [entity, setEntity] = useState(initialEntity);
  const [type, setType] = useState<'COBRO_CLIENTE' | 'PAGO_PROVEEDOR'>(initialType);
  const [amount, setAmount] = useState<number | ''>('');
  const [account, setAccount] = useState('BANCO');
  const [date, setDate] = useState(new Date().toLocaleDateString('es-AR'));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialEntity) {
      setEntity(initialEntity);
    }
    if (initialType) {
      setType(initialType);
    }
  }, [initialEntity, initialType, isOpen]);

  // Current entity pending balance
  const currentPending = availableEntities.find(e => e.name.toLowerCase() === entity.toLowerCase())?.saldo ?? pendingBalance;

  const handleFillTotal = () => {
    if (Math.abs(currentPending) > 0) {
      setAmount(Math.abs(currentPending));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity.trim()) {
      alert('Por favor especifica un cliente o proveedor');
      return;
    }
    if (!amount || amount <= 0) {
      alert('El monto a registrar debe ser mayor a cero');
      return;
    }

    setSubmitting(true);
    const success = await onRegister({
      entity: entity.trim(),
      amount: Number(amount),
      type,
      account,
      date,
      notes: notes.trim()
    });
    setSubmitting(false);

    if (success !== false) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#faf9f6] rounded-2xl border border-[#e0d6c8] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e0d6c8] flex justify-between items-center bg-[#f4ebd8]/80">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-xl ${type === 'COBRO_CLIENTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {type === 'COBRO_CLIENTE' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#3e3a35]">
                {type === 'COBRO_CLIENTE' ? 'Registrar Cobro de Cliente' : 'Registrar Pago a Proveedor'}
              </h3>
              <p className="text-xs text-[#6b645c]">
                {type === 'COBRO_CLIENTE' ? 'Cobro parcial o total de deuda pendiente de ventas' : 'Pago parcial o total de facturas pendientes de compra'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-[#6b645c] hover:text-[#3e3a35] hover:bg-[#e0d6c8]/50 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Operation Type Toggle */}
          <div className="flex p-1 bg-[#eae0cd]/60 rounded-xl border border-[#e0d6c8]">
            <button
              type="button"
              onClick={() => setType('COBRO_CLIENTE')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
                type === 'COBRO_CLIENTE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#5c544d] hover:text-[#2d2a26]'
              }`}
            >
              <span>Cobro a Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => setType('PAGO_PROVEEDOR')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
                type === 'PAGO_PROVEEDOR'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[#5c544d] hover:text-[#2d2a26]'
              }`}
            >
              <span>Pago a Proveedor</span>
            </button>
          </div>

          {/* Entity (Client/Supplier) */}
          <ComboboxSelect
            label={type === 'COBRO_CLIENTE' ? 'Cliente que paga' : 'Proveedor al que se paga'}
            name="entity"
            required
            placeholder="Selecciona o escribe cliente/proveedor..."
            value={entity}
            onChange={(val) => setEntity(val)}
            options={availableEntities.map(e => e.name)}
          />

          {/* Pending Debt Alert / Card */}
          {entity && (
            <div className="p-3 bg-[#f4ebd8]/40 rounded-xl border border-[#e0d6c8] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[#6b645c] uppercase">Saldo Pendiente Actual</span>
                <p className={`text-base font-bold ${currentPending > 0 ? 'text-emerald-700' : currentPending < 0 ? 'text-rose-700' : 'text-[#6b645c]'}`}>
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
                  className="px-2.5 py-1 text-xs font-bold bg-[#8b7355]/15 text-[#5c4a35] hover:bg-[#8b7355]/25 rounded-lg transition-colors border border-[#8b7355]/30"
                >
                  Saldar Todo
                </button>
              )}
            </div>
          )}

          {/* Amount and Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">Monto del Pago ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#6b645c] font-bold text-sm">$</span>
                <input 
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 border border-[#e0d6c8] bg-white rounded-lg text-sm text-[#3e3a35] font-bold outline-none focus:ring-1 focus:ring-[#8b7355]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">Medio / Cuenta</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] font-semibold outline-none focus:ring-1 focus:ring-[#8b7355]"
              >
                <option value="BANCO">BANCO (Transferencia / Depósito)</option>
                <option value="EFECTIVO">EFECTIVO (Caja)</option>
                <option value="CAJA CHICA">CAJA CHICA</option>
              </select>
            </div>
          </div>

          {/* Date and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">Fecha de Cobro/Pago</label>
              <input 
                required
                type="text"
                placeholder="25/9/2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] outline-none focus:ring-1 focus:ring-[#8b7355]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6b645c] mb-1">Observaciones</label>
              <input 
                type="text"
                placeholder="Ej. Transferencia Bco Galicia..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-[#e0d6c8] bg-white rounded-lg px-3 py-2 text-sm text-[#3e3a35] outline-none focus:ring-1 focus:ring-[#8b7355]"
              />
            </div>
          </div>

          {/* Summary indicator */}
          {amount && typeof amount === 'number' && amount > 0 && Math.abs(currentPending) > 0 && (
            <div className="text-xs text-[#6b645c] bg-white p-2.5 rounded-lg border border-[#e0d6c8]/60 flex items-center justify-between">
              <span>Nuevo saldo remanente:</span>
              <span className="font-bold text-[#3e3a35]">
                {formatCurrency(Math.abs(currentPending) - amount)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-[#e0d6c8] flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-[#e0d6c8] text-[#6b645c] rounded-xl text-xs md:text-sm hover:bg-[#f4ebd8] font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#8b7355] text-white rounded-xl text-xs md:text-sm hover:bg-[#7a6448] font-bold shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <CheckCircle size={15} />
              <span>{submitting ? 'Guardando...' : 'Confirmar y Guardar'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
