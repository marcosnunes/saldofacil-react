const ExcelJS = require('exceljs');

(async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('Arquivo_Modelo/Folha de Pagamento 2027.xlsx');

  console.log('Sheets:', workbook.worksheets.map((sheet) => sheet.name).join(' | '));

  for (const sheet of workbook.worksheets) {
    console.log(`\n[${sheet.name}] rows=${sheet.rowCount} cols=${sheet.columnCount}`);

    const maxRows = Math.min(sheet.rowCount, 120);
    const maxCols = Math.min(sheet.columnCount, 20);

    for (let rowNumber = 1; rowNumber <= maxRows; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const values = [];

      for (let colNumber = 1; colNumber <= maxCols; colNumber += 1) {
        const cell = row.getCell(colNumber);
        let value = cell.value;

        if (value && typeof value === 'object' && value.formula) {
          value = `FORMULA:${value.formula} => ${value.result}`;
        } else if (value && typeof value === 'object' && value.richText) {
          value = value.richText.map((part) => part.text).join('');
        } else if (value && typeof value === 'object' && value.text) {
          value = value.text;
        }

        if (value !== null && value !== undefined && value !== '') {
          const colLabel = ExcelJS.Workbook.xlsx ? '' : '';
          values.push(`${sheet.getColumn(colNumber).letter}${rowNumber}=${value}`);
        }
      }

      if (values.length > 0) {
        console.log(values.join(' | '));
      }
    }
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
