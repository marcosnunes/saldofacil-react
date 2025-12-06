import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

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
export const exportElementAsPDF = (elementId, fileName, orientation = 'p') => {
  // Se não estiver no app Android, use o window.print() para desktop
  if (!isAndroidApp()) {
    window.print();
    return;
  }

  // Lógica de geração de PDF via html2canvas apenas para o app Android
  return new Promise(async (resolve, reject) => {
    const input = document.getElementById(elementId);
    if (!input) {
      console.error(`Element with id "${elementId}" not found.`);
      alert(`Erro: Não foi possível encontrar o conteúdo para exportar.`);
      return reject(new Error(`Element with id "${elementId}" not found.`));
    }

    const elementsToHide = document.querySelectorAll('.no-print');
    elementsToHide.forEach(el => el.style.setProperty('display', 'none', 'important'));

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      let width = pdfWidth;
      let height = width / ratio;

      if (height > pdfHeight) {
        height = pdfHeight;
        width = height * ratio;
      }
      
      let position = 0;
      let heightLeft = imgHeight * (pdfWidth / imgWidth);

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, heightLeft);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - (imgHeight * (pdfWidth / imgWidth));
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, (imgHeight * (pdfWidth / imgWidth)));
        heightLeft -= pdfHeight;
      }

      const pdfOutput = pdf.output('blob');
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

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
      reject(error);
    } finally {
      elementsToHide.forEach(el => el.style.display = '');
    }
  });
};


/**
 * Exports an array of data to an Excel file.
 * @param {Array<Object>} data - The array of data to export.
 * @param {string} fileName - The desired name for the output Excel file.
 * @param {string} sheetName - The name for the worksheet.
 */
export const exportDataAsExcel = (data, fileName, sheetName = 'Dados') => {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate base64 string
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

    downloadFile(wbout, `${fileName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  } catch (error) {
    console.error("Error generating Excel file:", error);
    alert("Ocorreu um erro ao gerar o arquivo Excel. Tente novamente.");
  }
};
