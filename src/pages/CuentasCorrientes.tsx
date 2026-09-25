import React, { useState, useMemo } from 'react';
import type { Transaction } from '../utils/calculations';
import { calculatePendientes, parseCurrency } from '../utils/calculations';
import PaymentModal from '../components/PaymentModal';
// @ts-ignore
import { Search, PlusCircle, ArrowDownLeft, ArrowUpRight, CheckCircle2, ChevronDown, ChevronUp, History, Download } from 'lucide-react';
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
  }).format(val);
};

const CuentasCorrientes: React.FC<CuentasCorrientesProps> = ({ data, onRegisterPayment }) => {
  const [filterType, setFilterType] = useState<'TODOS' | 'CLIENTES' | 'PROVEEDORES' | 'SALDADOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityForModal, setSelectedEntityForModal] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'COBRO_CLIENTE' | 'PAGO_PROVEEDOR'>('COBRO_CLIENTE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  // Compute pending balances for all entities
  const pendientes = useMemo(() => {
    return calculatePendientes(data);
  }, [data]);

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
      const matchSearch = searchTerm === '' || item.entity.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchFilter = true;
      if (filterType === 'CLIENTES') matchFilter = item.saldo > 0;
      if (filterType === 'PROVEEDORES') matchFilter = item.saldo < 0;
      if (filterType === 'SALDADOS') matchFilter = item.saldo === 0;

      return matchSearch && matchFilter;
    }).sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));
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

  // Get transactions history for expanded entity
  const entityHistory = useMemo(() => {
    if (!expandedEntity) return [];
    return data.filter(d => d['Prov/Cliente']?.toLowerCase().trim() === expandedEntity.toLowerCase().trim())
      .sort((a, b) => {
        // Compare dates (D/M/YYYY)
        const parseD = (str: string) => {
          const parts = str?.split('/');
          if (parts && parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
          return 0;
        };
        return parseD(a.Fecha) - parseD(b.Fecha);
      });
  }, [data, expandedEntity]);

  const handleExportPDF = (entityName: string, entitySaldo: number) => {
    // 1. Get history for this entity
    const history = data.filter(d => d['Prov/Cliente']?.toLowerCase().trim() === entityName.toLowerCase().trim())
      .sort((a, b) => {
        const parseD = (str: string) => {
          const parts = str?.split('/');
          if (parts && parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
          return 0;
        };
        return parseD(a.Fecha) - parseD(b.Fecha);
      });

    // 2. Create a temporary div element for PDF generation
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="padding: 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; position: relative; min-height: 100vh; background-color: #ffffff; color: #333;">
        <!-- Watermark -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('/ovejas_render.png'); background-position: center; background-repeat: no-repeat; background-size: 80%; opacity: 0.05; pointer-events: none; z-index: 0;"></div>
        
        <div style="position: relative; z-index: 1;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #8b7355; padding-bottom: 20px;">
            <div>
              <img src="/logo negro.png" alt="ZAMPA" style="height: 60px; margin-bottom: 10px;" onerror="this.style.display='none'" />
              <p style="font-size: 11px; color: #666; margin: 0; font-weight: bold; letter-spacing: 1px;">QUESERÍA ARTESANAL ZAMPA</p>
            </div>
            <div style="text-align: right;">
              <h1 style="font-size: 26px; color: #8b7355; margin: 0 0 8px 0; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
                ${entitySaldo > 0 ? 'COMPROBANTE A PAGAR' : entitySaldo < 0 ? 'ESTADO DE CUENTA (A FAVOR)' : 'ESTADO DE CUENTA'}
              </h1>
              <p style="font-size: 14px; color: #444; margin: 0;"><strong>CLIENTE/PROV:</strong> ${entityName.toUpperCase()}</p>
              <p style="font-size: 12px; color: #888; margin: 5px 0 0 0;">Fecha Emisión: ${new Date().toLocaleDateString('es-AR')}</p>
            </div>
          </div>

          <!-- Outstanding Balance Huge Block -->
          <div style="background-color: ${entitySaldo > 0 ? '#f0fdf4' : entitySaldo < 0 ? '#fff1f2' : '#f9fafb'}; border: 1px solid ${entitySaldo > 0 ? '#bbf7d0' : entitySaldo < 0 ? '#fecdd3' : '#e5e7eb'}; padding: 25px 30px; border-radius: 12px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
            <div>
              <p style="font-size: 13px; font-weight: 700; color: #666; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">
                ${entitySaldo > 0 ? 'TOTAL A PAGAR (Saldo Pendiente)' : entitySaldo < 0 ? 'SALDO A FAVOR SUYO' : 'Cuenta Saldada ($0)'}
              </p>
              <p style="font-size: 12px; color: #888; margin: 0;">${entitySaldo > 0 ? 'Por favor, regularice su saldo pendiente a la brevedad.' : 'Sus pagos han superado o cubierto los cargos.'}</p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 32px; font-weight: 900; color: ${entitySaldo > 0 ? '#059669' : entitySaldo < 0 ? '#e11d48' : '#374151'};">
                ${formatCurrency(Math.abs(entitySaldo))}
              </span>
            </div>
          </div>

          <!-- Table of Details -->
          <h3 style="font-size: 14px; color: #333; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">DETALLE DE MOVIMIENTOS</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #fafafa; border-bottom: 2px solid #ddd;">
                <th style="padding: 12px 8px; font-weight: 700; color: #555;">FECHA</th>
                <th style="padding: 12px 8px; font-weight: 700; color: #555;">DETALLE / CONCEPTO</th>
                <th style="padding: 12px 8px; font-weight: 700; color: #555; text-align: right;">CARGOS ($)</th>
                <th style="padding: 12px 8px; font-weight: 700; color: #555; text-align: right;">PAGOS / ABONOS ($)</th>
              </tr>
            </thead>
            <tbody>
              ${history.map((h) => {
                 const cargo = parseCurrency(h.Ingresos);
                 const pago = parseCurrency(h.Egresos);
                 return `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 12px 8px; color: #555; white-space: nowrap;">${h.Fecha || '-'}</td>
                  <td style="padding: 12px 8px; color: #333;">
                    <strong>${h.Rubro || ''}</strong> ${h['Subrubro/Producto'] ? ` - ${h['Subrubro/Producto']}` : ''}
                    ${h.Observaciones ? `<br><span style="color: #888; font-size: 11px;">${h.Observaciones}</span>` : ''}
                  </td>
                  <td style="padding: 12px 8px; text-align: right; color: #333;">${cargo > 0 ? formatCurrency(cargo) : '-'}</td>
                  <td style="padding: 12px 8px; text-align: right; color: #333;">${pago > 0 ? formatCurrency(pago) : '-'}</td>
                </tr>
              `}).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #fafafa; border-top: 2px solid #ddd; border-bottom: 2px solid #ddd;">
                <td colspan="2" style="padding: 12px 8px; font-weight: bold; text-align: right; color: #555;">SUMA TOTAL:</td>
                <td style="padding: 12px 8px; font-weight: bold; text-align: right; color: #333;">
                  ${formatCurrency(history.reduce((acc, h) => acc + parseCurrency(h.Ingresos), 0))}
                </td>
                <td style="padding: 12px 8px; font-weight: bold; text-align: right; color: #333;">
                  ${formatCurrency(history.reduce((acc, h) => acc + parseCurrency(h.Egresos), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 60px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="margin: 0 0 5px 0;"><strong>DOCUMENTO INTERNO / NO VÁLIDO COMO FACTURA LEGAL</strong></p>
            <p style="margin: 0;">Quesería Artesanal Zampa - Comprobante generado automáticamente.</p>
          </div>
        </div>
      </div>
    `;

    // 3. Generate PDF
    const opt: any = {
      margin: 0,
      filename: `Estado_Cuenta_${entityName.replace(/\\s+/g, '_')}.pdf`,
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
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#8b7355] text-white rounded-xl text-xs md:text-sm hover:bg-[#7a6448] font-bold shadow-sm transition-colors"
        >
          <PlusCircle size={16} />
          <span>Registrar Cobro / Pago Parcial</span>
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
              {pendientes.filter(p => p.saldo < 0).length} proveedores con facturas pendientes
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
            className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'TODOS' ? 'bg-white text-[#3e3a35] shadow-xs' : 'text-[#6b645c] hover:text-[#2d2a26]'}`}
          >
            Todos ({pendientes.length})
          </button>
          <button
            onClick={() => setFilterType('CLIENTES')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'CLIENTES' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-[#6b645c] hover:text-[#2d2a26]'}`}
          >
            Clientes ({pendientes.filter(p => p.saldo > 0).length})
          </button>
          <button
            onClick={() => setFilterType('PROVEEDORES')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'PROVEEDORES' ? 'bg-white text-rose-800 shadow-xs font-bold' : 'text-[#6b645c] hover:text-[#2d2a26]'}`}
          >
            Proveedores ({pendientes.filter(p => p.saldo < 0).length})
          </button>
          <button
            onClick={() => setFilterType('SALDADOS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'SALDADOS' ? 'bg-white text-[#3e3a35] shadow-xs' : 'text-[#6b645c] hover:text-[#2d2a26]'}`}
          >
            Saldados ($0)
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
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right text-emerald-800">Nos deben (a cobrar)</th>
                <th className="px-4 py-3 text-right text-rose-800">Debemos (a pagar)</th>
                <th className="px-4 py-3 text-right font-bold">Saldo Pendiente</th>
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
                      
                      {/* Name */}
                      <td className="px-4 py-3.5 font-bold text-[#3e3a35]">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setExpandedEntity(isExpanded ? null : row.entity)}
                            className="p-1 text-[#6b645c] hover:text-[#3e3a35] hover:bg-[#e0d6c8]/50 rounded transition-colors"
                            title="Ver detalle de movimientos"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <span>{row.entity}</span>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          isCliente 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : isProveedor 
                            ? 'bg-rose-50 text-rose-800 border-rose-200' 
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {isCliente ? 'CLIENTE' : isProveedor ? 'PROVEEDOR' : 'AL DÍA'}
                        </span>
                      </td>

                      {/* A cobrar */}
                      <td className="px-4 py-3.5 text-right font-mono text-emerald-700 font-semibold">
                        {row.cobrar > 0 ? formatCurrency(row.cobrar) : '-'}
                      </td>

                      {/* A pagar */}
                      <td className="px-4 py-3.5 text-right font-mono text-rose-700 font-semibold">
                        {row.pagar > 0 ? formatCurrency(row.pagar) : '-'}
                      </td>

                      {/* Saldo */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-sm">
                        <span className={isCliente ? 'text-emerald-700' : isProveedor ? 'text-rose-700' : 'text-[#6b645c]'}>
                          {isCliente && '+ '}
                          {isProveedor && '- '}
                          {formatCurrency(Math.abs(row.saldo))}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          {!isSaldado && (
                            <button
                              onClick={() => handleOpenPayment(row.entity, isCliente)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1 ${
                                isCliente 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'bg-rose-600 hover:bg-rose-700 text-white'
                              }`}
                            >
                              <span>{isCliente ? 'Cobrar Deuda' : 'Pagar Deuda'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedEntity(isExpanded ? null : row.entity)}
                            className="px-2.5 py-1 text-xs border border-[#e0d6c8] text-[#6b645c] hover:bg-[#f4ebd8] rounded-lg font-semibold transition-colors flex items-center space-x-1"
                          >
                            <History size={13} />
                            <span>Historial</span>
                          </button>
                          <button
                            onClick={() => handleExportPDF(row.entity, row.saldo)}
                            className="px-2.5 py-1 text-xs border border-[#e0d6c8] text-[#8b7355] hover:bg-[#f4ebd8] rounded-lg font-semibold transition-colors flex items-center space-x-1"
                            title="Exportar a PDF"
                          >
                            <Download size={13} />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>

                    </tr>

                    {/* Expanded History Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#fcfbf9] border-b border-[#e0d6c8]">
                        <td colSpan={6} className="p-4 sm:p-6 space-y-3">
                          <div className="flex items-center justify-between border-b border-[#e0d6c8]/60 pb-2">
                            <h4 className="text-xs font-bold text-[#3e3a35] uppercase tracking-wider flex items-center space-x-1.5">
                              <History size={14} className="text-[#8b7355]" />
                              <span>Historial de Movimientos de Cuenta Corriente: {row.entity}</span>
                            </h4>
                            <span className="text-xs text-[#6b645c]">
                              {entityHistory.length} movimientos registrados
                            </span>
                          </div>

                          <div className="overflow-x-auto bg-white rounded-lg border border-[#e0d6c8]/60">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-[#f4ebd8]/40 border-b border-[#e0d6c8]/60 text-[#6b645c]">
                                <tr>
                                  <th className="px-3 py-2">Fecha</th>
                                  <th className="px-3 py-2">Cuenta</th>
                                  <th className="px-3 py-2">Rubro / Concepto</th>
                                  <th className="px-3 py-2 text-right">Ingreso ($)</th>
                                  <th className="px-3 py-2 text-right">Egreso ($)</th>
                                  <th className="px-3 py-2">Observaciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entityHistory.map((h, i) => (
                                  <tr key={h.id || i} className="border-b border-gray-100 hover:bg-[#faf7f2]">
                                    <td className="px-3 py-2 font-medium">{h.Fecha}</td>
                                    <td className="px-3 py-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        h.Cuenta?.toUpperCase() === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {h.Cuenta}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-[#3e3a35] font-medium">{h.Rubro} {h['Subrubro/Producto'] ? `(${h['Subrubro/Producto']})` : ''}</td>
                                    <td className="px-3 py-2 text-right font-mono text-emerald-700 font-medium">
                                      {parseCurrency(h.Ingresos) > 0 ? formatCurrency(parseCurrency(h.Ingresos)) : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-rose-700 font-medium">
                                      {parseCurrency(h.Egresos) > 0 ? formatCurrency(parseCurrency(h.Egresos)) : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-[#6b645c] max-w-[250px] truncate" title={h.Observaciones}>{h.Observaciones || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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

      {/* Partial / Full Payment Modal */}
      <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegister={onRegisterPayment}
        initialEntity={selectedEntityForModal || ''}
        initialType={modalType}
        pendingBalance={pendientes.find(p => p.entity.toLowerCase() === selectedEntityForModal?.toLowerCase())?.saldo || 0}
        availableEntities={pendientes.map(p => ({ name: p.entity, saldo: p.saldo }))}
      />

    </div>
  );
};

export default CuentasCorrientes;
