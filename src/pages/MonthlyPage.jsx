import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import * as XLSX from 'xlsx';
import { useSwipeable } from 'react-swipeable';
import { Navigation, Card, InputField, TransactionCard } from '../components';
import { uuidv4, monthsPT, monthsLowercase, parseOFX } from '../utils/helpers';

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
  const [investmentBalance, setInvestmentBalance] = useState('0.00');
  const [totalCredit, setTotalCredit] = useState('0.00');
  const [totalDebit, setTotalDebit] = useState('0.00');
  const [balance, setBalance] = useState('0.00');
  const [finalBalance, setFinalBalance] = useState('0.00');
  const [percentage, setPercentage] = useState('0.00%');

  // Form state
  const [description, setDescription] = useState('');
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');
  const [day, setDay] = useState('');
  const [isTithe, setIsTithe] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handlers = useSwipeable({
    onSwipedLeft: () => navigate(`/month/${nextMonth}`),
    onSwipedRight: () => navigate(`/month/${prevMonth}`),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  // Load data from Firebase
  useEffect(() => {
    if (!user) return;

    const monthRef = ref(database, `users/${user.uid}/${monthKey}-${selectedYear}`);
    const unsubscribe = onValue(monthRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setInitialBalance(data.initialBalance || '');
        const transactionsData = data.transactions ? Object.values(data.transactions) : [];
        setTransactions(transactionsData);
        setTithe(data.tithe || '0.00');
        setTotalCredit(data.totalCredit || '0.00');
        setTotalDebit(data.totalDebit || '0.00');
        setFinalBalance(data.finalBalance || '0.00');
        setBalance(data.balance || '0.00');
        setPercentage(data.percentage || '0.00%');
      }
    });

    return () => unsubscribe();
  }, [user, monthKey, selectedYear]);

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

  // Load investment balance
  useEffect(() => {
    if (!user) return;

    const balanceRef = ref(database, `investimentBalances/${user.uid}/${selectedYear}/${monthKey}investimentBalance`);
    const unsubscribe = onValue(balanceRef, (snapshot) => {
      const balance = Number(snapshot.val() || 0);
      setInvestmentBalance(balance.toFixed(2));
    });

    return () => unsubscribe();
  }, [user, monthKey, selectedYear]);

  // Calculate totals
  const calculateTotal = useCallback(() => {
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

    return {
      tithe: titheTotal.toFixed(2),
      totalCredit: creditTotal.toFixed(2),
      totalDebit: debitTotal.toFixed(2),
      finalBalance: total.toFixed(2),
      balance: bal.toFixed(2),
      percentage: pct.toFixed(2) + '%'
    };
  }, [transactions, initialBalance, creditCardBalance, investmentBalance]);

  // Save data to Firebase
  const saveData = useCallback(async (data) => {
    if (!user) return;

    const calculated = calculateTotal();
    const monthData = {
      initialBalance: initialBalance,
      transactions: data,
      tithe: calculated.tithe,
      creditCardBalance: creditCardBalance,
      totalCredit: calculated.totalCredit,
      totalDebit: calculated.totalDebit,
      finalBalance: calculated.finalBalance,
      balance: calculated.balance,
      percentage: calculated.percentage
    };

    try {
      await set(ref(database, `users/${user.uid}/${monthKey}-${selectedYear}`), monthData);
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  }, [user, monthKey, selectedYear, initialBalance, creditCardBalance, calculateTotal]);

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

    // Clear form
    setDescription('');
    setDebit('');
    setCredit('');
    setDay('');
    setIsTithe(false);
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
      setIsTithe(transaction.tithe);
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

    // Clear form
    setEditingId(null);
    setDescription('');
    setDebit('');
    setCredit('');
    setDay('');
    setIsTithe(false);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setDebit('');
    setCredit('');
    setDay('');
    setIsTithe(false);
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

        const existingFITIDs = new Set(transactions.map(t => t.FITID).filter(Boolean));
        
        const newTransactions = parsedTransactions
          .filter(t => !existingFITIDs.has(t.FITID))
          .map(t => ({
            id: uuidv4(),
            description: t.description,
            debit: t.debit,
            credit: t.credit,
            day: t.date,
            tithe: false,
            dayBalance: 0,
            FITID: t.FITID
          }));

        if (newTransactions.length > 0) {
          const updatedTransactions = [...transactions, ...newTransactions]
            .sort((a, b) => parseInt(a.day) - parseInt(b.day));
          setTransactions(updatedTransactions);
          saveData(updatedTransactions);
          alert(`${newTransactions.length} transações importadas com sucesso!`);
        } else {
          alert("Nenhuma transação nova para importar.");
        }
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
      await set(ref(database, `users/${user.uid}/${monthKey}-${selectedYear}`), monthData);
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

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lançamentos");

    const summaryData = [
      [],
      ["Resumo do Mês"],
      ["Saldo Inicial", initialBalance],
      ["Total Crédito", totalCredit],
      ["Total Débito", totalDebit],
      ["Balanço", balance],
      ["Saldo Final", finalBalance]
    ];
    XLSX.utils.sheet_add_json(worksheet, summaryData, { origin: -1, skipHeader: true });

    XLSX.writeFile(workbook, `relatorio-${monthKey}-${selectedYear}.xlsx`);
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

      <div {...handlers} className="main-content">
        <div className="container">
          <button className="btn btn-nav" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>
            Início
          </button>
          <button className="btn red" onClick={handleClearMonth} style={{ marginBottom: '1rem', marginLeft: '1rem' }}>
            Limpar mês
          </button>

          <div className="monthly-layout">
            {/* Main Column */}
            <div className="main-column">
              <Card id="card-lancamento">
                <span className="card-title">{editingId ? 'Editar lançamento' : 'Fazer lançamento'}</span>
                
                <InputField
                  label="Descrição"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  icon="description"
                  placeholder="Descrição"
                />
                
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
                      <button className="btn red" onClick={handleCancelEdit}>Cancelar</button>
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

              <div id="dataCards">
                {transactionsWithBalance.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    runningBalance={transaction.runningBalance}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="sidebar-column">
              <Card>
                <span className="card-title">Saldo Inicial</span>
                <InputField
                  label="Saldo Inicial do Período"
                  id="initialBalance"
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  icon="account_balance_wallet"
                  placeholder="Saldo Inicial"
                />
              </Card>

              <Card>
                <span className="card-title">Resultados do Mês</span>
                <div className="results-list">
                  <p>Dízimo: <span className="blue-text">{tithe}</span></p>
                  <p>Cartão de Crédito: <span className="orange-text">{creditCardBalance}</span></p>
                  <p>Total Crédito: <span className="green-text">{totalCredit}</span></p>
                  <p>Total Débito: <span className="orange-text">{totalDebit}</span></p>
                  <p>Total Investimentos: <span className="orange-text">{investmentBalance}</span></p>
                  <p>Balanço: <span>{balance}</span></p>
                  <p>Débito ÷ Crédito: <span>{percentage}</span></p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Saldo Final: <span style={{ color: 'var(--color-primary)' }}>{finalBalance}</span>
                  </p>
                </div>
                <button className="btn" onClick={() => window.print()} style={{ marginTop: '1.5rem' }}>
                  Exportar para PDF
                </button>
                <button className="btn success" onClick={handleExportExcel} style={{ marginTop: '0.5rem' }}>
                  Exportar para Excel
                </button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
