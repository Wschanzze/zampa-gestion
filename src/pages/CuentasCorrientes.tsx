import React, { useState, useMemo } from 'react';
import type { Transaction } from '../utils/calculations';
import { calculatePendientes, buildEntityStatement } from '../utils/calculations';
import { useListas } from '../lib/api';
import UnifiedMovementModal from '../components/UnifiedMovementModal';
// @ts-ignore
import { Search, ArrowDownLeft, ArrowUpRight, CheckCircle2, ChevronDown, ChevronUp, History, Download, Check, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface CuentasCorrientesProps {
  data: Transaction[];
  onRegisterPayment: (payment: {
    entity: string;
    amount: number;
    type: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR';
    account: string;
    date: string;
    subactividad?: string;
    notes?: string;
  }) => Promise<boolean | void>;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

const CuentasCorrientes: React.FC<CuentasCorrientesProps> = ({ data, onRegisterPayment }) => {
  const [filterType, setFilterType] = useState<'TODOS' | 'CLIENTES' | 'PROVEEDORES' | 'SALDADOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityForModal, setSelectedEntityForModal] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'COBRO_CLIENTE' | 'PAGO_PROVEEDOR'>('COBRO_CLIENTE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  const { entidades } = useListas();

  // Compute pending balances for all entities (all Prov/Cliente in data + database entidades)
  const pendientes = useMemo(() => {
    return calculatePendientes(data, entidades.map(e => e.nombre));
  }, [data, entidades]);

  // Overall totals
  const totalACobrar = useMemo(() => {
    return pendientes.filter(p => p.saldo > 0).reduce((acc, p) => acc + p.saldo, 0);
  }, [pendientes]);

  const totalAPagar = useMemo(() => {
    return pendientes.filter(p => p.saldo < 0).reduce((acc, p) => acc + Math.abs(p.saldo), 0);
  }, [pendientes]);

  const saldoNeto = totalACobrar - totalAPagar;

  // Filtered list of entities
  const filteredEntities = useMemo(() => {
    return pendientes.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tipo.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchFilter = true;
      if (filterType === 'CLIENTES') matchFilter = item.saldo > 0;
      if (filterType === 'PROVEEDORES') matchFilter = item.saldo < 0;
      if (filterType === 'SALDADOS') matchFilter = item.saldo === 0;

      return matchSearch && matchFilter;
    }).sort((a, b) => {
      const absA = Math.abs(a.saldo);
      const absB = Math.abs(b.saldo);
      if (absA !== absB) {
        return absB - absA;
      }
      return a.entity.localeCompare(b.entity, 'es', { sensitivity: 'base' });
    });
  }, [pendientes, searchTerm, filterType]);

  const handleOpenPayment = (entityName: string, isCliente: boolean) => {
    setSelectedEntityForModal(entityName);
    setModalType(isCliente ? 'COBRO_CLIENTE' : 'PAGO_PROVEEDOR');
    setIsModalOpen(true);
  };

  const handleOpenGeneralPayment = () => {
    setSelectedEntityForModal(null);
    setModalType('COBRO_CLIENTE');
    setIsModalOpen(true);
  };

  const handleExportPDF = (entityName: string, entitySaldo: number, entityTipo: 'CLIENTE' | 'PROVEEDOR' | 'AMBOS') => {
    // 1. Get clean progressive statement for this entity
    const statement = buildEntityStatement(entityName, entityTipo, data);

    // 2. Create a temporary div element for PDF generation
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; position: relative; min-height: 100vh; background-color: #ffffff; color: #333;">
        <!-- Watermark -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('/ovejas_render.png'); background-position: center; background-repeat: no-repeat; background-size: 80%; opacity: 0.05; pointer-events: none; z-index: 0;"></div>
        
        <div style="position: relative; z-index: 1;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #8b7355; padding-bottom: 18px;">
            <div>
              <img src="/logo negro.png" alt="ZAMPA" style="height: 52px; margin-bottom: 8px;" onerror="this.style.display='none'" />
              <p style="font-size: 11px; color: #666; margin: 0; font-weight: bold; letter-spacing: 1px;">QUESERÍA ARTESANAL ZAMPA</p>
              <p style="font-size: 10px; color: #999; margin: 2px 0 0 0;">Gestión Administrativa y Financiera</p>
            </div>
            <div style="text-align: right;">
              <h1 style="font-size: 22px; color: #8b7355; margin: 0 0 6px 0; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
                ESTADO DE CUENTA CORRIENTE
              </h1>
              <p style="font-size: 13px; color: #444; margin: 0;"><strong>${entityTipo === 'PROVEEDOR' ? 'PROVEEDOR:' : 'CLIENTE:'}</strong> ${entityName.toUpperCase()}</p>
              <p style="font-size: 11px; color: #888; margin: 4px 0 0 0;">Fecha Emisión: ${new Date().toLocaleDateString('es-AR')}</p>
            </div>
          </div>

          <!-- Outstanding Balance Highlight Block -->
          <div style="background-color: ${entitySaldo > 0 ? '#f0fdf4' : entitySaldo < 0 ? '#fff1f2' : '#f9fafb'}; border: 1px solid ${entitySaldo > 0 ? '#bbf7d0' : entitySaldo < 0 ? '#fecdd3' : '#e5e7eb'}; padding: 20px 25px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-size: 12px; font-weight: 700; color: #666; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">
                ${entitySaldo > 0 ? 'SALDO PENDIENTE A COBRAR (A NUESTRO FAVOR)' : entitySaldo < 0 ? 'SALDO PENDIENTE A PAGAR (A PROVEEDOR)' : 'CUENTA SALDADA / AL DÍA'}
              </p>
              <p style="font-size: 11px; color: #888; margin: 0;">
                ${entitySaldo > 0 ? 'Monto adeudado a la fecha.' : entitySaldo < 0 ? 'Monto adeudado al proveedor a la fecha.' : 'No registra deudas pendientes.'}
              </p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 28px; font-weight: 900; color: ${entitySaldo > 0 ? '#059669' : entitySaldo < 0 ? '#e11d48' : '#374151'};">
                ${entitySaldo === 0 ? '$0' : formatCurrency(Math.abs(entitySaldo))}
              </span>
            </div>
          </div>

          <!-- Table of Progressive Statement -->
          <h3 style="font-size: 13px; color: #333; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; font-weight: bold;">EXTRACTO CRONOLÓGICO DE MOVIMIENTOS</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #fafafa; border-bottom: 2px solid #ddd;">
                <th style="padding: 10px 6px; font-weight: 700; color: #555;">FECHA</th>
                <th style="padding: 10px 6px; font-weight: 700; color: #555;">CONCEPTO</th>
                <th style="padding: 10px 6px; font-weight: 700; color: #555;">MEDIO</th>
                <th style="padding: 10px 6px; font-weight: 700; color: #555; text-align: right;">CARGOS (+)</th>
                <th style="padding: 10px 6px; font-weight: 700; color: #555; text-align: right;">PAGOS (-)</th>
                <th style="padding: 10px 6px; font-weight: 700; color: #555; text-align: right;">SALDO RESULTANTE</th>
              </tr>
            </thead>
            <tbody>
              ${statement.length === 0 ? `
                <tr><td colspan="6" style="padding: 20px; text-align: center; color: #888;">No se registran movimientos.</td></tr>
              ` : statement.map(s => `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 9px 6px; color: #555; white-space: nowrap;">${s.fecha || '-'}</td>
                  <td style="padding: 9px 6px; color: #333;">
                    <strong>${s.concepto}</strong>
                    ${s.subrubro ? ` - <span style="color: #666;">${s.subrubro}</span>` : ''}
                    ${s.esContado ? ` <span style="font-size: 9px; padding: 2px 4px; background: #e0f2fe; color: #0369a1; border-radius: 3px;">(${s.cuenta === 'BANCO' ? 'Pagado en Banco' : s.cuenta === 'EFECTIVO' ? 'Pagado en Efectivo' : 'Saldado'})</span>` : ''}
                    ${s.observaciones ? `<br><span style="color: #888; font-size: 10px;">${s.observaciones}</span>` : ''}
                  </td>
                  <td style="padding: 9px 6px; color: #666;">${s.cuenta || '-'}</td>
                  <td style="padding: 9px 6px; text-align: right; color: #333; font-weight: 600;">${s.cargo > 0 ? formatCurrency(s.cargo) : '-'}</td>
                  <td style="padding: 9px 6px; text-align: right; color: #059669; font-weight: 600;">${s.abono > 0 ? formatCurrency(s.abono) : '-'}</td>
                  <td style="padding: 9px 6px; text-align: right; font-weight: bold; color: ${s.saldo > 0 ? '#059669' : s.saldo < 0 ? '#e11d48' : '#666'};">
                    ${s.saldo === 0 ? '$0' : formatCurrency(Math.abs(s.saldo))}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #fafafa; border-top: 2px solid #ddd; border-bottom: 2px solid #ddd;">
                <td colspan="3" style="padding: 10px 6px; font-weight: bold; text-align: right; color: #555;">TOTALES:</td>
                <td style="padding: 10px 6px; font-weight: bold; text-align: right; color: #333;">
                  ${formatCurrency(statement.reduce((acc, s) => acc + s.cargo, 0))}
                </td>
                <td style="padding: 10px 6px; font-weight: bold; text-align: right; color: #059669;">
                  ${formatCurrency(statement.reduce((acc, s) => acc + s.abono, 0))}
                </td>
                <td style="padding: 10px 6px; font-weight: 900; text-align: right; color: ${entitySaldo > 0 ? '#059669' : entitySaldo < 0 ? '#e11d48' : '#333'};">
                  ${entitySaldo === 0 ? '$0' : formatCurrency(Math.abs(entitySaldo))}
                </td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 40px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #eee; padding-top: 15px;">
            <p style="margin: 0 0 4px 0;"><strong>DOCUMENTO INTERNO / NO VÁLIDO COMO FACTURA LEGAL</strong></p>
            <p style="margin: 0;">Quesería Artesanal Zampa - Extracto emitido automáticamente por el sistema de gestión.</p>
          </div>
        </div>
      </div>
    `;

    // 3. Generate PDF
    const opt: any = {
      margin: 0,
      filename: `Estado_Cuenta_${entityName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save();
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 p-5 rounded-xl border border-[#e0d6c8] shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-[#3e3a35]">Cuentas Corrientes y Gestión de Deudas</h3>
          <p className="text-xs text-[#6b645c] mt-0.5">Control de saldos pendientes, ventas a crédito y registro de pagos parciales</p>
        </div>

        <button
          onClick={handleOpenGeneralPayment}
          className="flex items-center space-x-2 px-4 py-2.5 text-white rounded-xl text-xs md:text-sm hover:brightness-110 active:scale-[0.98] font-bold shadow-sm transition-all border border-white/20"
          style={{
            background: 'linear-gradient(90deg, #15803d 0%, #16a34a 50%, #dc2626 50%, #b91c1c 100%)'
          }}
        >
          <ArrowDownLeft size={16} className="drop-shadow-sm" />
          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Registrar Cobro / Pago Parcial</span>
          <ArrowUpRight size={16} className="drop-shadow-sm" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* A Cobrar */}
        <div className="bg-white/90 p-4 rounded-xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <ArrowDownLeft size={16} />
              <span>Clientes nos deben (A Cobrar)</span>
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(totalACobrar)}</p>
            <span className="text-[11px] text-[#6b645c]">
              {pendientes.filter(p => p.saldo > 0).length} clientes con saldo pendiente
            </span>
          </div>
        </div>

        {/* A Pagar */}
        <div className="bg-white/90 p-4 rounded-xl border border-rose-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1 text-rose-800 text-xs font-bold uppercase tracking-wider">
              <ArrowUpRight size={16} />
              <span>Debemos a Proveedores (A Pagar)</span>
            </div>
            <p className="text-2xl font-black text-rose-700 mt-1">{formatCurrency(totalAPagar)}</p>
            <span className="text-[11px] text-[#6b645c]">
              {pendientes.filter(p => p.saldo < 0).length} proveedores con saldo pendiente
            </span>
          </div>
        </div>

        {/* Saldo Neto */}
        <div className="bg-white/90 p-4 rounded-xl border border-[#e0d6c8] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[#6b645c] text-xs font-bold uppercase tracking-wider">
              Saldo Neto a Favor
            </span>
            <p className={`text-2xl font-black mt-1 ${saldoNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(saldoNeto)}
            </p>
            <span className="text-[11px] text-[#6b645c]">
              Diferencia de cuentas a cobrar vs pagar
            </span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/95 p-3.5 sm:p-4 rounded-xl shadow-sm border border-[#e0d6c8] flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-[#6b645c]" />
          <input 
            type="text" 
            placeholder="Buscar por cliente o proveedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 border border-[#e0d6c8] rounded-lg text-xs md:text-sm bg-[#faf9f6] text-[#3e3a35] focus:ring-1 focus:ring-[#8b7355] outline-none" 
          />
        </div>

        {/* Tabs Filter (Horizontally scrollable on mobile) */}
        <div className="flex p-1 bg-[#eae0cd]/60 rounded-xl border border-[#e0d6c8] text-xs font-semibold overflow-x-auto max-w-full whitespace-nowrap">
          <button
            onClick={() => setFilterType('TODOS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'TODOS' ? 'bg-white text-[#3e3a35] shadow-xs font-bold' : 'text-[#6b645c] hover:text-[#2d2a26]'}`}
          >
            Todos ({pendientes.length})
          </button>
          <button
            onClick={() => setFilterType('CLIENTES')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'CLIENTES' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-[#6b645c] hover:text-[#2d2a26]'}`}
          >
            Clientes a Cobrar ({pendientes.filter(p => p.saldo > 0).length})
          </button>
          <button
            onClick={() => setFilterType('PROVEEDORES')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'PROVEEDORES' ? 'bg-white text-rose-800 shadow-xs font-bold' : 'text-[#6b645c] hover:text-[#2d2a26]'}`}
          >
            Proveedores a Pagar ({pendientes.filter(p => p.saldo < 0).length})
          </button>
          <button
            onClick={() => setFilterType('SALDADOS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'SALDADOS' ? 'bg-white text-[#3e3a35] shadow-xs font-bold' : 'text-[#6b645c] hover:text-[#2d2a26]'}`}
          >
            Al Día / Saldados ({pendientes.filter(p => p.saldo === 0).length})
          </button>
        </div>

      </div>

      {/* Mobile scroll hint */}
      <div className="sm:hidden text-[11px] text-[#8b7355] bg-[#f4ebd8]/70 px-3 py-1.5 rounded-lg border border-[#e0d6c8] text-center font-medium">
        ↔ Desliza hacia los lados para ver los saldos y botones de acción
      </div>

      {/* Main Entities Table */}
      <div className="bg-white/95 rounded-xl shadow-sm border border-[#e0d6c8] overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-xs md:text-sm text-left">
            <thead className="text-xs text-[#6b645c] uppercase bg-[#f4ebd8] border-b border-[#e0d6c8] sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="px-4 py-3">Cliente / Proveedor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total a Crédito</th>
                <th className="px-4 py-3 text-right text-emerald-800">Cancelado / Pagado</th>
                <th className="px-4 py-3 text-right font-bold text-[#3e3a35]">Saldo Pendiente</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map((row) => {
                const isCliente = row.saldo > 0;
                const isProveedor = row.saldo < 0;
                const isSaldado = row.saldo === 0;
                const isExpanded = expandedEntity === row.entity;

                return (
                  <React.Fragment key={row.entity}>
                    <tr className={`border-b border-[#e0d6c8]/40 hover:bg-[#f4ebd8]/30 transition-colors ${isExpanded ? 'bg-[#faf7f2]' : ''}`}>
                      
                      {/* Name & Role */}
                      <td className="px-4 py-3.5 font-bold text-[#3e3a35]">
                        <div className="flex items-center space-x-2.5">
                          <button
                            onClick={() => setExpandedEntity(isExpanded ? null : row.entity)}
                            className="p-1 text-[#6b645c] hover:text-[#3e3a35] hover:bg-[#e0d6c8]/50 rounded transition-colors"
                            title="Ver extracto de cuenta corriente"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#2d2a26]">{row.entity}</span>
                            <span className="text-[10px] text-[#8c827a] font-normal">
                              {row.tipo === 'AMBOS' ? 'Cliente / Proveedor' : row.tipo === 'CLIENTE' ? 'Cliente' : 'Proveedor'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* State badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isCliente 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : isProveedor 
                            ? 'bg-rose-50 text-rose-800 border-rose-200' 
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {isCliente ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              <span>A COBRAR</span>
                            </>
                          ) : isProveedor ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>A PAGAR</span>
                            </>
                          ) : (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span>AL DÍA ($0)</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Total Facturado / a Crédito */}
                      <td className="px-4 py-3.5 text-right font-mono text-[#3e3a35] font-semibold">
                        {row.totalFacturadoCredito > 0 ? (
                          <div>
                            <span>{formatCurrency(row.totalFacturadoCredito)}</span>
                            <div className="text-[10px] text-[#8c827a] font-sans font-normal">
                              {isCliente ? 'ventas crédito' : isProveedor ? 'facturas crédito' : 'operado'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-normal">-</span>
                        )}
                      </td>

                      {/* Total Cancelado / Pagado */}
                      <td className="px-4 py-3.5 text-right font-mono text-emerald-700 font-semibold">
                        {row.totalCancelado > 0 ? (
                          <div>
                            <span>{formatCurrency(row.totalCancelado)}</span>
                            <div className="text-[10px] text-emerald-600/80 font-sans font-normal">
                              {isCliente ? 'cobrado' : isProveedor ? 'pagado' : 'cancelado'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-normal">-</span>
                        )}
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold whitespace-nowrap">
                        {row.saldo === 0 ? (
                          <div className="flex items-center justify-end gap-1 text-gray-500 font-bold text-sm">
                            <Check size={14} className="text-emerald-600" /> $0
                          </div>
                        ) : (
                          <div>
                            <span className={`text-base font-black ${isCliente ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isCliente ? '+ ' : '- '}
                              {formatCurrency(Math.abs(row.saldo))}
                            </span>
                            <div className={`text-[10px] font-sans font-semibold uppercase tracking-wider ${isCliente ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isCliente ? 'Falta cobrar' : 'Falta pagar'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
                          {!isSaldado ? (
                            <button
                              onClick={() => handleOpenPayment(row.entity, isCliente)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1 ${
                                isCliente 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'bg-rose-600 hover:bg-rose-700 text-white'
                              }`}
                            >
                              <span>{isCliente ? 'Cobrar' : 'Pagar'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenPayment(row.entity, row.tipo !== 'PROVEEDOR')}
                              className="px-2.5 py-1.5 text-xs border border-[#e0d6c8] text-[#5c544d] hover:bg-[#f4ebd8] rounded-lg font-semibold transition-colors flex items-center space-x-1 bg-white"
                              title="Registrar cobro o pago"
                            >
                              <span>Cobro / Pago</span>
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedEntity(isExpanded ? null : row.entity)}
                            className={`px-2.5 py-1.5 text-xs border rounded-lg font-semibold transition-colors flex items-center space-x-1 ${
                              isExpanded ? 'bg-[#8b7355] text-white border-[#8b7355]' : 'border-[#e0d6c8] text-[#6b645c] hover:bg-[#f4ebd8] bg-white'
                            }`}
                            title="Ver extracto de cuenta corriente"
                          >
                            <History size={13} />
                            <span>Extracto</span>
                          </button>
                          <button
                            onClick={() => handleExportPDF(row.entity, row.saldo, row.tipo)}
                            className="px-2.5 py-1.5 text-xs border border-[#e0d6c8] text-[#8b7355] hover:bg-[#f4ebd8] rounded-lg font-semibold transition-colors flex items-center space-x-1 bg-white"
                            title="Descargar extracto en PDF"
                          >
                            <Download size={13} />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>

                    </tr>

                    {/* Expanded Extract Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#fcfbf9] border-b border-[#e0d6c8]">
                        <td colSpan={6} className="p-4 sm:p-6 space-y-4">
                          
                          {/* Drawer Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0d6c8]/60 pb-3">
                            <div>
                              <h4 className="text-sm font-bold text-[#3e3a35] flex items-center space-x-2">
                                <History size={16} className="text-[#8b7355]" />
                                <span>Extracto de Cuenta Corriente: {row.entity}</span>
                              </h4>
                              <p className="text-xs text-[#6b645c] mt-0.5">
                                Evolución cronológica de facturación a crédito, pagos realizados y saldo progresivo
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleExportPDF(row.entity, row.saldo, row.tipo)}
                                className="px-3 py-1.5 text-xs bg-white border border-[#e0d6c8] text-[#8b7355] hover:bg-[#f4ebd8] rounded-lg font-bold transition-colors flex items-center space-x-1.5 shadow-2xs"
                              >
                                <Download size={13} />
                                <span>Descargar Extracto PDF</span>
                              </button>
                              {!isSaldado && (
                                <button
                                  onClick={() => handleOpenPayment(row.entity, isCliente)}
                                  className={`px-3 py-1.5 text-xs text-white rounded-lg font-bold transition-all shadow-2xs flex items-center space-x-1.5 ${
                                    isCliente ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                  }`}
                                >
                                  <span>{isCliente ? 'Registrar Cobro' : 'Registrar Pago'}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Mini Summary Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-[#e0d6c8]/80 shadow-2xs">
                              <span className="text-[11px] font-bold text-[#6b645c] uppercase">Total Operado a Crédito</span>
                              <p className="text-base font-bold text-[#3e3a35] mt-0.5">{formatCurrency(row.totalFacturadoCredito)}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-[#e0d6c8]/80 shadow-2xs">
                              <span className="text-[11px] font-bold text-[#6b645c] uppercase">Total Cancelado / Pagado</span>
                              <p className="text-base font-bold text-emerald-700 mt-0.5">{formatCurrency(row.totalCancelado)}</p>
                            </div>
                            <div className={`p-3 rounded-lg border shadow-2xs ${
                              row.saldo > 0 ? 'bg-emerald-50/70 border-emerald-200' : row.saldo < 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-[#faf9f6] border-[#e0d6c8]/80'
                            }`}>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b645c]">
                                {row.saldo > 0 ? 'Saldo Pendiente (A Cobrar)' : row.saldo < 0 ? 'Saldo Pendiente (A Pagar)' : 'Saldo Actual'}
                              </span>
                              <p className={`text-base font-black mt-0.5 ${
                                row.saldo > 0 ? 'text-emerald-700' : row.saldo < 0 ? 'text-rose-700' : 'text-gray-600'
                              }`}>
                                {row.saldo === 0 ? '$0 (Al Día)' : formatCurrency(Math.abs(row.saldo))}
                              </p>
                            </div>
                          </div>

                          {/* Statement Table */}
                          {(() => {
                            const statement = buildEntityStatement(row.entity, row.tipo, data);
                            if (statement.length === 0) {
                              return (
                                <div className="p-6 text-center text-[#6b645c] bg-white rounded-lg border border-[#e0d6c8]/60">
                                  No hay movimientos registrados para esta cuenta.
                                </div>
                              );
                            }
                            return (
                              <div className="overflow-x-auto bg-white rounded-xl border border-[#e0d6c8] shadow-2xs">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-[#f4ebd8]/60 border-b border-[#e0d6c8] text-[#6b645c] uppercase text-[11px] font-bold">
                                    <tr>
                                      <th className="px-3.5 py-2.5">Fecha</th>
                                      <th className="px-3.5 py-2.5">Concepto / Operación</th>
                                      <th className="px-3.5 py-2.5">Medio</th>
                                      <th className="px-3.5 py-2.5 text-right text-emerald-900">Cargos (+)</th>
                                      <th className="px-3.5 py-2.5 text-right text-rose-900">Pagos (-)</th>
                                      <th className="px-3.5 py-2.5 text-right font-bold text-[#3e3a35]">Saldo Resultante ($)</th>
                                      <th className="px-3.5 py-2.5">Observaciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {statement.map((s) => (
                                      <tr key={s.id} className="hover:bg-[#faf7f2] transition-colors">
                                        <td className="px-3.5 py-2.5 font-medium whitespace-nowrap text-[#3e3a35]">{s.fecha}</td>
                                        <td className="px-3.5 py-2.5 font-medium text-[#3e3a35]">
                                          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                            <span>{s.concepto}</span>
                                            {s.subrubro && (
                                              <span className="text-[10px] text-[#6b645c] bg-[#eae0cd]/50 px-1.5 py-0.5 rounded">
                                                {s.subrubro}
                                              </span>
                                            )}
                                            {s.esContado && (
                                              <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                                                {s.cuenta === 'BANCO' ? 'Pagado en Banco' : s.cuenta === 'EFECTIVO' ? 'Pagado en Efectivo' : 'Saldado'}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-3.5 py-2.5">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            s.cuenta?.toUpperCase() === 'PENDIENTE'
                                              ? 'bg-amber-100 text-amber-900'
                                              : s.cuenta?.toUpperCase() === 'BANCO'
                                              ? 'bg-blue-100 text-blue-900'
                                              : 'bg-emerald-100 text-emerald-900'
                                          }`}>
                                            {s.cuenta || '-'}
                                          </span>
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-[#3e3a35]">
                                          {s.cargo > 0 ? formatCurrency(s.cargo) : '-'}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                          {s.abono > 0 ? formatCurrency(s.abono) : '-'}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right font-mono font-black text-xs">
                                          <span className={s.saldo > 0 ? 'text-emerald-700' : s.saldo < 0 ? 'text-rose-700' : 'text-gray-500'}>
                                            {s.saldo === 0 ? '$0' : formatCurrency(Math.abs(s.saldo))}
                                          </span>
                                        </td>
                                        <td className="px-3.5 py-2.5 text-[#6b645c] max-w-[200px] truncate" title={s.observaciones}>
                                          {s.observaciones || '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredEntities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#6b645c]">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2 opacity-60" />
                    No se encontraron cuentas que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Movement Modal (opened in Cta Cte mode) */}
      <UnifiedMovementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode="CUENTA_CORRIENTE"
        existingData={data}
        onRegisterPayment={onRegisterPayment}
        initialEntity={selectedEntityForModal || ''}
        initialPaymentType={modalType}
        pendingBalance={pendientes.find(p => p.entity.toLowerCase() === selectedEntityForModal?.toLowerCase())?.saldo || 0}
        availableEntities={pendientes.map(p => ({ name: p.entity, saldo: p.saldo }))}
      />

    </div>
  );
};

export default CuentasCorrientes;
