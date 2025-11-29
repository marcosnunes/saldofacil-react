import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
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
              icon="monetization_on"
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
