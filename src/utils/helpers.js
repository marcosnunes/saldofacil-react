export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function formatCurrency(amount, currency = 'BRL') {
  const options = { style: 'currency', currency: currency };
  return new Intl.NumberFormat('pt-BR', options).format(amount);
}

export const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const monthsPT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const monthsLowercase = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

export function getMonthName(index, lang = 'pt') {
  if (lang === 'pt') {
    return monthsPT[index];
  }
  return months[index];
}

export function getMonthIndex(monthName) {
  const lowerName = monthName.toLowerCase();
  const indexEN = monthsLowercase.indexOf(lowerName);
  if (indexEN !== -1) return indexEN;
  
  const indexPT = monthsPT.findIndex(m => m.toLowerCase() === lowerName);
  return indexPT;
}

export function parseOFX(ofxData) {
  const transactions = [];

  const lines = ofxData.split('\n');
  let currentTransaction = {};
  let isInsideTransaction = false;
  let currentFITID = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('<STMTTRN>') || line.startsWith('<STMTTRN')) {
      isInsideTransaction = true;
      currentTransaction = {};
      currentFITID = null;
    } else if (line.startsWith('</STMTTRN>') || line.startsWith('</STMTTRN')) {
      isInsideTransaction = false;
      if (Object.keys(currentTransaction).length > 0) {
        transactions.push(currentTransaction);
      }
    } else if (isInsideTransaction) {
      if (line.startsWith('<MEMO>')) {
        currentTransaction.description = line.replace(/<MEMO>/g, '').replace(/<\/MEMO>/g, '').trim();
      } else if (line.startsWith('<DTPOSTED>')) {
        const match = line.match(/<DTPOSTED>(\d{8})/);
        if (match) {
          currentTransaction.date = match[1].substring(6, 8);
        }
      } else if (line.startsWith('<TRNAMT>')) {
        const amountStr = line.replace(/<TRNAMT>/g, '').replace(/<\/TRNAMT>/g, '').trim();
        const amount = parseFloat(amountStr);
        currentTransaction.amount = amount.toFixed(2);

        if (amount > 0) {
          currentTransaction.credit = Math.abs(amount);
          currentTransaction.debit = 0;
        } else {
          currentTransaction.debit = Math.abs(amount);
          currentTransaction.credit = 0;
        }
      } else if (line.startsWith('<FITID>')) {
        currentFITID = line.replace(/<FITID>/g, '').replace(/<\/FITID>/g, '').trim();
        currentTransaction.FITID = currentFITID;
      }
    }
  }

  return transactions;
}

export function parseCreditCardOFX(ofxData) {
  const transactions = [];
  const monthsPT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Try to find invoice date
  const dtEndMatch = ofxData.match(/<DTEND>(\d{8})/) || ofxData.match(/<DTASOF>(\d{8})/);
  if (!dtEndMatch) {
    console.warn("Could not find invoice date in OFX");
    return [];
  }

  const invoiceDateStr = dtEndMatch[1];
  const invoiceYear = parseInt(invoiceDateStr.substring(0, 4), 10);
  const invoiceMonthIndex = parseInt(invoiceDateStr.substring(4, 6), 10) - 1;
  const invoiceMonthName = monthsPT[invoiceMonthIndex];

  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let transactionBlocks = ofxData.match(transactionRegex);

  if (!transactionBlocks) {
    return [];
  }

  for (let i = 0; i < transactionBlocks.length; i++) {
    const block = transactionBlocks[i];

    const typeMatch = block.match(/<TRNTYPE>(.*?)<\/TRNTYPE>/);
    if (typeMatch && typeMatch[1] !== 'DEBIT') {
      continue;
    }

    const amountMatch = block.match(/<TRNAMT>([-\d.]+)/);
    const fitidMatch = block.match(/<FITID>([\w.-]+)/);
    const memoMatch = block.match(/<MEMO>(.*?)<\/MEMO>/s);
    const postedDateMatch = block.match(/<DTPOSTED>(\d{8})/);

    if (amountMatch && fitidMatch && memoMatch) {
      const value = Math.abs(parseFloat(amountMatch[1]));
      const fitid = fitidMatch[1];
      let description = memoMatch[1].trim();

      if (postedDateMatch) {
        const dateStr = postedDateMatch[1];
        const day = dateStr.substring(6, 8);
        const month = dateStr.substring(4, 6);
        description = `${description} (${day}/${month})`;
      }

      transactions.push({
        month: invoiceMonthName,
        year: invoiceYear,
        description,
        value,
        fitid
      });
    }
  }

  return transactions;
}
