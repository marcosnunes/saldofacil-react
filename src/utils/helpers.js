import { database } from '../config/firebase';
import { ref, get } from 'firebase/database';

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

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

export const fetchAndSaveDataForAI = async (userId, year) => {
  if (!userId || !year) {
    console.error("ID do usuário ou ano não fornecido para buscar dados para IA.");
    return;
  }

  try {
    const monthlyData = {};
    monthsPT.forEach(monthName => {
      monthlyData[monthName] = { creditos: [], debitos: [] };
    });

    // 1. Transações Mensais
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val();
    if (userData) {
      Object.keys(userData).forEach(key => {
        if (key.endsWith(`-${year}`)) {
          const monthName = monthsPT[monthsLowercase.indexOf(key.split('-')[0])];
          const monthTransactions = userData[key]?.transactions;
          if (monthTransactions && monthlyData[monthName]) {
            monthTransactions.forEach(t => {
              if (t.credit > 0) {
                monthlyData[monthName].creditos.push({
                  data: t.date,
                  descricao: t.description,
                  valor: parseFloat(t.credit)
                });
              }
              if (t.debit > 0) {
                monthlyData[monthName].debitos.push({
                  data: t.date,
                  descricao: t.description,
                  valor: parseFloat(t.debit)
                });
              }
            });
          }
        }
      });
    }

    // 2. Cartão de Crédito
    const ccRef = ref(database, `creditCardData/${userId}/${year}`);
    const ccSnapshot = await get(ccRef);
    const ccData = ccSnapshot.val();
    if (ccData) {
      Object.values(ccData).forEach(item => {
        const month = item.month;
        if (monthlyData[month]) {
          monthlyData[month].debitos.push({
            data: 'N/A',
            descricao: `Fatura Cartão: ${item.description}`,
            valor: parseFloat(item.value)
          });
        }
      });
    }

    // 3. Investimentos
    const invRef = ref(database, `investments/${userId}/${year}`);
    const invSnapshot = await get(invRef);
    const invData = invSnapshot.val();
    if (invData) {
      Object.values(invData).forEach(item => {
        const month = item.month;
        if (monthlyData[month]) {
          if (item.type === 'application') {
            monthlyData[month].debitos.push({
              data: item.date,
              descricao: `Investimento (Aplicação): ${item.description}`,
              valor: parseFloat(item.value)
            });
          } else if (item.type === 'redemption') {
            monthlyData[month].creditos.push({
              data: item.date,
              descricao: `Investimento (Resgate): ${item.description}`,
              valor: parseFloat(item.value)
            });
          }
        }
      });
    }

    // 4. Dízimos
    const titheRef = ref(database, `tithes/${userId}/${year}`);
    const titheSnapshot = await get(titheRef);
    const titheData = titheSnapshot.val();
    if (titheData) {
      Object.values(titheData).forEach(item => {
        const month = item.month;
        if (monthlyData[month]) {
          monthlyData[month].debitos.push({
            data: item.date,
            descricao: `Dízimo: ${item.description}`,
            valor: parseFloat(item.value)
          });
        }
      });
    }

    const localStorageKey = `report_data_${year}`;
    localStorage.setItem(localStorageKey, JSON.stringify(monthlyData));
    console.log(`Dados completos para IA do ano ${year} (RTDB) salvos no localStorage.`);

  } catch (error) {
    console.error("Erro ao buscar e salvar todos os dados para IA:", error);
  }
};
