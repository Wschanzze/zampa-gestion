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

export const calculateCashFlow = (data: Transaction[]) => {
  const months = new Set<string>();
  const rubrosIngreso = new Set<string>();
  const rubrosEgreso = new Set<string>();
  
  const matrix: Record<string, Record<string, number>> = {};
  
  data.forEach(row => {
    const dateParts = row.Fecha.split('/');
    if (dateParts.length !== 3) return; // ignore invalid dates
    const month = `${dateParts[1]}-${dateParts[2]}`; // MM-YYYY
    months.add(month);
    
    const ingresos = parseCurrency(row.Ingresos);
    const egresos = parseCurrency(row.Egresos);
    const rubro = row.Rubro || 'Sin Rubro';
    
    if (!matrix[rubro]) matrix[rubro] = {};
    if (!matrix[rubro][month]) matrix[rubro][month] = 0;
    
    if (ingresos > 0) {
      rubrosIngreso.add(rubro);
      matrix[rubro][month] += ingresos;
    }
    if (egresos > 0) {
      rubrosEgreso.add(rubro);
      matrix[rubro][month] += egresos;
    }
  });

  const sortedMonths = Array.from(months).sort((a, b) => {
    const [ma, ya] = a.split('-');
    const [mb, yb] = b.split('-');
    return (parseInt(ya) - parseInt(yb)) || (parseInt(ma) - parseInt(mb));
  });

  return { sortedMonths, rubrosIngreso: Array.from(rubrosIngreso), rubrosEgreso: Array.from(rubrosEgreso), matrix };
};
