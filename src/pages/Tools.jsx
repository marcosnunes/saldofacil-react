import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Card, InputField, SelectField } from '../components';

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
    // Fetch Poupança rate from BCB
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados/ultimos/1?formato=json')
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) {
          setPoupancaRate(parseFloat(data[0].valor).toFixed(4) + '% a.m.');
        } else {
          setPoupancaRate('Indisponível');
        }
      })
      .catch(error => {
        console.error('Erro ao buscar taxa Poupança:', error);
        setPoupancaRate('Indisponível');
      });

    // Fetch Selic rate from BCB
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json')
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) {
          setSelicRate(parseFloat(data[0].valor).toFixed(4) + '% a.d.');
        } else {
          setSelicRate('Indisponível');
        }
      })
      .catch(error => {
        console.error('Erro ao buscar taxa Selic:', error);
        setSelicRate('Indisponível');
      });
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
        // Usar api.exchangerate.host como alternativa (gratuita e confiável)
        const res = await fetch(`https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`);
        const data = await res.json();
        
        if (data.success === false || !data.rates || !data.rates[toCurrency]) {
          console.error('Erro na conversão de moedas:', data);
          setConvertedResult('Erro ao converter');
          return;
        }

        const rate = data.rates[toCurrency];
        const converted = amount * rate;
        setConvertedResult(formatCurrency(converted, toCurrency));
      } catch (error) {
        console.error('Erro ao converter moeda:', error);
        setConvertedResult('Erro ao conectar');
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

      <div className="main-content">
        <div className="container">
          {/* Investment Calculator */}
          <Card>
            <span className="card-title">Calculadora de Juros Compostos</span>
            
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

            <button className="btn" onClick={handleCalculateInvestment}>Calcular</button>

            <div style={{ marginTop: '2rem' }}>
              <h5>Resultado do Investimento:</h5>
              <p>
                Total acumulado: <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                  {investmentResult}
                </strong>
              </p>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
              <h6>Valores de referência:</h6>
              <p>Taxa Poupança (última): <strong>{poupancaRate}</strong></p>
              <p>Taxa Selic (última): <strong>{selicRate}</strong></p>
            </div>
          </Card>

          {/* Currency Converter */}
          <Card>
            <span className="card-title">Conversor de Moedas</span>
            
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

            <div style={{ marginTop: '2rem' }}>
              <h5>Resultado da Conversão:</h5>
              <p>
                <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                  {convertedResult}
                </strong>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
