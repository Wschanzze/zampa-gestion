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
    }

    summary.TOTAL.ingresos += ingresos;
    summary.TOTAL.egresos += egresos;
    summary.TOTAL.resultado += (ingresos - egresos);
  });

  return summary;
};
