import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card, SelectField } from '../components';
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
    if (!user || !selectedYear) return;

    const fetchData = async () => {
      try {
        // 1. Monthly transactions (credits/debits)
        const userYearRef = ref(database, `users/${user.uid}/${selectedYear}`);
        const userSnapshot = await get(userYearRef);
        const yearData = userSnapshot.val() || {};

        // 2. Credit card data
        const ccRef = ref(database, `creditCardData/${user.uid}/${selectedYear}`);
        const ccSnapshot = await get(ccRef);
        const ccData = ccSnapshot.val() || {};

        // 3. Tithes data
        const titheRef = ref(database, `tithes/${user.uid}/${selectedYear}`);
        const titheSnapshot = await get(titheRef);
        const titheData = titheSnapshot.val() || {};

        // 4. Investments data
        const invRef = ref(database, `investmentsData/${user.uid}/${selectedYear}`);
        const invSnapshot = await get(invRef);
        const invData = invSnapshot.val() || {};

        // --- Process and Aggregate Data ---
        
        let totalCredit = 0;
        let totalDebit = 0;
        let totalCC = 0;
        const aggregatedLaunches = {};

        // Process monthly transactions
        Object.values(yearData).forEach(monthData => {
          if (!monthData) return;
          
          totalCredit += Number(monthData.totalCredit || 0);
          totalDebit += Number(monthData.totalDebit || 0);

          const allTransactions = [
            ...Object.values(monthData.transactions || {}),
            ...Object.values(monthData.credits || {}),
            ...Object.values(monthData.debits || {})
          ];

          allTransactions.forEach(tx => {
            if (!tx || tx.isInvestment) return; // Investments are handled separately
            const desc = (tx.description || tx.desc || 'Lançamento sem descrição').trim();
            const amount = (parseFloat(tx.credit) || 0) - (parseFloat(tx.debit) || 0);
            if (amount !== 0) {
              aggregatedLaunches[desc] = (aggregatedLaunches[desc] || 0) + amount;
            }
          });
        });

        // Process credit card transactions
        Object.values(ccData).forEach(item => {
          const value = parseFloat(item.value) || 0;
          totalCC += value;
          const desc = `[Cartão] ${(item.description || 'Compra sem descrição').split(' (')[0]}`.trim();
          aggregatedLaunches[desc] = (aggregatedLaunches[desc] || 0) - value;
        });

        // Process tithes
        Object.values(titheData).forEach(item => {
          const value = parseFloat(item.value) || 0;
          totalDebit += value;
          const desc = `[Dízimo] ${item.description || 'Dízimo'}`.trim();
          aggregatedLaunches[desc] = (aggregatedLaunches[desc] || 0) - value;
        });

        // Process investments
        Object.values(invData).forEach(item => {
          const credit = parseFloat(item.credit) || 0; // Resgate
          const debit = parseFloat(item.debit) || 0;   // Aplicação
          const value = credit - debit;
          if (value === 0) return;

          totalCredit += credit;
          totalDebit += debit;
          const desc = `[Invest] ${item.description || 'Investimento'}`.trim();
          aggregatedLaunches[desc] = (aggregatedLaunches[desc] || 0) + value;
        });

        // --- Update State ---
        setCreditTotal(totalCredit);
        setCreditCardTotal(totalCC);
        setDebitTotal(totalDebit + totalCC); // Total debit includes CC expenses
        setBalance(totalCredit - (totalDebit + totalCC));
        setPercentage(totalCredit > 0 ? ((totalDebit + totalCC) / totalCredit) * 100 : 0);
        setAnnualLaunches(aggregatedLaunches);

      } catch (error) {
        console.error("Erro ao buscar dados para o relatório anual:", error);
      }
    };

    fetchData();
    
    // Setup listeners for real-time updates if needed, or just fetch once.
    // For simplicity, this example fetches data once. If you need real-time,
    // you would use onValue and handle state updates carefully.

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

      <div className="main-content">
        <div className="container">
          <Card id="opcoes_relatorio">
            <span className="card-title">Opções do Relatório</span>
            <SelectField
              label="Converter Moeda"
              id="currencySelect"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              options={currencyOptions}
              //icon="monetization_on"
            />
          </Card>

          <Card>
            <span className="card-title">Totais do Ano</span>
            <div className="card-balance-content">
              <div className="card-content">
                <span className="card-title">Total Crédito</span>
                <p className="green-text">{formatCurrency(creditTotal * exchangeRate, selectedCurrency)}</p>
              </div>
              <div className="card-content">
                <span className="card-title">Total Débito</span>
                <p className="orange-text">{formatCurrency(debitTotal * exchangeRate, selectedCurrency)}</p>
              </div>
              <div className="card-content">
                <span className="card-title">Cartão de Crédito</span>
                <p className="orange-text">{formatCurrency(creditCardTotal * exchangeRate, selectedCurrency)}</p>
              </div>
              <div className="card-content">
                <span className="card-title">Balanço</span>
                <p>{formatCurrency(balance * exchangeRate, selectedCurrency)}</p>
                <p>{percentage.toFixed(2)}%</p>
              </div>
            </div>
            <div className="card-action">
              <button className="btn" onClick={() => window.print()}>Exportar para PDF</button>
              <button className="btn success" onClick={() => navigate(`/ai-reports?year=${selectedYear}`)}>Relatórios com IA</button>
            </div>
          </Card>

          <Card>
            <span className="card-title">Extrato Anual Detalhado</span>
            <div id="launchDataContainer">
              {sortedLaunches.length === 0 ? (
                <p>Nenhum lançamento encontrado para este ano.</p>
              ) : (
                <div className="report-list">
                  {sortedLaunches.map(desc => {
                    const total = annualLaunches[desc];
                    return (
                      <div className="report-item" key={desc}>
                        <span className="description">{desc}</span>
                        <span className={`total ${total >= 0 ? 'positive' : 'negative'}`}>
                          {formatCurrency(total * exchangeRate, selectedCurrency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
