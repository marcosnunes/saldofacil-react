import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';

/** Meses (PT) e chaves em inglês lowercase usadas nas keys do RTDB */
export const monthsPT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const monthsLowercase = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

export function getMonthName(index, lang = 'pt') {
  if (lang === 'pt') {
    return monthsPT[index];
  }
  return monthsLowercase[index];
}

export function getMonthIndex(monthName) {
  const lowerName = monthName.toLowerCase();
  const indexEN = monthsLowercase.indexOf(lowerName);
  if (indexEN !== -1) return indexEN;

  const indexPT = monthsPT.findIndex(m => m.toLowerCase() === lowerName);
  return indexPT;
}

export function formatCurrency(value, currency = 'BRL') {
  const num = Number(value) || 0;
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(num);
  } catch {
    // Fallback simples
    return `R$ ${num.toFixed(2)}`;
  }
}

export function uuidv4() {
  // Simple UUID v4 generator (sufficient for client-side ids)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Parse de OFX simples para extrair transações (mantido do original) */
export function parseOFX(ofxData) {
  const transactions = [];
  const lines = ofxData.split(/<STMTTRN>/);

  for (let i = 1; i < lines.length; i++) {
    const transactionData = lines[i];
    const transaction = {};

    const typeMatch = transactionData.match(/<TRNTYPE>([^<]+)/);
    const dateMatch = transactionData.match(/<DTPOSTED>(\d{8})/);
    const amountMatch = transactionData.match(/<TRNAMT>([-\d,.]*)/);
    const fitidMatch = transactionData.match(/<FITID>([^<]+)/);
    const memoMatch = transactionData.match(/<MEMO>([^<]+)/);

    if (dateMatch) transaction.date = dateMatch[1].substring(6, 8);
    if (memoMatch) transaction.description = memoMatch[1].trim();
    if (fitidMatch) transaction.FITID = fitidMatch[1].trim();

    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(',', '.'));
      if (typeMatch && typeMatch[1].toUpperCase() === 'CREDIT') {
        transaction.credit = Math.abs(amount);
        transaction.debit = 0;
      } else {
        transaction.debit = Math.abs(amount);
        transaction.credit = 0;
      }
    }

    if (transaction.date && transaction.description && (transaction.credit !== undefined || transaction.debit !== undefined)) {
      transactions.push(transaction);
    }
  }

  return transactions;
}

