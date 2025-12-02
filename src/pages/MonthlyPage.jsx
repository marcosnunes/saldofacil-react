import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation, Card, InputField, TransactionCard } from '../components';
import { monthsPT } from '../utils/helpers';
import { MonthlyProvider, useMonthly } from '../contexts/MonthlyContext';
import { useYear } from '../contexts/YearContext';

export default function MonthlyPage() {
  const { monthId } = useParams();
  const monthIndex = parseInt(monthId) - 1;
  return (
    <MonthlyProvider monthIndex={monthIndex}>
      <MonthlyContent monthIndex={monthIndex} />
    </MonthlyProvider>
  );
}




function MonthlyContent({ monthIndex }) {
  const { initialBalance, tithe, creditCardBalance, investmentBalance, totalCredit, totalDebit, balance, finalBalance, percentage, addTransaction, updateTransaction, deleteTransaction, importOFX, setInitialBalance } = useMonthly();
  const { selectedYear } = useYear();
  const monthName = monthsPT[monthIndex];
  const navigate = useNavigate();
  const prevMonth = monthIndex === 0 ? 12 : monthIndex;
  const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2;

  // Form state
  const [description, setDescription] = useState('');
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');
  const [day, setDay] = useState('');
  const [isTithe, setIsTithe] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // You may need to define transactionsWithBalance and handlers below if not already present
  // Example implementation for missing handlers and state:
  const transactionsWithBalance = []; // Replace with actual transactions from context or props

  function handleEditTransaction(transaction) {
    setEditingId(transaction.id);
    setDescription(transaction.description);
    setDebit(transaction.debit || '');
    setCredit(transaction.credit || '');
    setDay(transaction.day || '');
    setIsTithe(transaction.isTithe || false);
  }

  function handleDeleteTransaction(id) {
    deleteTransaction(id);
    if (editingId === id) {
      handleCancelEdit();
    }
  }

  function handleSaveEdit() {
    updateTransaction({
      id: editingId,
      description,
      debit: parseFloat(debit) || 0,
      credit: parseFloat(credit) || 0,
      day,
      isTithe,
    });
    handleCancelEdit();
  }

  function handleCancelEdit() {
    setEditingId(null);
    setDescription('');
    setDebit('');
    setCredit('');
    setDay('');
    setIsTithe(false);
  }

  function handleAddTransaction() {
    addTransaction({
      description,
      debit: parseFloat(debit) || 0,
      credit: parseFloat(credit) || 0,
      day,
      isTithe,
    });
    setDescription('');
    setDebit('');
    setCredit('');
    setDay('');
    setIsTithe(false);
  }

  function handleImportOFX(e) {
    importOFX(e);
  }

  return (
    <div>
      <Navigation
        title={`${monthName} ${selectedYear}`}
        onBack={() => navigate(`/month/${prevMonth}`)}
        onNext={() => navigate(`/month/${nextMonth}`)}
      />
      <div className="main-content">
        <div className="container">
          <button className="btn btn-nav" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>
            Início
          </button>
          <div className="monthly-layout">
            <div className="main-column">
              <Card id="card-lancamento">
                <span className="card-title">{editingId ? 'Editar lançamento' : 'Fazer lançamento'}</span>
                <InputField label="Descrição" id="description" value={description} onChange={(e) => setDescription(e.target.value)} icon="description" placeholder="Descrição" />
                {editingId ? (
                  parseFloat(debit) > 0 ? (
                    <InputField label="Débito" id="debit" type="number" value={debit} onChange={(e) => setDebit(e.target.value)} icon="arrow_downward" placeholder="Débito" />
                  ) : (
                    <InputField label="Crédito" id="credit" type="number" value={credit} onChange={(e) => setCredit(e.target.value)} icon="arrow_upward" placeholder="Crédito" />
                  )
                ) : (
                  <div>
                    <InputField label="Débito" id="debit" type="number" value={debit} onChange={(e) => setDebit(e.target.value)} icon="arrow_downward" placeholder="Débito" />
                    <InputField label="Crédito" id="credit" type="number" value={credit} onChange={(e) => setCredit(e.target.value)} icon="arrow_upward" placeholder="Crédito" />
                  </div>
                )}
                <div style={{ paddingLeft: '0', marginBottom: '1.5rem' }}>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={isTithe} onChange={(e) => setIsTithe(e.target.checked)} />
                    <span>É dízimo?</span>
                  </label>
                </div>
                <InputField label="Dia" id="day" type="number" value={day} onChange={(e) => setDay(e.target.value)} icon="calendar_today" placeholder="Dia" min="1" max="31" />
                <div className="add-container">
                  {editingId ? (
                    <div>
                      <button className="btn" onClick={handleSaveEdit}>Salvar</button>
                      <button className="btn red" onClick={handleCancelEdit}>Cancelar</button>
                    </div>
                  ) : (
                    <div>
                      <button className="btn" onClick={handleAddTransaction}>Adicionar</button>
                      <label className="btn success">
                        Importar Extrato
                        <input type="file" accept=".ofx" onChange={handleImportOFX} />
                      </label>
                    </div>
                  )}
                </div>
              </Card>
              <div id="dataCards">
                {(() => {
                  const seen = new Set();
                  return transactionsWithBalance.filter(t => {
                    // Considera id, FITID, descrição, valor, dia, crédito e débito para garantir unicidade
                    const key = `${t.id ?? ''}|${t.FITID ?? ''}|${t.description ?? ''}|${t.day ?? ''}|${t.credit ?? ''}|${t.debit ?? ''}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  }).map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      runningBalance={transaction.runningBalance}
                      onEdit={() => handleEditTransaction(transaction)}
                      onDelete={() => handleDeleteTransaction(transaction.id)}
                    />
                  ));
                })()}
              </div>
            </div>
            <div className="sidebar-column">
              <Card>
                <span className="card-title">Saldo Inicial</span>
                <InputField label="Saldo Inicial do Período" id="initialBalance" type="number" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} icon="account_balance_wallet" placeholder="Saldo Inicial" />
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
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}