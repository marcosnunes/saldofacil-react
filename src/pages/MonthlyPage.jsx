import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card, InputField, TransactionCard } from '../components';
import { uuidv4, monthsPT, monthsLowercase, parseOFX } from '../utils/helpers';
import { exportElementAsPDF, exportDataAsExcel, exportYearAsExcel } from '../utils/export';

export default function MonthlyPage() {
  const { monthId } = useParams();
  const monthIndex = parseInt(monthId) - 1;
  const monthName = monthsPT[monthIndex];
  const monthKey = monthsLowercase[monthIndex];

  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();

  const prevMonth = monthIndex === 0 ? 12 : monthIndex;
  const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2;

  const [transactions, setTransactions] = useState([]);
  const [initialBalance, setInitialBalance] = useState('');
  const [tithe, setTithe] = useState('0.00');
  const [creditCardBalance, setCreditCardBalance] = useState('0.00');
  const [investmentTotal, setInvestmentTotal] = useState(0); // Novo estado
  const [totalCredit, setTotalCredit] = useState('0.00');
  const [totalDebit, setTotalDebit] = useState('0.00');
  const [balance, setBalance] = useState('0.00');
  const [finalBalance, setFinalBalance] = useState('0.00');
  const [percentage, setPercentage] = useState('0.00%');

  const resetState = useCallback(() => {
    setTransactions([]);
    setInitialBalance('');
    setTithe('0.00');
    setCreditCardBalance('0.00');
    setInvestmentTotal(0);
    setTotalCredit('0.00');
    setTotalDebit('0.00');
    setBalance('0.00');
    setFinalBalance('0.00');
    setPercentage('0.00%');
  }, []);

  // Load investment data for the month
  useEffect(() => {
    if (!user) return;

    const investDataRef = ref(database, `investmentsData/${user.uid}/${selectedYear}`);
    const unsubscribe = onValue(investDataRef, (snapshot) => {
      const allInvestments = snapshot.val() || {};
      let monthInvestmentTotal = 0;

      Object.values(allInvestments).forEach(item => {
        if (item.month && item.month.startsWith(monthName)) {
          const credit = parseFloat(item.credit) || 0; // Resgate (entra na conta)
          const debit = parseFloat(item.debit) || 0;   // Aplicação (sai da conta)
          monthInvestmentTotal += (debit - credit);
        }
      });

      setInvestmentTotal(monthInvestmentTotal);
    });

    return () => unsubscribe();
  }, [user, selectedYear, monthName]);

  // Recalcula totais sempre que houver mudança relevante
  useEffect(() => {
    const ccBalance = Number(creditCardBalance) || 0;
    const initBalance = Number(initialBalance) || 0;
    const invTotal = Number(investmentTotal) || 0; // This is net investment (debit-credit)

    let transactionDebitTotal = 0;
    let transactionCreditTotal = 0;
    let titheTotal = 0;

    transactions.forEach(transaction => {
      transactionDebitTotal += Number(transaction.debit) || 0;
      transactionCreditTotal += Number(transaction.credit) || 0;
      if (transaction.credit && transaction.tithe) {
        titheTotal += Number(transaction.credit) * 0.1;
      }
    });

    // Total de saídas: débitos normais + fatura do cartão + investimentos líquidos
    const totalOutflow = transactionDebitTotal + ccBalance - invTotal;

    // Saldo final: Saldo Inicial + Entradas - Saídas
    const finalBal = initBalance + transactionCreditTotal - totalOutflow;

    // Balanço do mês: Entradas - Saídas
    const monthlyBalance = transactionCreditTotal - totalOutflow;

    // Percentual de gastos em relação às entradas
    const pct = transactionCreditTotal > 0 ? (totalOutflow / transactionCreditTotal) * 100 : 0;

    setTithe(titheTotal.toFixed(2));
    setTotalCredit(transactionCreditTotal.toFixed(2));
    // O "Total Débito" no card deve refletir todas as saídas
    setTotalDebit(totalOutflow.toFixed(2));
    setFinalBalance(finalBal.toFixed(2));
    setBalance(monthlyBalance.toFixed(2));
    setPercentage(pct.toFixed(2) + '%');
  }, [transactions, initialBalance, creditCardBalance, investmentTotal]);

  // Form state
  const [description, setDescription] = useState('');
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');
  const [day, setDay] = useState('');
  const [isTithe, setIsTithe] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load data from Firebase
  useEffect(() => {
    if (!user) return;

    resetState();

    const monthRef = ref(database, `users/${user.uid}/${selectedYear}/${monthKey}`);
    const unsubscribe = onValue(monthRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setInitialBalance(data.initialBalance || '');
        const transactionsData = data.transactions ? Object.values(data.transactions) : [];
        setTransactions(transactionsData);
      } else {
        // Se não houver dados, limpa as transações para evitar mostrar dados do mês anterior
        setTransactions([]);
      }
    });

    // Se não for janeiro, buscar saldo final do mês anterior
    if (monthIndex > 0 && user) {
      const prevMonthKey = monthsLowercase[monthIndex - 1];
      const prevMonthRef = ref(database, `users/${user.uid}/${selectedYear}/${prevMonthKey}`);
      onValue(prevMonthRef, (snapshot) => {
        const data = snapshot.val();
        const prevBalance = data?.finalBalance || '0.00';
        setInitialBalance(prevBalance); // Define o saldo inicial como o final do mês anterior
      }, { onlyOnce: true });
    }

    return () => unsubscribe();
  }, [user, selectedYear, monthKey, monthIndex, resetState]);

  // Load credit card balance
  useEffect(() => {
    if (!user) return;

    const balanceRef = ref(database, `creditCardBalances/${user.uid}/${selectedYear}/${monthKey}CreditCardBalance`);
    const unsubscribe = onValue(balanceRef, (snapshot) => {
      const balance = snapshot.val() || '0.00';
      setCreditCardBalance(balance.toString());
    });

    return () => unsubscribe();
  }, [user, monthKey, selectedYear]);

  // Load investment launches
  useEffect(() => {
    if (!user) return;

    // Buscar lançamentos de investimentos do mês
    const investDataRef = ref(database, `investmentsData/${user.uid}/${selectedYear}`);
    const unsubscribeInvest = onValue(investDataRef, (snapshot) => {
      const investData = snapshot.val() || {};
      const monthInvests = Object.values(investData).filter(item => {
        if (!item.month) return false;
        const [monthNameFromItem] = item.month.split(' ');
        return monthName === monthNameFromItem;
      });

      setTransactions(prevTransactions => {
        const filteredTransactions = prevTransactions.filter(t => !t.isInvestment);
        const investTransactions = monthInvests.map(item => ({
          id: item.id,
          description: `[Investimento] ${item.description}`,
          debit: item.credit > 0 ? item.credit : 0, // Resgate é débito na conta
          credit: item.debit > 0 ? item.debit : 0,   // Aplicação é crédito na conta
          day: item.day || '1',
          isInvestment: true
        }));
        return [...filteredTransactions, ...investTransactions].sort((a, b) => parseInt(a.day) - parseInt(b.day));
      });
    });

    return () => {
      unsubscribeInvest();
    };
  }, [user, selectedYear, monthName]);

  // Save data to Firebase
  const saveData = useCallback(async (data) => {
    if (!user) return;

    // The state values are already calculated by the main useEffect hook,
    // so we can just use them directly when saving.
    const monthData = {
      initialBalance: initialBalance,
      transactions: data,
      tithe: tithe,
      creditCardBalance: creditCardBalance,
      investmentTotal: investmentTotal,
      totalCredit: totalCredit,
      totalDebit: totalDebit,
      finalBalance: finalBalance,
      balance: balance,
      percentage: percentage
    };

    try {
      await set(ref(database, `users/${user.uid}/${selectedYear}/${monthKey}`), monthData);
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  }, [user, monthKey, selectedYear, initialBalance, creditCardBalance, investmentTotal, tithe, totalCredit, totalDebit, finalBalance, balance, percentage]);

  // Effect to save when initialBalance changes
  useEffect(() => {
    if (user && initialBalance !== '') {
      const timeoutId = setTimeout(() => {
        saveData(transactions);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [initialBalance, user, saveData, transactions]);

  // Add transaction
  const handleAddTransaction = () => {
    if (!description.trim() || !day.trim() || (!debit.trim() && !credit.trim())) {
      alert("Por favor, preencha a descrição, o dia e pelo menos um dos campos débito ou crédito.");
      return;
    }

    const dayNum = parseInt(day);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      alert("Por favor, insira um dia válido entre 1 e 31.");
      return;
    }

    const newTransaction = {
      id: uuidv4(),
      description,
      debit: debit ? parseFloat(debit) : 0,
      credit: credit ? parseFloat(credit) : 0,
      day,
      tithe: isTithe,
      dayBalance: 0
    };

    const updatedTransactions = [...transactions, newTransaction]
      .sort((a, b) => parseInt(a.day) - parseInt(b.day));

    setTransactions(updatedTransactions);
    saveData(updatedTransactions);

    // Clear form and close modal
    setDescription('');
    setDebit('');
    setCredit('');
    setDay('');
    setIsTithe(false);
    setIsModalOpen(false);
  };

  // Delete transaction
  const handleDeleteTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    saveData(updatedTransactions);
  };

  // Edit transaction
  const handleEditTransaction = (id) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setEditingId(id);
      setDescription(transaction.description);
      setDebit(transaction.debit.toString());
      setCredit(transaction.credit.toString());
      setDay(transaction.day);
      setIsTithe(Boolean(transaction.tithe === true || transaction.tithe === 'true' || transaction.tithe === 1));
      
      // Abrir modal imediatamente
      setIsModalOpen(true);
    }
  };

  // Save edit
  const handleSaveEdit = () => {
    const updatedTransactions = transactions.map(t => {
      if (t.id === editingId) {
        return {
          ...t,
          description,
          debit: parseFloat(debit) || 0,
          credit: parseFloat(credit) || 0,
          day,
          tithe: isTithe
        };
      }
      return t;
    }).sort((a, b) => parseInt(a.day) - parseInt(b.day));

    setTransactions(updatedTransactions);
    saveData(updatedTransactions);

    // Clear form and close modal
    setEditingId(null);
    setDescription('');
    setDebit('');
    setCredit('');
    setDay('');
    setIsTithe(false);
    setIsModalOpen(false);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setDebit('');
    setCredit('');
    setDay('');
    setIsTithe(false);
    setIsModalOpen(false);
  };

  // Import OFX
  const handleImportOFX = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ofxData = e.target.result;
        const parsedTransactions = parseOFX(ofxData);

        const newTransactions = parsedTransactions.map(t => ({
          id: uuidv4(),
          description: t.description,
          debit: t.debit,
          credit: t.credit,
          day: t.date,
          tithe: false,
          dayBalance: 0,
          FITID: t.FITID
        }));

        setTransactions(prevTransactions => {
          const existingFitIds = new Set(prevTransactions.map(t => t.FITID).filter(Boolean));
          const uniqueNewTransactions = newTransactions.filter(t => !t.FITID || !existingFitIds.has(t.FITID));

          if (uniqueNewTransactions.length > 0) {
            const updatedTransactions = [...prevTransactions, ...uniqueNewTransactions]
              .sort((a, b) => parseInt(a.day) - parseInt(b.day));
            saveData(updatedTransactions);
            alert(`${uniqueNewTransactions.length} transações novas importadas com sucesso!`);
            return updatedTransactions;
          } else {
            alert("Nenhuma transação nova para importar.");
            return prevTransactions;
          }
        });

      } catch (error) {
        console.error("Erro ao processar OFX:", error);
        alert("Erro ao processar arquivo OFX. Verifique se o arquivo é válido.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Clear month data
  const handleClearMonth = async () => {
    if (!window.confirm("Tem certeza que deseja limpar os dados deste mês?")) {
      return;
    }

    try {
      const monthData = {
        initialBalance: initialBalance
      };
      await set(ref(database, `users/${user.uid}/${selectedYear}/${monthKey}`), monthData);
      setTransactions([]);
      setTithe('0.00');
      setTotalCredit('0.00');
      setTotalDebit('0.00');
      setFinalBalance('0.00');
      setBalance('0.00');
      setPercentage('0.00%');
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = transactionsWithBalance.map(t => ({
      Dia: t.day,
      Descrição: t.description,
      Crédito: t.credit,
      Débito: t.debit,
      'Saldo Parcial': t.runningBalance.toFixed(2)
    }));

    dataToExport.push({}); // Empty line
    dataToExport.push({ 'Descrição': 'Resumo do Mês' });
    dataToExport.push({ 'Descrição': 'Saldo Inicial', 'Crédito': initialBalance });
    dataToExport.push({ 'Descrição': 'Total Crédito', 'Crédito': totalCredit });
    dataToExport.push({ 'Descrição': 'Total Débito', 'Crédito': totalDebit });
    dataToExport.push({ 'Descrição': 'Balanço', 'Crédito': balance });
    dataToExport.push({ 'Descrição': 'Saldo Final', 'Crédito': finalBalance });

    exportDataAsExcel(dataToExport, `relatorio-${monthKey}-${selectedYear}`, 'Lançamentos');
  };

  // Navigation
  const getRunningBalance = () => {
    let runningBalance = Number(initialBalance) || 0;
    if (!Array.isArray(transactions)) {
      return [];
    }
    return transactions.map(t => {
      if (t.credit) runningBalance += Number(t.credit);
      if (t.debit) runningBalance -= Number(t.debit);
      return { ...t, runningBalance };
    });
  };

  const transactionsWithBalance = getRunningBalance();

  return (
    <>
      <Navigation
        title={`${monthName} ${selectedYear}`}
        onBack={() => navigate(`/month/${prevMonth}`)}
        onNext={() => navigate(`/month/${nextMonth}`)}
      />

      <div className="main-content">
        <div className="container">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button className="btn btn-nav" onClick={() => navigate('/')}>
              Início
            </button>
            <button className="btn" onClick={() => setIsModalOpen(true)} style={{ flex: 1 }}>
              + Fazer lançamento
            </button>
            <button className="btn red" onClick={handleClearMonth}>
              Limpar mês
            </button>
          </div>

          <div className="monthly-layout">
            {/* Main Column */}
            <div className="main-column">
              {/* Modal para fazer lançamento */}
              {isModalOpen && (
                <div className="modal-overlay" onClick={() => !editingId && setIsModalOpen(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <Card id="card-lancamento">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span className="card-title">{editingId ? 'Editar lançamento' : 'Fazer lançamento'}</span>
                        <button 
                          className="btn" 
                          onClick={() => !editingId && setIsModalOpen(false)}
                          style={{ background: 'transparent', color: 'var(--color-text-muted)', boxShadow: 'none', padding: '0.5rem', minWidth: '40px' }}
                        >
                          ✕
                        </button>
                      </div>

                      <InputField
                        label="Descrição"
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        icon="description"
                        placeholder="Descrição"
                      />

                      {editingId ? (
                        parseFloat(debit) > 0 ? (
                          <InputField
                            label="Débito"
                            id="debit"
                            type="number"
                            value={debit}
                            onChange={(e) => setDebit(e.target.value)}
                            icon="arrow_downward"
                            placeholder="Débito"
                          />
                        ) : (
                          <InputField
                            label="Crédito"
                            id="credit"
                            type="number"
                            value={credit}
                            onChange={(e) => setCredit(e.target.value)}
                            icon="arrow_upward"
                            placeholder="Crédito"
                          />
                        )
                      ) : (
                        <>
                          <InputField
                            label="Débito"
                            id="debit"
                            type="number"
                            value={debit}
                            onChange={(e) => setDebit(e.target.value)}
                            icon="arrow_downward"
                            placeholder="Débito"
                          />
                          <InputField
                            label="Crédito"
                            id="credit"
                            type="number"
                            value={credit}
                            onChange={(e) => setCredit(e.target.value)}
                            icon="arrow_upward"
                            placeholder="Crédito"
                          />
                        </>
                      )}

                      <div style={{ paddingLeft: '0', marginBottom: '1.5rem' }}>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={isTithe}
                            onChange={(e) => setIsTithe(e.target.checked)}
                          />
                          <span>É dízimo?</span>
                        </label>
                      </div>

                      <InputField
                        label="Dia"
                        id="day"
                        type="number"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        icon="calendar_today"
                        placeholder="Dia"
                        min="1"
                        max="31"
                      />

                      <div className="add-container">
                        {editingId ? (
                          <>
                            <button className="btn" onClick={handleSaveEdit}>Salvar</button>
                            <button className="btn btn-cancel" onClick={handleCancelEdit}>✕ Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button className="btn" onClick={handleAddTransaction}>Adicionar</button>
                            <label className="btn success">
                              Importar Extrato
                              <input type="file" accept=".ofx" onChange={handleImportOFX} />
                            </label>
                          </>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              <div id="dataCards">
                {/* Filtra duplicados por FITID + descrição antes de renderizar */}
                {(() => {
                  const seen = new Set();
                  return transactionsWithBalance.filter(t => {
                    // Chave mais robusta para evitar falsos positivos em duplicados
                    const key = `${t.FITID || ''}_${t.description}_${t.credit}_${t.debit}_${t.day}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  }).map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      runningBalance={transaction.runningBalance}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                    />
                  ));
                })()}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="sidebar-column">
              <Card>
                <span className="card-title">Saldo Inicial</span>
                {monthIndex === 0 ? (
                  <InputField
                    label="Saldo Inicial do Período"
                    id="initialBalance"
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    icon="account_balance_wallet"
                    placeholder="Saldo Inicial"
                  />
                ) : (
                  <div style={{ marginTop: '1rem', fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                    {initialBalance !== '' ? `R$ ${Number(initialBalance).toFixed(2)}` : 'Carregando...'}
                  </div>
                )}
              </Card>

              <Card>
                <span className="card-title">Resultados do Mês</span>
                <div className="results-list">
                  <p>Dízimo: <span className="blue-text">{tithe}</span></p>
                  <p>Cartão de Crédito: <span className="orange-text">{creditCardBalance}</span></p>
                  <p>Total Crédito: <span className="green-text">{totalCredit}</span></p>
                  <p>Total Débito: <span className="orange-text">{totalDebit}</span></p>
                  <p>Total Investimentos: <span className="orange-text">{investmentTotal.toFixed(2)}</span></p>
                  <p>Balanço: <span>{balance}</span></p>
                  <p>Débito ÷ Crédito: <span>{percentage}</span></p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Saldo Final: <span style={{ color: 'var(--color-primary)' }}>{finalBalance}</span>
                  </p>
                </div>
                <div id="export-buttons" className="export-buttons-container no-print">
                  <button className="btn" onClick={() => exportElementAsPDF('dataCards', `relatorio-${monthKey}-${selectedYear}`)}>
                    Exportar para PDF
                  </button>
                  <button className="btn success" onClick={handleExportExcel}>
                    Exportar Mês (Excel)
                  </button>
                  <button className="btn success" onClick={() => exportYearAsExcel(database, user.uid, selectedYear, monthsLowercase, monthsPT)}>
                    Exportar Ano Completo (Excel)
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}