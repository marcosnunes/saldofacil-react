const ExcelJS = require('exceljs');

(async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('Arquivo_Modelo/Folha de Pagamento 2027.xlsx');

  for (const name of ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']) {
    const sheet = workbook.getWorksheet(name);
    const rows = [4, 8, 9, 15, 16, 20, 29, 30, 35, 44, 46];
    console.log(`\n[${name}]`);
    for (const rowNo of rows) {
      const cellB = sheet.getCell(`B${rowNo}`);
      const cellC = sheet.getCell(`C${rowNo}`);
      const serialize = (cell) => {
        const value = cell.value;
        if (value && typeof value === 'object' && value.formula) {
          return `FORMULA:${value.formula} => ${value.result}`;
        }
        return value;
      };
      console.log(`B${rowNo}=${serialize(cellB)} | C${rowNo}=${serialize(cellC)}`);
    }
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
