
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, SelectField } from '../components';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { monthsLowercase, formatCurrency } from '../utils/helpers';

export default function Report() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();

  const [creditTotal, setCreditTotal] = useState(0);
  const [debitTotal, setDebitTotal] = useState(0);
  const [creditCardTotal, setCreditCardTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [annualLaunches, setAnnualLaunches] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState('BRL');
  const [exchangeRate, setExchangeRate] = useState(1);

  // Load data from Firebase
  useEffect(() => {
    if (!user) return;

    let totalCredit = 0;
    let totalDebit = 0;
    let ccTotal = 0;
    const launches = {};

    // Load monthly data
    const userRef = ref(database, `users/${user.uid}`);
    const creditCardRef = ref(database, `creditCardData/${user.uid}/${selectedYear}`);

    const unsubscribeUser = onValue(userRef, (snapshot) => {
      const userData = snapshot.val() || {};
      
      totalCredit = 0;
      totalDebit = 0;

      monthsLowercase.forEach(month => {
        const monthData = userData[`${month}-${selectedYear}`];
        if (monthData) {
          totalCredit += Number(monthData.totalCredit || 0);
          totalDebit += Number(monthData.totalDebit || 0);

          if (monthData.transactions) {
            monthData.transactions.forEach(transaction => {
              const desc = transaction.description;
              const amount = (parseFloat(transaction.credit) || 0) - (parseFloat(transaction.debit) || 0);
              launches[desc] = (launches[desc] || 0) + amount;
            });
          }
        }
      });

      setCreditTotal(totalCredit);
      setDebitTotal(totalDebit + ccTotal);
      setBalance(totalCredit - (totalDebit + ccTotal));
      setPercentage(totalCredit > 0 ? ((totalDebit + ccTotal) / totalCredit) * 100 : 0);
      setAnnualLaunches({ ...launches });
    });

    const unsubscribeCC = onValue(creditCardRef, (snapshot) => {
      const ccData = snapshot.val() || {};
      ccTotal = 0;

      Object.values(ccData).forEach(item => {
        const desc = (item.description || '').split(' (')[0];
        const amount = -(parseFloat(item.value) || 0);
        launches[desc] = (launches[desc] || 0) + amount;
        ccTotal += parseFloat(item.value) || 0;
      });

      setCreditCardTotal(ccTotal);
      setDebitTotal(prev => prev + ccTotal);
      setBalance(totalCredit - (totalDebit + ccTotal));
      setPercentage(totalCredit > 0 ? ((totalDebit + ccTotal) / totalCredit) * 100 : 0);
      setAnnualLaunches({ ...launches });
    });

    return () => {
      unsubscribeUser();
      unsubscribeCC();
    };
  }, [user, selectedYear]);

  // Currency conversion
  useEffect(() => {
    if (selectedCurrency === 'BRL') {
      setExchangeRate(1);
      return;
    }

    fetch(`https://open.er-api.com/v6/latest/BRL`)
      .then(res => res.json())
      .then(data => {
        setExchangeRate(data.rates[selectedCurrency] || 1);
      })
      .catch(console.error);
  }, [selectedCurrency]);

  const currencyOptions = [
    { value: 'BRL', label: 'Real (R$)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'USD', label: 'Dólar ($)' },
    { value: 'GBP', label: 'Libra Esterlina (£)' },
  ];

  const sortedLaunches = Object.keys(annualLaunches).sort();

  return (
    <>
      <Navigation
        title={`Relatório ${selectedYear}`}
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <Box sx={{ py: 4, px: { xs: 1, sm: 2 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Opções do Relatório</Typography>
              <SelectField
                label="Converter Moeda"
                id="currencySelect"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                options={currencyOptions}
                icon="monetization_on"
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Totais do Ano</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight={600}>Total Crédito</Typography>
                  <Typography variant="h6" color="success.main" fontWeight={700}>{formatCurrency(creditTotal * exchangeRate, selectedCurrency)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight={600}>Total Débito</Typography>
                  <Typography variant="h6" color="warning.main" fontWeight={700}>{formatCurrency(debitTotal * exchangeRate, selectedCurrency)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight={600}>Cartão de Crédito</Typography>
                  <Typography variant="h6" color="warning.main" fontWeight={700}>{formatCurrency(creditCardTotal * exchangeRate, selectedCurrency)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight={600}>Balanço</Typography>
                  <Typography variant="h6" fontWeight={700}>{formatCurrency(balance * exchangeRate, selectedCurrency)}</Typography>
                  <Typography variant="body2" color="text.secondary">{percentage.toFixed(2)}%</Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={() => window.print()}>
                  Exportar para PDF
                </Button>
                <Button variant="contained" color="success" onClick={() => navigate(`/ai-reports?year=${selectedYear}`)}>
                  Relatórios com IA
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Extrato Anual Detalhado</Typography>
              {sortedLaunches.length === 0 ? (
                <Typography variant="body2">Nenhum lançamento encontrado para este ano.</Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {sortedLaunches.map(desc => {
                    const total = annualLaunches[desc];
                    return (
                      <Box key={desc} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
                        <Typography variant="body2">{desc}</Typography>
                        <Typography variant="body2" color={total >= 0 ? 'success.main' : 'error.main'} fontWeight={700}>
                          {formatCurrency(total * exchangeRate, selectedCurrency)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
