import { useState, useEffect } from 'react';
import { ref, set, onValue, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card, InputField, SelectField } from '../components';

import { Box, Grid, Paper, Typography, Button } from '@mui/material';

export default function Investments() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const [description, setDescription] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [creditValue, setCreditValue] = useState('');
  const [debitValue, setDebitValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState([]);
  const [monthlyBalances, setMonthlyBalances] = useState({});
  const [totalInvested, setTotalInvested] = useState('0.00');
  const [annualRate, setAnnualRate] = useState('');
  const [totalReturn, setTotalReturn] = useState('0.00');
  const [projectedBalance, setProjectedBalance] = useState('0.00');
  const monthOptions = [
    { value: 'Janeiro', label: 'Janeiro' },
    { value: 'Fevereiro', label: 'Fevereiro' },
    { value: 'Março', label: 'Março' },
    { value: 'Abril', label: 'Abril' },
    { value: 'Maio', label: 'Maio' },
    { value: 'Junho', label: 'Junho' },
    { value: 'Julho', label: 'Julho' },
    { value: 'Agosto', label: 'Agosto' },
    { value: 'Setembro', label: 'Setembro' },
    { value: 'Outubro', label: 'Outubro' },
    { value: 'Novembro', label: 'Novembro' },
    { value: 'Dezembro', label: 'Dezembro' }
  ];
  const monthsPT = monthOptions.map(opt => opt.value);
  const monthBalanceIds = monthsPT.map(m => m.toLowerCase());

  // Group data by description
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.description]) acc[item.description] = [];
    acc[item.description].push(item);
    return acc;
  }, {});

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
  }, [data, user, selectedYear, annualRate, monthBalanceIds, monthsPT]);

  // Add item
  const handleAddItem = async () => {
    if (!selectedMonth || !description) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }

    const credit = parseFloat(creditValue) || 0;
    const debit = parseFloat(debitValue) || 0;

    const item = {
      month: `${selectedMonth} ${selectedYear}`,
      description,
      credit,
      debit,
      day: new Date().getDate()
    };

    const itemId = uuidv4();
    const itemRef = ref(database, `investimentsData/${user.uid}/${selectedYear}/${itemId}`);
    await set(itemRef, { ...item, id: itemId });

    setDescription('');
    setDebitValue('');
    setCreditValue('');
    setSelectedMonth('');
  };

  // Edit item
  const handleEdit = (item) => {
    setEditingId(item.id);
    setDescription(item.description);
    setDebitValue(item.debit.toString());
    setCreditValue(item.credit.toString());
    setSelectedMonth(item.month.split(' ')[0]);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingId || !selectedMonth || !description) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }
    const credit = parseFloat(creditValue) || 0;
    const debit = parseFloat(debitValue) || 0;
    const item = {
      month: `${selectedMonth} ${selectedYear}`,
      description,
      credit,
      debit,
      day: new Date().getDate(),
      id: editingId
    };
    const itemRef = ref(database, `investimentsData/${user.uid}/${selectedYear}/${editingId}`);
    await set(itemRef, item);
    setEditingId(null);
    setDescription('');
    setDebitValue('');
    setCreditValue('');
    setSelectedMonth('');
  };

  // Delete item
  const handleDelete = async (id) => {
    const itemRef = ref(database, `investimentsData/${user.uid}/${selectedYear}/${id}`);
    await remove(itemRef);
  };

  // UUID generator (if not imported)
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  return (
    <>
      <Box sx={{ p: { xs: 1, md: 3 } }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Investimentos</Typography>
        <Box sx={{ mb: 3 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Box>
                  <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Adicionar Movimentação</Typography>
                    <SelectField
                      label="Mês"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      options={monthOptions}
                      placeholder="Selecione o Mês"
                      icon="date_range"
                    />
                    <InputField
                      label="Descrição"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      icon="description"
                      placeholder="Ex: Aporte, Resgate, Juros"
                    />
                    <InputField
                      label="Crédito (R$)"
                      value={creditValue}
                      onChange={e => setCreditValue(e.target.value)}
                      icon="add_circle"
                      placeholder="Ex: 1000"
                    />
                    <InputField
                      label="Débito (R$)"
                      value={debitValue}
                      onChange={e => setDebitValue(e.target.value)}
                      icon="remove_circle"
                      placeholder="Ex: 500"
                    />
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      {editingId ? (
                        <>
                          <Button variant="contained" color="primary" onClick={handleSaveEdit}>Salvar</Button>
                          <Button variant="outlined" color="error" onClick={() => {
                            setEditingId(null);
                            setDescription('');
                            setDebitValue('');
                            setCreditValue('');
                            setSelectedMonth('');
                          }}>Cancelar</Button>
                        </>
                      ) : (
                        <Button variant="contained" color="primary" onClick={handleAddItem}>Adicionar Movimentação</Button>
                      )}
                    </Box>
                  </Paper>
                  <Box>
                    {Object.keys(groupedData).map(desc => {
                      const items = groupedData[desc];
                      return (
                        <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }} key={desc}>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>{desc}</Typography>
                          {items.map(item => (
                            <Box key={item.id} sx={{ mb: 1 }}>
                              <Typography variant="body2">Mês: {item.month}</Typography>
                              {item.credit > 0 && <Typography variant="body2">Crédito: R$ {item.credit.toFixed(2)}</Typography>}
                              {item.debit > 0 && <Typography variant="body2">Débito: R$ {item.debit.toFixed(2)}</Typography>}
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button variant="outlined" size="small" onClick={() => handleEdit(item)}>Editar</Button>
                                <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(item.id)}>Excluir</Button>
                              </Box>
                            </Box>
                          ))}
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Aportes Mensais</Typography>
                  <Grid container spacing={1}>
                    {monthOptions.map((opt, index) => (
                      <Grid item xs={4} key={opt.value}>
                        <Typography variant="body2" fontWeight={600}>{opt.value.substring(0, 3)}</Typography>
                        <Typography variant="body2">
                          {monthlyBalances[monthBalanceIds[index]] || '0.00'}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Simular Rendimento</Typography>
                  <InputField
                    label="Taxa de Rendimento Anual (%)"
                    id="rendimentoAnual"
                    type="number"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    icon="trending_up"
                    placeholder="Ex: 10"
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography>Total Aportado: <b>{totalInvested}</b></Typography>
                    <Typography>Rendimento Estimado: <b style={{ color: '#43a047' }}>{totalReturn}</b></Typography>
                    <Typography sx={{ fontWeight: 'bold', mt: 2 }}>Saldo Final Projetado: <span>{projectedBalance}</span></Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
