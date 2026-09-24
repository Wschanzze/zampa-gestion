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

export const calculatePendientes = (data: Transaction[]) => {
  const pendientes: Record<string, { cobrar: number; pagar: number; saldo: number }> = {};
  
  data.forEach(row => {
    if (row.Cuenta?.toUpperCase() === 'PENDIENTE') {
      const entity = row['Prov/Cliente'] || 'Sin proveedor especificado';
      const ingresos = parseCurrency(row.Ingresos);
      const egresos = parseCurrency(row.Egresos);
      
      if (!pendientes[entity]) {
        pendientes[entity] = { cobrar: 0, pagar: 0, saldo: 0 };
      }
      pendientes[entity].cobrar += ingresos;
      pendientes[entity].pagar += egresos;
      pendientes[entity].saldo = pendientes[entity].cobrar - pendientes[entity].pagar;
    }
  });

  return Object.entries(pendientes).map(([name, vals]) => ({
    entity: name,
    ...vals
  }));
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
