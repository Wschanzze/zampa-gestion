export type Transaction = {
  id?: string;
  Fecha: string;
  "Prov/Cliente"?: string;
  Cuenta?: string;
  Ingresos?: string | number;
  Egresos?: string | number;
  Rubro?: string;
  Subactividad?: string;
  "Subrubro/Producto"?: string;
  Pecorino?: string | number;
  Manchego?: string | number;
  Saborizado?: string | number;
  Ahumado?: string | number;
  Provoleta?: string | number;
  Ricota?: string | number;
  Cantidades?: string | number;
  Observaciones?: string;
};

export const parseCurrency = (val: string | number | undefined): number => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const parsed = parseFloat(val.replace(/[$,]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

export const normalizeDecimal = (val: string): string => {
  if (!val) return '';
  // Convert commas to periods
  let cleaned = val.replace(/,/g, '.');
  // Allow only digits and periods
  cleaned = cleaned.replace(/[^0-9.]/g, '');
  // If starts with period, prepend 0
  if (cleaned === '.') return '0.';
  // Allow only a single period
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  return cleaned;
};

export const parseDecimalNumber = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const normalized = String(val).replace(/,/g, '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

export const calculateSummaryByUnit = (data: Transaction[]) => {
  const summary = {
    TAMBO: { ingresos: 0, egresos: 0, resultado: 0 },
    RECRIA: { ingresos: 0, egresos: 0, resultado: 0 },
    QUESERIA: { ingresos: 0, egresos: 0, resultado: 0 },
    COMUN: { ingresos: 0, egresos: 0, resultado: 0 },
    TOTAL: { ingresos: 0, egresos: 0, resultado: 0 },
  };

  data.forEach((row) => {
    const subactividad = row.Subactividad?.toUpperCase().trim() || "COMUN";
    const ingresos = parseCurrency(row.Ingresos);
    const egresos = parseCurrency(row.Egresos);

    if (summary[subactividad as keyof typeof summary]) {
      summary[subactividad as keyof typeof summary].ingresos += ingresos;
      summary[subactividad as keyof typeof summary].egresos += egresos;
      summary[subactividad as keyof typeof summary].resultado += (ingresos - egresos);
    } else {
      summary.COMUN.ingresos += ingresos;
      summary.COMUN.egresos += egresos;
      summary.COMUN.resultado += (ingresos - egresos);
    }

    summary.TOTAL.ingresos += ingresos;
    summary.TOTAL.egresos += egresos;
    summary.TOTAL.resultado += (ingresos - egresos);
  });

  return summary;
};

export type PendingAccount = {
  entity: string;
  cobrar: number;
  pagar: number;
  saldo: number;
  totalFacturadoCredito: number;
  totalCancelado: number;
  totalIngresos: number;
  totalEgresos: number;
  movimientosCount: number;
  tipo: 'CLIENTE' | 'PROVEEDOR' | 'AMBOS';
};

export const isTransactionPending = (row: Transaction): boolean => {
  if (row.Cuenta?.toUpperCase() === 'PENDIENTE') return true;
  if (
    row.Observaciones && 
    /pendiente/i.test(row.Observaciones) && 
    !/no\s+pendiente|saldad/i.test(row.Observaciones)
  ) {
    return true;
  }
  return false;
};

export const calculatePendientes = (data: Transaction[], additionalEntities?: string[]): PendingAccount[] => {
  const map: Record<string, {
    ventasCredito: number;
    cobros: number;
    comprasCredito: number;
    pagos: number;
    totalIngresos: number;
    totalEgresos: number;
    movimientosCount: number;
    hasVenta: boolean;
    hasCompra: boolean;
  }> = {};

  // Helper to detect internal technical mirror offset entries
  const isTechnicalMirror = (row: Transaction) => {
    const cuenta = (row.Cuenta || '').toUpperCase();
    const rubro = (row.Rubro || '').toUpperCase();
    const obs = (row.Observaciones || '').toLowerCase();
    return cuenta === 'PENDIENTE' && (
      rubro.includes('COBRO CUENTA CORRIENTE') ||
      rubro.includes('PAGO PROVEEDOR') ||
      obs.includes('aplicación de pago') ||
      obs.includes('aplicacion de pago')
    );
  };

  // 1. Process all transactions in data so that EVERY entity in Prov/Cliente is included
  data.forEach(row => {
    const rawEntity = row['Prov/Cliente']?.trim();
    if (!rawEntity) return;

    if (!map[rawEntity]) {
      map[rawEntity] = {
        ventasCredito: 0,
        cobros: 0,
        comprasCredito: 0,
        pagos: 0,
        totalIngresos: 0,
        totalEgresos: 0,
        movimientosCount: 0,
        hasVenta: false,
        hasCompra: false,
      };
    }

    const item = map[rawEntity];
    const cuenta = (row.Cuenta || '').toUpperCase();
    const rubro = (row.Rubro || '').toUpperCase();
    const ingresos = parseCurrency(row.Ingresos);
    const egresos = parseCurrency(row.Egresos);
    const isMirror = isTechnicalMirror(row);

    if (!isMirror) {
      item.movimientosCount += 1;
    }

    item.totalIngresos += ingresos;
    item.totalEgresos += egresos;

    if (ingresos > 0 || rubro.includes('VENTA')) item.hasVenta = true;
    if (
      egresos > 0 || 
      rubro.includes('COMPRA') || 
      rubro.includes('GASTO') || 
      rubro.includes('PAGO') || 
      rubro.includes('ALIMENTACION') || 
      rubro.includes('SANIDAD') || 
      rubro.includes('EQUIPAMIENTO')
    ) {
      item.hasCompra = true;
    }

    // Direct payment / collection recognition
    if (rubro.includes('COBRO CUENTA CORRIENTE')) {
      if (cuenta !== 'PENDIENTE' && ingresos > 0) {
        item.cobros += ingresos;
      }
    } else if (rubro.includes('PAGO PROVEEDOR')) {
      if (cuenta !== 'PENDIENTE' && egresos > 0) {
        item.pagos += egresos;
      }
    } else {
      // Normal transaction
      if (isTransactionPending(row) && !isMirror) {
        if (ingresos > 0) item.ventasCredito += ingresos;
        if (egresos > 0) item.comprasCredito += egresos;
      }
    }
  });

  // 2. Also register any additional entities if provided (e.g. from zampa_entidades)
  if (additionalEntities) {
    additionalEntities.forEach(rawName => {
      const name = rawName?.trim();
      if (name && !map[name]) {
        map[name] = {
          ventasCredito: 0,
          cobros: 0,
          comprasCredito: 0,
          pagos: 0,
          totalIngresos: 0,
          totalEgresos: 0,
          movimientosCount: 0,
          hasVenta: false,
          hasCompra: false,
        };
      }
    });
  }

  // 3. Format and sort
  const results: PendingAccount[] = Object.entries(map).map(([name, vals]) => {
    const saldoCliente = vals.ventasCredito - vals.cobros;
    const saldoProveedor = vals.comprasCredito - vals.pagos;

    let tipo: 'CLIENTE' | 'PROVEEDOR' | 'AMBOS' = 'CLIENTE';
    if (vals.hasVenta && vals.hasCompra) {
      tipo = 'AMBOS';
    } else if (vals.hasCompra || vals.totalEgresos > 0) {
      tipo = 'PROVEEDOR';
    } else {
      tipo = 'CLIENTE';
    }

    let saldo = 0;
    let cobrar = 0;
    let pagar = 0;
    let totalFacturadoCredito = 0;
    let totalCancelado = 0;

    if (tipo === 'CLIENTE') {
      saldo = parseFloat(saldoCliente.toFixed(2));
      cobrar = saldo > 0 ? saldo : 0;
      pagar = saldo < 0 ? Math.abs(saldo) : 0;
      totalFacturadoCredito = parseFloat(vals.ventasCredito.toFixed(2));
      totalCancelado = parseFloat(vals.cobros.toFixed(2));
    } else if (tipo === 'PROVEEDOR') {
      saldo = parseFloat((-saldoProveedor).toFixed(2));
      pagar = saldoProveedor > 0 ? parseFloat(saldoProveedor.toFixed(2)) : 0;
      cobrar = saldoProveedor < 0 ? parseFloat(Math.abs(saldoProveedor).toFixed(2)) : 0;
      totalFacturadoCredito = parseFloat(vals.comprasCredito.toFixed(2));
      totalCancelado = parseFloat(vals.pagos.toFixed(2));
    } else {
      saldo = parseFloat((saldoCliente - saldoProveedor).toFixed(2));
      cobrar = saldo > 0 ? saldo : 0;
      pagar = saldo < 0 ? Math.abs(saldo) : 0;
      totalFacturadoCredito = parseFloat((vals.ventasCredito + vals.comprasCredito).toFixed(2));
      totalCancelado = parseFloat((vals.cobros + vals.pagos).toFixed(2));
    }

    if (Object.is(saldo, -0)) saldo = 0;

    return {
      entity: name,
      cobrar,
      pagar,
      saldo,
      totalFacturadoCredito,
      totalCancelado,
      totalIngresos: parseFloat(vals.totalIngresos.toFixed(2)),
      totalEgresos: parseFloat(vals.totalEgresos.toFixed(2)),
      movimientosCount: vals.movimientosCount,
      tipo,
    };
  });

  // Sort: active pending balances first (by magnitude), then entities with activity, then zero balance alphabetically
  return results.sort((a, b) => {
    const absA = Math.abs(a.saldo);
    const absB = Math.abs(b.saldo);
    if (absA !== absB) {
      return absB - absA;
    }
    const actA = a.totalFacturadoCredito + a.totalCancelado;
    const actB = b.totalFacturadoCredito + b.totalCancelado;
    if (actA !== actB) {
      return actB - actA;
    }
    return a.entity.localeCompare(b.entity, 'es', { sensitivity: 'base' });
  });
};

export type StatementLine = {
  id: string;
  fecha: string;
  concepto: string;
  subrubro?: string;
  cuenta?: string;
  observaciones?: string;
  cargo: number;
  abono: number;
  saldo: number;
  esContado?: boolean;
};

// Robust date parser for es-AR "D/M/YYYY" or ISO formats
export const parseFechaToTime = (fechaStr?: string): number => {
  if (!fechaStr) return 0;
  if (fechaStr.includes('/')) {
    const parts = fechaStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10) || 0;
      const month = (parseInt(parts[1], 10) || 1) - 1;
      const year = parseInt(parts[2], 10) || 0;
      return new Date(year, month, day).getTime();
    }
  }
  const t = new Date(fechaStr).getTime();
  return isNaN(t) ? 0 : t;
};

export const buildEntityStatement = (
  entityName: string,
  entityTipo: 'CLIENTE' | 'PROVEEDOR' | 'AMBOS',
  allTransactions: Transaction[]
): StatementLine[] => {
  const isCliente = entityTipo === 'CLIENTE' || entityTipo === 'AMBOS';

  // 1. Filtrar transacciones de esta entidad excluyendo asientos técnicos espejo
  const rows = allTransactions
    .filter(d => d['Prov/Cliente']?.toLowerCase().trim() === entityName.toLowerCase().trim())
    .filter(r => {
      const cuenta = (r.Cuenta || '').toUpperCase();
      const rubro = (r.Rubro || '').toUpperCase();
      const obs = (r.Observaciones || '').toLowerCase();
      const isMirror = cuenta === 'PENDIENTE' && (
        rubro.includes('COBRO CUENTA CORRIENTE') ||
        rubro.includes('PAGO PROVEEDOR') ||
        obs.includes('aplicación de pago') ||
        obs.includes('aplicacion de pago')
      );
      return !isMirror;
    })
    .sort((a, b) => parseFechaToTime(a.Fecha) - parseFechaToTime(b.Fecha));

  let runningSaldo = 0;
  const lines: StatementLine[] = [];

  rows.forEach((r, idx) => {
    const ing = parseCurrency(r.Ingresos);
    const eg = parseCurrency(r.Egresos);
    const rubro = (r.Rubro || '').toUpperCase();

    let cargo = 0;
    let abono = 0;
    let concepto = r.Rubro || 'Movimiento';
    let esContado = false;

    if (isCliente) {
      if (rubro.includes('COBRO CUENTA CORRIENTE')) {
        abono = ing > 0 ? ing : eg;
        runningSaldo -= abono;
        concepto = 'Cobro recibido / Pago a cuenta';
      } else if (isTransactionPending(r)) {
        cargo = ing > 0 ? ing : eg;
        runningSaldo += cargo;
        concepto = r.Rubro ? `${r.Rubro} (A Crédito)` : 'Venta a Crédito';
      } else {
        esContado = true;
        cargo = 0;
        abono = 0;
        concepto = r.Rubro ? `${r.Rubro} (Contado)` : 'Venta de Contado';
      }
    } else {
      if (rubro.includes('PAGO PROVEEDOR')) {
        abono = eg > 0 ? eg : ing;
        runningSaldo -= abono;
        concepto = 'Pago emitido a proveedor';
      } else if (isTransactionPending(r)) {
        cargo = eg > 0 ? eg : ing;
        runningSaldo += cargo;
        concepto = r.Rubro ? `${r.Rubro} (A Crédito)` : 'Factura / Compra a Crédito';
      } else {
        esContado = true;
        cargo = 0;
        abono = 0;
        concepto = r.Rubro ? `${r.Rubro} (Contado)` : 'Gasto de Contado';
      }
    }

    lines.push({
      id: r.id || `${r.Fecha}-${idx}`,
      fecha: r.Fecha,
      concepto,
      subrubro: r['Subrubro/Producto'] || undefined,
      cuenta: r.Cuenta,
      observaciones: r.Observaciones,
      cargo,
      abono,
      saldo: parseFloat(runningSaldo.toFixed(2)),
      esContado,
    });
  });

  return lines;
};

export const getAvailableYears = (data: Transaction[]) => {
  const years = new Set<string>();
  data.forEach(row => {
    const parts = row.Fecha?.split('/');
    if (parts && parts.length === 3 && parts[2]) {
      years.add(parts[2].trim());
    }
  });
  if (years.size === 0) {
    years.add(new Date().getFullYear().toString());
  }
  return Array.from(years).sort().reverse();
};

export const calculateCashFlow = (data: Transaction[], selectedYear?: string) => {
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  const rubrosIngreso = new Set<string>();
  const rubrosEgreso = new Set<string>();
  
  // Matrix format: matrix[rubro][monthName] = amount
  const matrix: Record<string, Record<string, number>> = {};
  
  data.forEach(row => {
    if (!row.Fecha) return;
    const dateParts = row.Fecha.split('/');
    if (dateParts.length !== 3) return; // ignore invalid dates
    
    const rowYear = dateParts[2].trim();
    if (selectedYear && rowYear !== selectedYear) return;

    const monthIndex = parseInt(dateParts[1], 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) return;
    
    const monthName = monthNames[monthIndex];
    
    const ingresos = parseCurrency(row.Ingresos);
    const egresos = parseCurrency(row.Egresos);
    const rubro = row.Rubro || 'Sin Rubro';
    
    if (!matrix[rubro]) {
      matrix[rubro] = {};
      monthNames.forEach(m => matrix[rubro][m] = 0);
    }
    
    if (ingresos > 0) {
      rubrosIngreso.add(rubro);
      matrix[rubro][monthName] += ingresos;
    }
    if (egresos > 0) {
      rubrosEgreso.add(rubro);
      matrix[rubro][monthName] += egresos;
    }
  });

  // Calculate monthly net and accumulated balance
  let accum = 0;
  const saldoMensual: Record<string, number> = {};
  const saldoAcumulado: Record<string, number> = {};

  monthNames.forEach(m => {
    const ing = Array.from(rubrosIngreso).reduce((acc, r) => acc + (matrix[r]?.[m] || 0), 0);
    const egr = Array.from(rubrosEgreso).reduce((acc, r) => acc + (matrix[r]?.[m] || 0), 0);
    const net = ing - egr;
    saldoMensual[m] = net;
    accum += net;
    saldoAcumulado[m] = accum;
  });

  return { 
    sortedMonths: monthNames, 
    rubrosIngreso: Array.from(rubrosIngreso), 
    rubrosEgreso: Array.from(rubrosEgreso), 
    matrix,
    saldoMensual,
    saldoAcumulado
  };
};

export const calculateCheeseSales = (data: Transaction[], selectedYear?: string) => {
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const variedades = ['Pecorino', 'Manchego', 'Saborizado', 'Ahumado', 'Provoleta', 'Ricota'] as const;

  const monthlyData: Record<string, {
    mes: string;
    Pecorino: number;
    Manchego: number;
    Saborizado: number;
    Ahumado: number;
    Provoleta: number;
    Ricota: number;
    totalKg: number;
    ingresos: number;
  }> = {};

  monthNames.forEach(m => {
    monthlyData[m] = {
      mes: m,
      Pecorino: 0,
      Manchego: 0,
      Saborizado: 0,
      Ahumado: 0,
      Provoleta: 0,
      Ricota: 0,
      totalKg: 0,
      ingresos: 0
    };
  });

  const totals = {
    Pecorino: 0,
    Manchego: 0,
    Saborizado: 0,
    Ahumado: 0,
    Provoleta: 0,
    Ricota: 0,
    totalKg: 0,
    ingresos: 0
  };

  data.forEach(row => {
    if (!row.Fecha) return;
    const parts = row.Fecha.split('/');
    if (parts.length !== 3) return;
    const rowYear = parts[2].trim();
    if (selectedYear && rowYear !== selectedYear) return;

    const mIdx = parseInt(parts[1], 10) - 1;
    if (mIdx < 0 || mIdx > 11) return;
    const m = monthNames[mIdx];

    const p = Number(row.Pecorino) || 0;
    const man = Number(row.Manchego) || 0;
    const s = Number(row.Saborizado) || 0;
    const a = Number(row.Ahumado) || 0;
    const pr = Number(row.Provoleta) || 0;
    const r = Number(row.Ricota) || 0;
    const cheeseKg = p + man + s + a + pr + r;

    const isQueso = row.Subactividad?.toUpperCase() === 'QUESERIA' || row.Rubro?.toUpperCase().includes('QUESO') || cheeseKg > 0;
    if (!isQueso) return;

    monthlyData[m].Pecorino += p;
    monthlyData[m].Manchego += man;
    monthlyData[m].Saborizado += s;
    monthlyData[m].Ahumado += a;
    monthlyData[m].Provoleta += pr;
    monthlyData[m].Ricota += r;
    const rowKg = cheeseKg > 0 ? cheeseKg : (Number(row.Cantidades) || 0);
    monthlyData[m].totalKg += rowKg;
    monthlyData[m].ingresos += parseCurrency(row.Ingresos);

    totals.Pecorino += p;
    totals.Manchego += man;
    totals.Saborizado += s;
    totals.Ahumado += a;
    totals.Provoleta += pr;
    totals.Ricota += r;
    totals.totalKg += rowKg;
    totals.ingresos += parseCurrency(row.Ingresos);
  });

  const chartData = monthNames.map(m => ({
    ...monthlyData[m],
    Pecorino: parseFloat(monthlyData[m].Pecorino.toFixed(2)),
    Manchego: parseFloat(monthlyData[m].Manchego.toFixed(2)),
    Saborizado: parseFloat(monthlyData[m].Saborizado.toFixed(2)),
    Ahumado: parseFloat(monthlyData[m].Ahumado.toFixed(2)),
    Provoleta: parseFloat(monthlyData[m].Provoleta.toFixed(2)),
    Ricota: parseFloat(monthlyData[m].Ricota.toFixed(2)),
    totalKg: parseFloat(monthlyData[m].totalKg.toFixed(2)),
  }));

  return {
    monthNames,
    variedades,
    monthlyData,
    chartData,
    totals: {
      Pecorino: parseFloat(totals.Pecorino.toFixed(2)),
      Manchego: parseFloat(totals.Manchego.toFixed(2)),
      Saborizado: parseFloat(totals.Saborizado.toFixed(2)),
      Ahumado: parseFloat(totals.Ahumado.toFixed(2)),
      Provoleta: parseFloat(totals.Provoleta.toFixed(2)),
      Ricota: parseFloat(totals.Ricota.toFixed(2)),
      totalKg: parseFloat(totals.totalKg.toFixed(2)),
      ingresos: totals.ingresos
    }
  };
};
