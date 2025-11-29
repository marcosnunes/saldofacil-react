import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set, onValue, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card, InputField, SelectField } from '../components';
import { uuidv4, monthsPT } from '../utils/helpers';

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
  const [editingId, setEditingId] = useState(null);

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

    // Clear form

    import { Box, Grid, Paper, Typography, Button } from '@mui/material';
    // ...existing code...

      return (
        <>
          <Navigation
            title={`Investimentos ${selectedYear}`}
            onBack={() => navigate(-1)}
            onNext={() => navigate(-1)}
          />
          <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', py: 4 }}>
            <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Movimentar Investimentos</Typography>
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
                      icon="date_range"
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
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Aportes Mensais</Typography>
                    <Grid container spacing={1}>
                      {monthsPT.map((month, index) => (
                        <Grid item xs={4} key={month}>
                          <Typography variant="body2" fontWeight={600}>{month.substring(0, 3)}</Typography>
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
            </Box>
          </Box>
        </>
      );
    }
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
