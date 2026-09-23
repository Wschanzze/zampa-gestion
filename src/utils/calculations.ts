export type Transaction = {
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
