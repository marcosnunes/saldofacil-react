import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';

/**
 * Detects if the app is running inside the Android WebView.
 * @returns {boolean} True if running in the Android app.
 */
const isAndroidApp = () => {
  return typeof window.android !== 'undefined' && typeof window.android.downloadFile === 'function';
};

/**
 * Triggers a file download, either through the Android interface or standard browser download.  
 * @param {string} base64Data - The base64 encoded file data.
 * @param {string} fileName - The name of the file to be saved.
 * @param {string} mimeType - The MIME type of the file.
 */
const downloadFile = (base64Data, fileName, mimeType) => {
  if (isAndroidApp()) {
    // If in Android app, use the JavascriptInterface
    window.android.downloadFile(base64Data, fileName, mimeType);
  } else {
    // Otherwise, use standard browser download
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Exports a specific HTML element to a PDF file.
 * @param {string} elementId - The ID of the HTML element to export.
 * @param {string} fileName - The desired name for the output PDF file.
 * @param {string} [orientation='p'] - The orientation of the PDF ('p' for portrait, 'l' for landscape).
 */
export const exportElementAsPDF = async (elementId, fileName, orientation = 'p') => {
  // Se não estiver no app Android, use o window.print() para desktop
  if (!isAndroidApp()) {
    window.print();
    return;
  }

  // Lógica de geração de PDF via html2canvas apenas para o app Android
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id "${elementId}" not found.`);
    alert(`Erro: Não foi possível encontrar o conteúdo para exportar.`);
    throw new Error(`Element with id "${elementId}" not found.`);
  }

  // Auto-detect landscape for charts pages
  if (elementId === 'charts-page' && orientation === 'p') {
    orientation = 'l'; // Use landscape for charts
  }

  const elementsToHide = document.querySelectorAll('.no-print');
  elementsToHide.forEach(el => el.style.setProperty('display', 'none', 'important'));

  // Wait for Recharts SVG elements to fully render
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const canvas = await html2canvas(input, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      foreignObjectRendering: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 3; // Minimal margins for maximum content
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    // Calculate width to fit content width (landscape)
    let width = contentWidth;
    let height = width / ratio;
    
    // If height is too large, scale to fit height instead
    if (height > contentHeight) {
      height = contentHeight;
      width = height * ratio;
    }
    
    let position = margin;
    
    // Add first image
    pdf.addImage(imgData, 'PNG', margin, position, width, height);
    
    let remainingHeight = height - contentHeight;
    
    // Add subsequent pages if needed
    while (remainingHeight > 0) {
      pdf.addPage();
      position = -remainingHeight + margin;
      pdf.addImage(imgData, 'PNG', margin, position, width, height);
      remainingHeight -= contentHeight;
    }

    const pdfOutput = pdf.output('blob');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(pdfOutput);
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        downloadFile(base64data, `${fileName}.pdf`, 'application/pdf');
        resolve();
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(error);
      };
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    throw error;
  } finally {
    elementsToHide.forEach(el => el.style.display = '');
  }
};


/**
 * Exports an array of data to an Excel file.
 * @param {Array<Object>} data - The array of data to export.
 * @param {string} fileName - The desired name for the output Excel file.
 * @param {string} sheetName - The name for the worksheet.
 */
export const exportDataAsExcel = async (data, fileName, sheetName = 'Dados') => {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Adiciona cabeçalhos e dados
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.columns = headers.map(header => ({
        header: header,
        key: header,
        width: 15
      }));

      data.forEach(row => {
        worksheet.addRow(row);
      });
    }

    // Gera buffer e converte para base64
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = buffer.toString('base64');

    downloadFile(base64, `${fileName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  } catch (error) {
    console.error("Error generating Excel file:", error);
    alert("Ocorreu um erro ao gerar o arquivo Excel. Tente novamente.");
  }
};

/**
 * Exports all months of a year to a single Excel file with separate sheets.
 * @param {object} database - Firebase database instance.
 * @param {string} userId - The user ID.
 * @param {number} selectedYear - The selected year.
 * @param {Array<string>} monthsLowercase - Array of month names in lowercase.
 * @param {Array<string>} monthsPT - Array of month names in Portuguese.
 */
export const exportYearAsExcel = async (database, userId, selectedYear, monthsLowercase, monthsPT) => {
  try {
    const { ref, get } = await import('firebase/database');
    const workbook = new ExcelJS.Workbook();
    let hasData = false;

    for (let i = 0; i < 12; i++) {
      const monthKey = monthsLowercase[i];
      const monthName = monthsPT[i];

      const monthRef = ref(database, `users/${userId}/${selectedYear}/${monthKey}`);
      const snapshot = await get(monthRef);
      const monthData = snapshot.val();

      if (!monthData || !monthData.transactions) {
        continue;
      }

      hasData = true;
      const transactions = Object.values(monthData.transactions);

      // Calcular saldo parcial
      let runningBalance = Number(monthData.initialBalance) || 0;
      const transactionsWithBalance = transactions.map(t => {
        if (t.credit) runningBalance += Number(t.credit);
        if (t.debit) runningBalance -= Number(t.debit);
        return {
          Dia: t.day,
          Descrição: t.description,
          Crédito: t.credit || 0,
          Débito: t.debit || 0,
          'Saldo Parcial': runningBalance.toFixed(2)
        };
      });

      // Adicionar resumo
      transactionsWithBalance.push({});
      transactionsWithBalance.push({ Descrição: 'Resumo do Mês' });
      transactionsWithBalance.push({ Descrição: 'Saldo Inicial', Crédito: monthData.initialBalance || 0 });
      transactionsWithBalance.push({ Descrição: 'Total Crédito', Crédito: monthData.totalCredit || 0 });
      transactionsWithBalance.push({ Descrição: 'Total Débito', Crédito: monthData.totalDebit || 0 });
      transactionsWithBalance.push({ Descrição: 'Balanço', Crédito: monthData.balance || 0 });
      transactionsWithBalance.push({ Descrição: 'Saldo Final', Crédito: monthData.finalBalance || 0 });

      const worksheet = workbook.addWorksheet(monthName);
      
      if (transactionsWithBalance.length > 0) {
        const headers = Object.keys(transactionsWithBalance[0]).filter(key => transactionsWithBalance[0][key] !== undefined);
        worksheet.columns = headers.map(header => ({
          header: header,
          key: header,
          width: 15
        }));

        transactionsWithBalance.forEach(row => {
          worksheet.addRow(row);
        });
      }
    }

    if (!hasData) {
      alert("Não há dados para exportar neste ano.");
      return;
    }

    // Gera buffer e converte para base64
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = buffer.toString('base64');

    downloadFile(base64, `relatorio-completo-${selectedYear}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  } catch (error) {
    console.error("Error generating yearly Excel file:", error);
    alert("Ocorreu um erro ao gerar o arquivo Excel do ano. Tente novamente.");
  }
};