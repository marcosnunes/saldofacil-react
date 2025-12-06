import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card } from '../components';
import { monthsLowercase, monthsPT } from '../utils/helpers';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { BarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';


ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

export default function Charts() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();

  const [creditData, setCreditData] = useState(Array(12).fill(0));
  const [debitData, setDebitData] = useState(Array(12).fill(0));
  const [balanceData, setBalanceData] = useState(Array(12).fill(0));
  const [yearlyEvolutionData, setYearlyEvolutionData] = useState([]);

  // Load data from Firebase
  useEffect(() => {
    if (!user || !selectedYear) return;

    const userYearRef = ref(database, `users/${user.uid}/${selectedYear}`);
    const unsubscribe = onValue(userYearRef, (snapshot) => {
      const yearData = snapshot.val() || {};
      
      const credits = Array(12).fill(0);
      const debits = Array(12).fill(0);
      const balances = Array(12).fill(0);

      monthsLowercase.forEach((month, index) => {
        const monthData = yearData[month];
        if (monthData) {
          credits[index] = parseFloat(monthData.totalCredit) || 0;
          debits[index] = parseFloat(monthData.totalDebit) || 0;
          balances[index] = parseFloat(monthData.finalBalance) || 0;
        }
      });

      setCreditData(credits);
      setDebitData(debits);
      setBalanceData(balances);
    });

    // Fetch yearly evolution data
    const years = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020 to 2030
    const promises = years.map(year => {
      return new Promise(resolve => {
        const monthKey = 'dezembro';
        const yearRef = ref(database, `users/${user.uid}/${year}/${monthKey}`);
        onValue(yearRef, (snapshot) => {
          const data = snapshot.val();
          resolve({
            year: year.toString(),
            balance: data?.finalBalance ? parseFloat(data.finalBalance) : 0,
          });
        }, { onlyOnce: true });
      });
    });

    Promise.all(promises).then(results => {
      setYearlyEvolutionData(results.filter(item => item.balance > 0));
    });


    return () => unsubscribe();
  }, [user, selectedYear]);

  // Quadratic regression for trend line
  const calculateTrendLine = () => {
    const x = Array.from({ length: 12 }, (_, i) => i);
    const y = balanceData;

    let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
    let sumY = 0, sumXY = 0, sumX2Y = 0;

    for (let i = 0; i < 12; i++) {
      sumX += x[i];
      sumX2 += x[i] ** 2;
      sumX3 += x[i] ** 3;
      sumX4 += x[i] ** 4;
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2Y += x[i] ** 2 * y[i];
    }

    const A = [
      [12, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4]
    ];
    const B = [sumY, sumXY, sumX2Y];

    const det = (m) => 
      m[0][0] * m[1][1] * m[2][2] + m[0][1] * m[1][2] * m[2][0] + m[0][2] * m[1][0] * m[2][1]
      - m[0][2] * m[1][1] * m[2][0] - m[0][0] * m[1][2] * m[2][1] - m[0][1] * m[1][0] * m[2][2];

    const replaceCol = (m, col, vec) => m.map((row, i) => row.map((val, j) => j === col ? vec[i] : val));

    const detA = det(A);
    if (detA === 0) return Array(12).fill(0);

    const c = det(replaceCol(A, 0, B)) / detA;
    const b = det(replaceCol(A, 1, B)) / detA;
    const a = det(replaceCol(A, 2, B)) / detA;

    return x.map(xi => a * xi ** 2 + b * xi + c);
  };

  const trendLine = calculateTrendLine();

  const creditDebitChartData = {
    labels: monthsPT.map(m => m.toLowerCase()),
    datasets: [
      {
        label: 'Crédito',
        data: creditData,
        backgroundColor: 'rgba(45, 206, 137, 0.8)',
      },
      {
        label: 'Débito',
        data: debitData,
        backgroundColor: 'rgba(245, 54, 92, 0.8)',
      }
    ]
  };

  const balanceChartData = {
    labels: monthsPT.map(m => m.toLowerCase()),
    datasets: [
      {
        label: 'Saldo Mensal',
        data: balanceData,
        borderColor: 'rgba(17, 205, 239, 1)',
        backgroundColor: 'rgba(17, 205, 239, 0.2)',
        fill: true,
        tension: 0.3,
      }
    ]
  };

  const trendChartData = {
    labels: monthsPT.map(m => m.toLowerCase()),
    datasets: [
      {
        label: 'Saldo Mensal',
        data: balanceData,
        borderColor: 'rgba(17, 205, 239, 1)',
        backgroundColor: 'rgba(17, 205, 239, 0.1)',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Linha de Tendência',
        data: trendLine,
        borderColor: 'rgba(128, 0, 128, 1)',
        backgroundColor: 'rgba(128, 0, 128, 0.1)',
        fill: false,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Alterado para false
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <>
      <Navigation
        title={`Gráficos ${selectedYear}`}
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <div className="main-content">
        <div className="container">
          <Card>
            <span className="card-title">Evolução Anual do Saldo (Dezembro)</span>
            <div style={{ position: 'relative', height: '400px', marginTop: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                  <RechartsLegend />
                  <RechartsBar dataKey="balance" fill="var(--color-primary)" name="Saldo Final" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <span className="card-title">Créditos vs. Débitos Mensais</span>
            <div style={{ position: 'relative', height: '400px' }}>
              <Bar data={creditDebitChartData} options={chartOptions} />
            </div>
          </Card>

          <Card>
            <span className="card-title">Evolução do Saldo Final Mensal</span>
            <div style={{ position: 'relative', height: '400px' }}>
              <Line data={balanceChartData} options={chartOptions} />
            </div>
          </Card>

          <Card>
            <span className="card-title">Linha de Tendência Anual</span>
            <div style={{ position: 'relative', height: '400px' }}>
              <Line data={trendChartData} options={chartOptions} />
            </div>
          </Card>

          const handleExportPDF = () => {
    const isAndroid = window.android && typeof window.android.print === 'function';
    if (isAndroid) {
      window.android.print();
    } else {
      window.print();
    }
  };

  return (
    <>
      <Navigation
// ... (o resto do código do componente)
          <Card id="exportar_dados">
            <span className="card-title">Exportar Dados</span>
            <p style={{ marginBottom: '1.5rem' }}>
              Exporte a visualização atual da página para PDF.
            </p>
            <button className="btn" onClick={handleExportPDF}>
              <i className="material-icons" style={{ marginRight: '0.5rem' }}>picture_as_pdf</i>
              Exportar para PDF
            </button>
          </Card>
        </div>
      </div>
    </>
  );
        </div>
      </div>
    </>
  );
}
