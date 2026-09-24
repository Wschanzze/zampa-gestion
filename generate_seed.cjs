const xlsx = require('xlsx');
const fs = require('fs');

const filePath = 'C:/Users/JoshuaGonzalez/Desktop/backup/Documents/Joshua/Zampa-excel/PRODUCCION 26 27 (Respuestas).xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet, { raw: false });

// Filter out rows without a LOTE
const validData = data.filter(r => r['LOTE']);

let sql = `INSERT INTO public.zampa_produccion_quesos (
  fecha_elaboracion,
  lote,
  litros_leche,
  producto,
  tipo_queso,
  kg_totales,
  cantidad_grande,
  cantidad_barra,
  cantidad_tubo,
  cantidad_chico,
  cantidad_otro,
  cantidad_camambert,
  cantidad_ricota
) VALUES\n`;

const values = validData.map((row, index) => {
  let rawDate = row['FECHA DE ELABORACION'] || row['Marca temporal'] || '';
  let dateObj = new Date();
  if (rawDate) {
    dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) {
      const parts = rawDate.split(' ')[0].split('/');
      if (parts.length === 3) {
        let y = parseInt(parts[2]);
        if (y < 100) y += 2000;
        let m = parseInt(parts[0]);
        let d = parseInt(parts[1]);
        if (m > 12) {
          m = parseInt(parts[1]);
          d = parseInt(parts[0]);
        }
        dateObj = new Date(y, m - 1, d);
      }
    }
  }
  const isoDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const litros = parseFloat(row['LITROS DE LECHE']) || 0;
  const producto = row['PRODUCTO'] ? `'${row['PRODUCTO'].replace(/'/g, "''")}'` : "'SEMIDURO'";
  
  let tipoQueso = row['TIPO DE QUESO DURO'] || row['TIPO DE QUESO SEMIDURO'] || row['TIPO DE QUESO BLANDO'] || '';
  tipoQueso = tipoQueso ? `'${tipoQueso.replace(/'/g, "''")}'` : 'NULL';

  const kgTotales = parseFloat(row['KG TOTALES']) || 0;
  const lote = row['LOTE'] ? `'${row['LOTE']}'` : `'${index + 1}'`;

  const qGrande = parseInt(row['GRANDE']) || 0;
  const qBarra = parseInt(row['BARRA']) || 0;
  const qTubo = parseInt(row['TUBO']) || 0;
  const qChico = parseInt(row['CHICO']) || 0;
  const qOtro = parseInt(row['OTRO']) || 0;
  const qCamembert = parseInt(row['CAMAMBERT']) || 0;
  const qRicota = parseInt(row['RICOTA']) || 0;

  return `('${isoDate}', ${lote}, ${litros}, ${producto}, ${tipoQueso}, ${kgTotales}, ${qGrande}, ${qBarra}, ${qTubo}, ${qChico}, ${qOtro}, ${qCamembert}, ${qRicota})`;
});

sql += values.join(',\n') + ';';

fs.writeFileSync('C:/Users/JoshuaGonzalez/Desktop/backup/Documents/Joshua/Zampa-excel/tambo-app/zampa_seed_produccion.sql', sql, 'utf8');
console.log('Done generating zampa_seed_produccion.sql with ' + validData.length + ' rows.');
