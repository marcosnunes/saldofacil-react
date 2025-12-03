import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useYear } from './YearContext';
import { monthsLowercase, uuidv4, parseOFX } from '../utils/helpers';

const MonthlyContext = createContext();

export function useMonthly() {
  return useContext(MonthlyContext);
}

export function MonthlyProvider({ monthIndex, children }) {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  // Fallback para o ano atual se selectedYear estiver undefined
  const year = selectedYear ?? new Date().getFullYear();
  const monthKey = monthsLowercase[monthIndex];

  const [transactions, setTransactions] = useState([]);
  const [initialBalance, setInitialBalance] = useState('');
  const [tithe, setTithe] = useState('0.00');
  const [creditCardBalance] = useState('0.00');
  const [investmentBalance] = useState('0.00');
  const [totalCredit, setTotalCredit] = useState('0.00');
  const [totalDebit, setTotalDebit] = useState('0.00');
  const [balance, setBalance] = useState('0.00');
  const [finalBalance, setFinalBalance] = useState('0.00');
  const [percentage, setPercentage] = useState('0.00%');

  // Carrega dados do Firebase
  useEffect(() => {
    if (!user) return;
    const monthRef = ref(database, `users/${user.uid}/${year}/${monthKey}`);
    const unsubscribe = onValue(monthRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setInitialBalance(data.initialBalance || '');
        setTransactions(data.transactions ? Object.values(data.transactions) : []);
        setTithe(data.tithe || '0.00');
        setTotalCredit(data.totalCredit || '0.00');
        setTotalDebit(data.totalDebit || '0.00');
        setFinalBalance(data.finalBalance || '0.00');
        setBalance(data.balance || '0.00');
        setPercentage(data.percentage || '0.00%');
      }
    });
    return () => unsubscribe();
  }, [user, monthKey, year]);

  // Atualiza totais sempre que houver mudança relevante
  useEffect(() => {
    const ccBalance = Number(creditCardBalance);
    const initBalance = Number(initialBalance) || 0;
    const invBalance = Number(investmentBalance);
    let debitTotal = 0;
    let creditTotal = 0;
    let titheTotal = 0;
    transactions.forEach(transaction => {
      debitTotal += Number(transaction.debit) || 0;
      creditTotal += Number(transaction.credit) || 0;
      if (transaction.credit && transaction.tithe) {
        titheTotal += Number(transaction.credit) * 0.1;
      }
    });
    debitTotal += ccBalance;
    const total = initBalance + creditTotal - debitTotal - invBalance;
    const bal = creditTotal - debitTotal - invBalance;
    const pct = creditTotal !== 0 ? (debitTotal / creditTotal) * 100 : 0;
    setTithe(titheTotal.toFixed(2));
    setTotalCredit(creditTotal.toFixed(2));
    setTotalDebit(debitTotal.toFixed(2));
    setFinalBalance(total.toFixed(2));
    setBalance(bal.toFixed(2));
    setPercentage(pct.toFixed(2) + '%');
  }, [transactions, initialBalance, creditCardBalance, investmentBalance]);

  // Salva dados no Firebase
  const saveData = useCallback(async (data) => {
    if (!user) return;
    const monthData = {
      initialBalance,
      transactions: data,
      tithe,
      creditCardBalance,
      totalCredit,
      totalDebit,
      finalBalance,
      balance,
      percentage
    };
    try {
      await set(ref(database, `users/${user.uid}/${year}/${monthKey}`), monthData);
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  }, [user, monthKey, year, initialBalance, creditCardBalance, tithe, totalCredit, totalDebit, finalBalance, balance, percentage]);

  // Funções de atualização
  const addTransaction = (transaction) => {
    const updatedTransactions = [...transactions, transaction].sort((a, b) => parseInt(a.day) - parseInt(b.day));
    setTransactions(updatedTransactions);
    saveData(updatedTransactions);
  };

  const updateTransaction = (id, updated) => {
    const updatedTransactions = transactions.map(t => t.id === id ? { ...t, ...updated } : t);
    setTransactions(updatedTransactions);
    saveData(updatedTransactions);
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    saveData(updatedTransactions);
  };

  const importOFX = (ofxData) => {
    const parsedTransactions = parseOFX(ofxData);
    const seen = new Set();
    const uniqueTransactions = parsedTransactions.filter(t => {
      const key = (t.FITID ? t.FITID + t.description + t.credit + t.debit : t.description + t.credit + t.debit);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(t => ({
      id: uuidv4(),
      description: t.description,
      debit: t.debit,
      credit: t.credit,
      day: t.date,
      tithe: false,
      dayBalance: 0,
      FITID: t.FITID
    }));
    setTransactions(uniqueTransactions);
    saveData(uniqueTransactions);
  };

  return (
    <MonthlyContext.Provider value={{
      transactions,
      initialBalance,
      tithe,
      creditCardBalance,
      investmentBalance,
      totalCredit,
      totalDebit,
      balance,
      finalBalance,
      percentage,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      importOFX,
      setInitialBalance,
      selectedYear: year
    }}>
      {children}
    </MonthlyContext.Provider>
  );
}