export function parseCreditCardOFX(ofxData) {
  const transactions = [];
  const monthsPTLocal = [
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
  const invoiceMonthName = monthsPTLocal[invoiceMonthIndex];

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

/**
 * fetchAndSaveDataForAI
 * - Busca dados relevantes do Realtime Database para o usuário e ano
 * - Monta objeto com raw (mensal) e summary (resumo) e salva no localStorage em report_data_${year}
 * - Retorna o payload (ou null em caso de erro)
 */
export const fetchAndSaveDataForAI = async (userId, year) => {
  if (!userId || !year) {
    console.error("ID do usuário ou ano não fornecido para buscar dados para IA.");
    return null;
  }

  try {
    // Estrutura inicial: meses com listas de creditos/debitos
    const monthlyData = {};
    monthsPT.forEach(monthName => {
      monthlyData[monthName] = { creditos: [], debitos: [] };
    });

    // 1) Transações mensais (nó users/{uid} com chaves month-year)
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val() || {};

    // percorre chaves como 'january-2024', 'february-2024', etc.
    Object.keys(userData).forEach(key => {
      if (!key.endsWith(`-${year}`)) return;
      const monthKey = key.replace(`-${year}`, '');
      const monthIndex = monthsLowercase.indexOf(monthKey);
      const monthPT = monthIndex >= 0 ? monthsPT[monthIndex] : key;

      const monthObj = userData[key] || {};
      // transactions pode ser objeto de ids -> valores
      const transactions = monthObj.transactions ? Object.values(monthObj.transactions) : [];
      transactions.forEach(tx => {
        const amountCredit = parseFloat(tx.credit) || 0;
        const amountDebit = parseFloat(tx.debit) || 0;
        if (amountCredit > 0) {
          monthlyData[monthPT].creditos.push({
            descricao: tx.description || tx.desc || '',
            valor: amountCredit,
            dia: tx.day || null,
            isInvestment: !!tx.isInvestment
          });
        }
        if (amountDebit > 0) {
          monthlyData[monthPT].debitos.push({
            descricao: tx.description || tx.desc || '',
            valor: amountDebit,
            dia: tx.day || null,
            isInvestment: !!tx.isInvestment
          });
        }
      });

      // Também pode existir tithe/initialBalance/totalCredit etc.
      if (monthObj.initialBalance) {
        monthlyData[monthPT].initialBalance = monthObj.initialBalance;
      }
      if (monthObj.totalCredit) {
        monthlyData[monthPT].totalCredit = Number(monthObj.totalCredit) || 0;
      }
      if (monthObj.totalDebit) {
        monthlyData[monthPT].totalDebit = Number(monthObj.totalDebit) || 0;
      }
      if (monthObj.tithe) {
        monthlyData[monthPT].tithe = Number(monthObj.tithe) || 0;
      }
    });

    // 2) Cartão de crédito - despesas importadas
    const ccRef = ref(database, `creditCardData/${userId}/${year}`);
    const ccSnapshot = await get(ccRef);
    const ccData = ccSnapshot.val() || {};
    const ccList = Object.values(ccData || {}).map(item => ({
      month: item.month || '',
      description: item.description || '',
      value: Number(item.value) || 0,
      fitid: item.fitid || item.id || null
    }));

    // 3) Balances de cartão de crédito
    const ccBalancesRef = ref(database, `creditCardBalances/${userId}/${year}`);
    const ccBalancesSnapshot = await get(ccBalancesRef);
    const ccBalances = ccBalancesSnapshot.val() || {};

    // 4) Investimentos - lançamentos
    const invRef = ref(database, `investimentsData/${userId}/${year}`);
    const invSnapshot = await get(invRef);
    const invData = invSnapshot.val() || {};
    const invList = Object.keys(invData || {}).map(k => ({ id: k, ...(invData[k] || {}) }));

    // 5) Balances de investimentos
    const invBalancesRef = ref(database, `investimentBalances/${userId}/${year}`);
    const invBalancesSnapshot = await get(invBalancesRef);
    const invBalances = invBalancesSnapshot.val() || {};

    // 6) Dízimos
    const titheRef = ref(database, `tithes/${userId}/${year}`);
    const titheSnapshot = await get(titheRef);
    const titheData = titheSnapshot.val() || {};
    const tithesList = Object.values(titheData || {}).map(item => ({
      month: item.month,
      date: item.date,
      description: item.description,
      value: Number(item.value) || 0
    }));

    // Incorporar credit card items e tithe em monthlyData por mês (se possível)
    ccList.forEach(item => {
      // item.month expected like 'Janeiro 2024' or 'Janeiro'
      if (!item.month) return;
      const monthName = String(item.month).split(' ')[0];
      if (monthlyData[monthName]) {
        monthlyData[monthName].debitos.push({
          descricao: `[Cartão] ${item.description}`,
          valor: item.value,
          source: 'creditCard'
        });
      }
    });

    tithesList.forEach(item => {
      const monthName = item.month;
      if (monthlyData[monthName]) {
        monthlyData[monthName].debitos.push({
          descricao: `Dízimo: ${item.description || ''}`,
          valor: item.value,
          source: 'tithe'
        });
      }
    });

    // Construir summary: totais e top lançamentos agregados por descrição
    let totalCredit = 0;
    let totalDebit = 0;
    const launchesAgg = {}; // descrição => total
    monthsPT.forEach(monthName => {
      const m = monthlyData[monthName];
      // somar creditos
      (m.creditos || []).forEach(c => {
        totalCredit += Number(c.valor) || 0;
        const desc = (c.descricao || 'Crédito Diverso').trim();
        launchesAgg[desc] = (launchesAgg[desc] || 0) + (Number(c.valor) || 0);
      });
      (m.debitos || []).forEach(d => {
        totalDebit += Number(d.valor) || 0;
        const desc = (d.descricao || 'Débito Diverso').trim();
        launchesAgg[desc] = (launchesAgg[desc] || 0) - (Number(d.valor) || 0);
      });
    });

    // Incluir cartão de crédito e investimentos nos totais (se não já contados)
    const creditCardTotal = ccList.reduce((s, i) => s + (Number(i.value) || 0), 0);
    const investmentTotal = invList.reduce((s, i) => {
      const c = Number(i.credit) || 0;
      const d = Number(i.debit) || 0;
      return s + (d - c); // aplica=debit, resgate=credit (seguir lógica do app)
    }, 0);

    // Top lançamentos (por valor absoluto)
    const topLaunches = Object.keys(launchesAgg)
      .map(k => ({ description: k, total: launchesAgg[k] }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
      .slice(0, 12);

    const summary = {
      year: Number(year),
      totals: {
        totalCredit,
        totalDebit,
        creditCardTotal,
        investmentTotal,
        netBalance: totalCredit - totalDebit
      },
      topLaunches,
      generatedAt: new Date().toISOString()
    };

    const payload = {
      uid: userId,
      year,
      raw: monthlyData,
      creditCard: {
        items: ccList,
        balances: ccBalances
      },
      investments: {
        items: invList,
        balances: invBalances
      },
      tithes: tithesList,
      summary
    };

    const localStorageKey = `report_data_${year}`;
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(payload));
      console.log(`Dados completos para IA do ano ${year} (RTDB) salvos no localStorage.`);
    } catch (e) {
      console.error('Erro ao salvar report_data no localStorage:', e);
      // Mesmo que o localStorage falhe, retornamos o payload para permitir uso em memória
    }

    return payload;
  } catch (error) {
    console.error("Erro ao buscar e salvar todos os dados para IA:", error);
    return null;
  }
};
