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

  import { Box, Grid, Paper, Typography, Button } from '@mui/material';
  // ...existing code...

    return (
      <>
        <Navigation
          title={`${monthName} ${selectedYear}`}
          onBack={() => navigate(`/month/${prevMonth}`)}
          onNext={() => navigate(`/month/${nextMonth}`)}
        />
        <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', py: 4 }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{editingId ? 'Editar lançamento' : 'Fazer lançamento'}</Typography>
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
                  <Box sx={{ mb: 2 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={isTithe}
                        onChange={(e) => setIsTithe(e.target.checked)}
                      />
                      <span>É dízimo?</span>
                    </label>
                  </Box>
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
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    {editingId ? (
                      <>
                        <Button variant="contained" color="primary" onClick={handleSaveEdit}>Salvar</Button>
                        <Button variant="outlined" color="error" onClick={handleCancelEdit}>Cancelar</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="contained" color="primary" onClick={handleAddTransaction}>Adicionar</Button>
                        <Button variant="contained" color="success" component="label">
                          Importar Extrato
                          <input type="file" accept=".ofx" hidden onChange={handleImportOFX} />
                        </Button>
                      </>
                    )}
                  </Box>
                </Paper>
                <Box>
                  {transactionsWithBalance.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      runningBalance={transaction.runningBalance}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Saldo Inicial</Typography>
                  <InputField
                    label="Saldo Inicial do Período"
                    id="initialBalance"
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    icon="account_balance_wallet"
                    placeholder="Saldo Inicial"
                  />
                </Paper>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Resultados do Mês</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography>Dízimo: <b>{tithe}</b></Typography>
                    <Typography>Cartão de Crédito: <b>{creditCardBalance}</b></Typography>
                    <Typography>Total Crédito: <b>{totalCredit}</b></Typography>
                    <Typography>Total Débito: <b>{totalDebit}</b></Typography>
                    <Typography>Total Investimentos: <b>{investmentBalance}</b></Typography>
                    <Typography>Balanço: <b>{balance}</b></Typography>
                    <Typography>Débito ÷ Crédito: <b>{percentage}</b></Typography>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', mt: 2 }}>
                      Saldo Final: <span style={{ color: '#1976d2' }}>{finalBalance}</span>
                    </Typography>
                  </Box>
                  <Button variant="contained" color="primary" onClick={() => window.print()} sx={{ mt: 2 }}>
                    Exportar para PDF
                  </Button>
                  <Button variant="contained" color="success" onClick={handleExportExcel} sx={{ mt: 1 }}>
                    Exportar para Excel
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </>
    );
  }
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

      <div className="main-content">
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
