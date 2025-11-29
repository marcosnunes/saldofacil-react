
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, InputField, SelectField } from '../components';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function Tools() {
  const navigate = useNavigate();

  // Investment Calculator State
  const [initialAmount, setInitialAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [duration, setDuration] = useState('');
  const [investmentResult, setInvestmentResult] = useState('R$ 0,00');
  const [poupancaRate, setPoupancaRate] = useState('Carregando...');
  const [selicRate, setSelicRate] = useState('Carregando...');

  // Currency Converter State
  const [amountToConvert, setAmountToConvert] = useState('');
  const [fromCurrency, setFromCurrency] = useState('BRL');
  const [toCurrency, setToCurrency] = useState('USD');
  const [convertedResult, setConvertedResult] = useState('R$ 0,00');

  const currencyOptions = [
    { value: 'BRL', label: 'Real Brasileiro (BRL)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'Dólar Americano (USD)' },
    { value: 'GBP', label: 'Libra Esterlina (GBP)' },
  ];

  // Fetch reference rates
  useEffect(() => {
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados/ultimos/1?formato=json')
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) {
          setPoupancaRate(data[0].valor + '% a.m.');
        }
      })
      .catch(() => setPoupancaRate('Indisponível'));

    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json')
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) {
          setSelicRate(data[0].valor + '% a.d.');
        }
      })
      .catch(() => setSelicRate('Indisponível'));
  }, []);

  // Calculate investment
  const handleCalculateInvestment = () => {
    const initial = parseFloat(initialAmount) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const rate = parseFloat(annualRate) || 0;
    const months = parseInt(duration) || 0;

    if (rate <= 0 || months <= 0) {
      alert('Por favor, preencha a taxa de juros e o período do investimento.');
      return;
    }

    const monthlyRate = rate / 100 / 12;
    let total = initial;

    for (let i = 0; i < months; i++) {
      total *= (1 + monthlyRate);
      total += monthly;
    }

    total -= monthly;

    setInvestmentResult('R$ ' + total.toFixed(2).replace('.', ','));
  };

  const formatCurrency = useCallback((amount, currency) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Auto-convert when values change
  useEffect(() => {
    const doConvert = async () => {
      const amount = parseFloat(amountToConvert) || 0;
      if (amount === 0) {
        setConvertedResult(formatCurrency(0, toCurrency));
        return;
      }

      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
        const data = await res.json();
        const rate = data.rates[toCurrency];
        const converted = amount * rate;
        setConvertedResult(formatCurrency(converted, toCurrency));
      } catch (error) {
        console.error('Error converting currency:', error);
      }
    };

    doConvert();
  }, [amountToConvert, fromCurrency, toCurrency, formatCurrency]);

  return (
    <>
      <Navigation
        title="Ferramentas"
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <Box sx={{ py: 4, px: { xs: 1, sm: 2 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Calculadora de Juros Compostos</Typography>
              <Box sx={{ mb: 2 }}>
                <InputField
                  label="Montante Inicial (R$)"
                  id="initialAmount"
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  icon="attach_money"
                  placeholder="Ex: 1000"
                />
                <InputField
                  label="Aporte Mensal (R$)"
                  id="monthlyContribution"
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  icon="savings"
                  placeholder="Ex: 200"
                />
                <InputField
                  label="Taxa de Juros Anual (%)"
                  id="annualRate"
                  type="number"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  icon="trending_up"
                  placeholder="Ex: 10"
                />
                <InputField
                  label="Período (meses)"
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  icon="timer"
                  placeholder="Ex: 120"
                />
              </Box>
              <Button variant="contained" color="primary" fullWidth sx={{ mb: 2 }} onClick={handleCalculateInvestment}>
                Calcular
              </Button>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Resultado do Investimento:</Typography>
                <Typography variant="h5" color="primary" fontWeight={700}>{investmentResult}</Typography>
              </Box>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                <Typography variant="subtitle2" fontWeight={600}>Valores de referência:</Typography>
                <Typography variant="body2">Taxa Poupança (última): <b>{poupancaRate}</b></Typography>
                <Typography variant="body2">Taxa Selic (última): <b>{selicRate}</b></Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Conversor de Moedas</Typography>
              <Box sx={{ mb: 2 }}>
                <InputField
                  label="Valor a Converter"
                  id="amountToConvert"
                  type="number"
                  value={amountToConvert}
                  onChange={(e) => setAmountToConvert(e.target.value)}
                  icon="paid"
                  placeholder="Ex: 100"
                />
                <SelectField
                  label="De:"
                  id="fromCurrency"
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  options={currencyOptions}
                />
                <SelectField
                  label="Para:"
                  id="toCurrency"
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  options={currencyOptions}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Resultado da Conversão:</Typography>
                <Typography variant="h5" color="primary" fontWeight={700}>{convertedResult}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
