import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set, onValue, remove, get } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card, InputField, SelectField } from '../components';
import { uuidv4, monthsPT, monthsLowercase } from '../utils/helpers';

const monthOptions = monthsPT.map((month) => ({
  value: month,
  label: month
}));

const monthBalanceIds = [
  'januaryinvestimentBalance',
  'februaryinvestimentBalance',
  'marchinvestimentBalance',
  'aprilinvestimentBalance',
  'mayinvestimentBalance',
  'juneinvestimentBalance',
  'julyinvestimentBalance',
  'augustinvestimentBalance',
  'septemberinvestimentBalance',
  'octoberinvestimentBalance',
  'novemberinvestimentBalance',
  'decemberinvestimentBalance'
];

export default function Investments() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [monthlyBalances, setMonthlyBalances] = useState({});
  const [annualRate, setAnnualRate] = useState('');
  const [totalInvested, setTotalInvested] = useState('0.00');
  const [totalReturn, setTotalReturn] = useState('0.00');
  const [projectedBalance, setProjectedBalance] = useState('0.00');

  // Form state
  const [description, setDescription] = useState('');
  const [debitValue, setDebitValue] = useState('');
  const [creditValue, setCreditValue] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [recurrence, setRecurrence] = useState(1); // novo estado para recorrência
  const [editingId, setEditingId] = useState(null);

  // Feedback e loading
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Load data from Firebase
  useEffect(() => {
    if (!user) return;

    const dataRef = ref(database, `investimentsData/${user.uid}/${selectedYear}`);
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const fetchedData = snapshot.val() || {};
      const items = Object.keys(fetchedData).map(key => ({ ...fetchedData[key], id: key }));
      setData(items);
    });

    return () => unsubscribe();
  }, [user, selectedYear]);

  // Calculate balances when data changes
  useEffect(() => {
    const balances = {};
    let total = 0;

    monthsPT.forEach((monthName, index) => {
      const monthlyData = data.filter(item => item.month && item.month.startsWith(monthName));
      let balance = 0;
      monthlyData.forEach(item => {
        balance += parseFloat(item.credit || 0) - parseFloat(item.debit || 0);
      });
      balances[monthBalanceIds[index]] = balance.toFixed(2);
      total += balance;
    });

    setMonthlyBalances(balances);
    setTotalInvested(total.toFixed(2));

    // Save to Firebase
    if (user) {
      monthBalanceIds.forEach((id) => {
        const value = parseFloat(balances[id]) || 0;
        const monthRef = ref(database, `investimentBalances/${user.uid}/${selectedYear}/${id}`);
        set(monthRef, value).catch(console.error);
      });
    }

    // Calculate projected return
    const monthlyRate = (parseFloat(annualRate) || 0) / 100 / 12;
    let currentBal = 0;
    let totalReturnAmount = 0;

    monthsPT.forEach((_, index) => {
      const monthBal = parseFloat(balances[monthBalanceIds[index]]) || 0;
      currentBal += monthBal;
      const monthReturn = currentBal * monthlyRate;
      currentBal += monthReturn;
      totalReturnAmount += monthReturn;
    });

    setTotalReturn(totalReturnAmount.toFixed(2));
    setProjectedBalance(currentBal.toFixed(2));
  }, [data, user, selectedYear, annualRate]);


  // Add item
  const handleAddItem = async () => {
    setFeedback('');
    if (!user || !selectedYear) {
      setFeedback('Usuário ou ano não definido. Faça login novamente.');
      console.error('Usuário ou ano não definido:', { user, selectedYear });
      return;
    }
    if (!selectedMonth || !description) {
      setFeedback('Por favor, selecione o mês e preencha a descrição.');
      console.warn('Formulário incompleto:', { selectedMonth, description });
      return;
    }

    setLoading(true);
    try {
      const credit = parseFloat(creditValue) || 0;
      const debit = parseFloat(debitValue) || 0;
      const monthIdx = monthsPT.findIndex(m => m === selectedMonth);
      const balanceId = monthBalanceIds[monthIdx];
      const balanceRef = ref(database, `investimentBalances/${user.uid}/${selectedYear}/${balanceId}`);

      // Buscar saldo atual do mês
      let currentBalance = 0;
      try {
        const snapshot = await get(balanceRef);
        currentBalance = parseFloat(snapshot.val()) || 0;
      } catch (e) {
        currentBalance = 0;
      }

      // Aplicação recorrente: só para aplicações, não para resgates
      if (credit > 0 && recurrence > 1) {
        for (let i = 0; i < recurrence; i++) {
          const idx = monthIdx + i;
          if (idx >= monthsPT.length) break;
          const id = monthBalanceIds[idx];
          const refMonth = ref(database, `investimentBalances/${user.uid}/${selectedYear}/${id}`);
          let bal = 0;
          try {
            const snap = await get(refMonth);
            bal = parseFloat(snap.val()) || 0;
          } catch (e) {
            bal = 0;
          }
          await set(refMonth, bal + credit);
          console.log(`Aporte de R$ ${credit} lançado em ${monthsPT[idx]} (${id})`);
        }
        setFeedback('Aportes recorrentes lançados com sucesso!');
      } else {
        // Lançamento único (aplicação ou resgate)
        let newBalance = currentBalance;
        if (credit > 0) {
          newBalance += credit;
          setFeedback('Aporte lançado com sucesso!');
          console.log(`Aporte de R$ ${credit} lançado em ${selectedMonth} (${balanceId})`);
        }
        if (debit > 0) {
          newBalance -= debit;
          setFeedback('Resgate lançado com sucesso!');
          console.log(`Resgate de R$ ${debit} lançado em ${selectedMonth} (${balanceId})`);
        }
        await set(balanceRef, newBalance);
      }

      // Atualizar total aportado (soma dos meses)
      let total = 0;
      for (let i = 0; i < monthBalanceIds.length; i++) {
        const id = monthBalanceIds[i];
        const refMonth = ref(database, `investimentBalances/${user.uid}/${selectedYear}/${id}`);
        try {
          const snap = await get(refMonth);
          total += parseFloat(snap.val()) || 0;
        } catch (e) {}
      }
      setTotalInvested(total.toFixed(2));

      // Clear form
      setDescription('');
      setDebitValue('');
      setCreditValue('');
      setSelectedMonth('');
      setRecurrence(1);
    } catch (error) {
      setFeedback('Erro ao lançar movimentação. Verifique o console.');
      console.error('Erro ao lançar movimentação:', error);
    }
    setLoading(false);
  };

  // Carregar saldos mensais e total investido
  useEffect(() => {
    if (!user) return;
    const fetchBalances = async () => {
      const balances = {};
      let total = 0;
      for (let i = 0; i < monthBalanceIds.length; i++) {
        const id = monthBalanceIds[i];
        const refMonth = ref(database, `investimentBalances/${user.uid}/${selectedYear}/${id}`);
        try {
          const snap = await get(refMonth);
          const value = parseFloat(snap.val()) || 0;
          balances[id] = value.toFixed(2);
          total += value;
        } catch (e) {
          balances[id] = '0.00';
        }
      }
      setMonthlyBalances(balances);
      setTotalInvested(total.toFixed(2));

      // Simulação de rendimento
      const monthlyRate = (parseFloat(annualRate) || 0) / 100 / 12;
      let currentBal = 0;
      let totalReturnAmount = 0;
      for (let i = 0; i < monthBalanceIds.length; i++) {
        const monthBal = parseFloat(balances[monthBalanceIds[i]]) || 0;
        currentBal += monthBal;
        const monthReturn = currentBal * monthlyRate;
        currentBal += monthReturn;
        totalReturnAmount += monthReturn;
      }
      setTotalReturn(totalReturnAmount.toFixed(2));
      setProjectedBalance(currentBal.toFixed(2));
    };
    fetchBalances();
  }, [user, selectedYear, annualRate, feedback]);
    // Clear form
    setEditingId(null);
    setDescription('');
    setDebitValue('');
    setCreditValue('');
    setSelectedMonth('');
  };

  // Group data by description
  const groupedData = data.reduce((acc, item) => {
    const [, itemYear] = (item.month || '').split(' ');
    if (parseInt(itemYear) === selectedYear) {
      if (!acc[item.description]) {
        acc[item.description] = [];
      }
      acc[item.description].push(item);
    }
    return acc;
  }, {});

  return (
    <>
      <Navigation
        title={`Investimentos ${selectedYear}`}
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <div className="main-content">
        <div className="container">
          <div className="data-layout">
            {/* Main Column */}
            <div className="main-column">
              <Card id="card-lancamento">
                <span className="card-title">Movimentar Investimentos</span>

                {/* Feedback visual */}
                {feedback && (
                  <div style={{ marginBottom: '1rem', color: feedback.includes('erro') || feedback.includes('Erro') ? 'red' : 'green' }}>
                    {feedback}
                  </div>
                )}
                {loading && (
                  <div style={{ marginBottom: '1rem', color: 'blue' }}>Processando...</div>
                )}

                <InputField
                  label="Descrição"
                  id="investDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  icon="description"
                  placeholder="Descrição"
                />

                <InputField
                  label="Retirar"
                  id="investDebit"
                  type="number"
                  value={debitValue}
                  onChange={(e) => setDebitValue(e.target.value)}
                  icon="arrow_downward"
                  placeholder="Retirar"
                />

                <InputField
                  label="Aplicar"
                  id="investCredit"
                  type="number"
                  value={creditValue}
                  onChange={(e) => setCreditValue(e.target.value)}
                  icon="arrow_upward"
                  placeholder="Aplicar"
                />

                <SelectField
                  label="Mês da Movimentação"
                  id="investMonth"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  options={monthOptions}
                  placeholder="Selecione o Mês"
                />
                <InputField
                  label="Repetir aplicação (meses)"
                  id="recurrence"
                  type="number"
                  min="1"
                  value={recurrence}
                  onChange={e => setRecurrence(Math.max(1, parseInt(e.target.value) || 1))}
                  icon="repeat"
                  placeholder="Quantidade de meses"
                />

                {editingId ? (
                  <div className="add-container">
                    <button className="btn" onClick={handleSaveEdit}>Salvar</button>
                    <button className="btn red" onClick={() => {
                      setEditingId(null);
                      setDescription('');
                      setDebitValue('');
                      setCreditValue('');
                      setSelectedMonth('');
                    }}>Cancelar</button>
                  </div>
                ) : (
                  <button className="btn" onClick={handleAddItem} disabled={loading}>Adicionar Movimentação</button>
                )}
              </Card>

              {/* Grouped Cards */}
              <div id="groupedCardContainer">
                {Object.keys(groupedData).map(desc => {
                  const items = groupedData[desc];
                  return (
                    <Card key={desc}>
                      <span className="card-title">{desc}</span>
                      {items.map(item => (
                        <div key={item.id} className="transaction-card" style={{ marginBottom: '0.5rem' }}>
                          <p>Mês: {item.month}</p>
                          {item.credit > 0 && <p>Crédito: R$ {item.credit.toFixed(2)}</p>}
                          {item.debit > 0 && <p>Débito: R$ {item.debit.toFixed(2)}</p>}
                          <div className="button-group" style={{ marginTop: '0.5rem' }}>
                            <button className="btn btn-flat" onClick={() => handleEdit(item)}>Editar</button>
                            <button className="btn btn-flat red-text" onClick={() => handleDelete(item.id)}>Excluir</button>
                          </div>
                        </div>
                      ))}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="sidebar-column">
              <Card>
                <span className="card-title">Aportes Mensais</span>
                <div className="value-grid">
                  {monthsPT.map((month, index) => (
                    <div className="value-item" key={month}>
                      <span className="value-title">{month.substring(0, 3)}</span>
                      <span className="value-amount">
                        {monthlyBalances[monthBalanceIds[index]] || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <span className="card-title">Simular Rendimento</span>
                <InputField
                  label="Taxa de Rendimento Anual (%)"
                  id="rendimentoAnual"
                  type="number"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  icon="trending_up"
                  placeholder="Ex: 10"
                />
                <div className="results-list">
                  <p>Total Aportado: <span>{totalInvested}</span></p>
                  <p>Rendimento Estimado: <span className="green-text">{totalReturn}</span></p>
                  <p style={{ fontWeight: 'bold' }}>Saldo Final Projetado: <span>{projectedBalance}</span></p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
