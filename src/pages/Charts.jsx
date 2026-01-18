import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card } from '../components';
import { monthsLowercase, monthsPT } from '../utils/helpers';
import { exportElementAsPDF } from '../utils/export';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';

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
    const years = Array.from({ length: 11 }, (_, i) => 2020 + i);
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

  // Prepare data for Recharts
  const creditDebitData = monthsPT.map((month, index) => ({
    month: month.toLowerCase(),
    credito: creditData[index],
    debito: debitData[index]
  }));

  const balanceChartData = monthsPT.map((month, index) => ({
    month: month.toLowerCase(),
    saldo: balanceData[index]
  }));

  const trendChartData = monthsPT.map((month, index) => ({
    month: month.toLowerCase(),
    saldo: balanceData[index],
    tendencia: trendLine[index]
  }));

  const formatCurrency = (value) => `R$ ${value.toFixed(2)}`;

  // Cores profissionais
  const colors = {
    primary: '#5e72e4',
    success: '#2dce89',
    danger: '#f5365c',
    info: '#11cdef',
    warning: '#fb6340',
    secondary: '#8898aa',
  };

  const chartConfig = {
    margin: { top: 20, right: 40, left: 20, bottom: 30 },
    cartesianGrid: {
      stroke: '#e0e6ed',
      strokeDasharray: '4 2',
      vertical: false,
    },
    tooltip: {
      contentStyle: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #e0e6ed',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      labelStyle: { color: '#212529' },
    },
    legend: {
      wrapperStyle: { paddingTop: '20px' },
      iconType: 'line',
      fontSize: 13,
    },
  };

  return (
    <>
      <Navigation
        title={`Gráficos ${selectedYear}`}
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <div id="charts-page" className="main-content charts-page">
        <div className="container">
          {/* Header para PDF */}
          <div className="chart-pdf-header">
            <div className="chart-header-content">
              <h2 className="chart-header-title">📊 Relatório de Gráficos Financeiros</h2>
              <p className="chart-header-subtitle">SaldoFácil - Ano de {selectedYear}</p>
              <p className="chart-header-date">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <Card className="chart-card">
            <div className="chart-header">
              <span className="chart-title">📈 Evolução Anual do Saldo (Dezembro)</span>
              <span className="chart-subtitle">Comparativo de saldos finais por ano</span>
            </div>
            <div className="chart-container" style={{ height: '450px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyEvolutionData} margin={chartConfig.margin}>
                  <CartesianGrid {...chartConfig.cartesianGrid} />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fill: colors.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#e0e6ed' }}
                  />
                  <YAxis 
                    tick={{ fill: colors.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#e0e6ed' }}
                  />
                  <Tooltip 
                    formatter={formatCurrency}
                    {...chartConfig.tooltip}
                  />
                  <Legend {...chartConfig.legend} />
                  <Bar dataKey="balance" fill={colors.info} name="Saldo Final" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="chart-card">
            <div className="chart-header">
              <span className="chart-title">💰 Créditos vs. Débitos Mensais</span>
              <span className="chart-subtitle">Comparação entre receitas e despesas do ano</span>
            </div>
            <div className="chart-container" style={{ height: '450px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditDebitData} margin={chartConfig.margin}>
                  <CartesianGrid {...chartConfig.cartesianGrid} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: colors.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#e0e6ed' }}
                  />
                  <YAxis 
                    tick={{ fill: colors.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#e0e6ed' }}
                  />
                  <Tooltip 
                    formatter={formatCurrency}
                    {...chartConfig.tooltip}
                  />
                  <Legend {...chartConfig.legend} />
                  <Bar dataKey="credito" fill={colors.success} name="Crédito" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="debito" fill={colors.danger} name="Débito" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="chart-card">
            <div className="chart-header">
              <span className="chart-title">📉 Evolução do Saldo Final Mensal</span>
              <span className="chart-subtitle">Tendência do saldo ao longo do ano com preenchimento</span>
            </div>
            <div className="chart-container" style={{ height: '450px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={balanceChartData} margin={chartConfig.margin}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.info} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={colors.info} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartConfig.cartesianGrid} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: colors.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#e0e6ed' }}
                  />
                  <YAxis 
                    tick={{ fill: colors.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#e0e6ed' }}
                  />
                  <Tooltip 
                    formatter={formatCurrency}
                    {...chartConfig.tooltip}
                  />
                  <Legend {...chartConfig.legend} />
                  <Area 
                    type="monotone" 
                    dataKey="saldo" 
                    fill="url(#colorSaldo)" 
                    stroke={colors.info} 
                    strokeWidth={2}
                    name="Saldo Mensal"
                    dot={{ fill: colors.info, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="chart-card">
            <div className="chart-header">
              <span className="chart-title">🎯 Linha de Tendência Anual</span>
              <span className="chart-subtitle">Projeção de padrão financeiro com regressão quadrática</span>
            </div>
            <div className="chart-container" style={{ height: '450px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={chartConfig.margin}>
                  <CartesianGrid {...chartConfig.cartesianGrid} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: colors.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#e0e6ed' }}
                  />
                  <YAxis 
                    tick={{ fill: colors.secondary, fontSize: 12 }}
                    axisLine={{ stroke: '#e0e6ed' }}
                  />
                  <Tooltip 
                    formatter={formatCurrency}
                    {...chartConfig.tooltip}
                  />
                  <Legend {...chartConfig.legend} />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke={colors.info} 
                    strokeWidth={2.5}
                    dot={{ fill: colors.info, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Saldo Mensal"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tendencia" 
                    stroke={colors.warning} 
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Linha de Tendência"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card id="exportar_dados" className="no-print chart-export-card">
            <span className="card-title">📥 Exportar Relatório</span>
            <p style={{ marginBottom: '1.5rem', color: '#8898aa' }}>
              Exporte todos os gráficos e análises para um arquivo PDF profissional. O arquivo incluirá data de geração e branding oficial.
            </p>
            <button 
              className="btn btn-export" 
              onClick={() => exportElementAsPDF('charts-page', `graficos-${selectedYear}`, 'l')}
              style={{
                backgroundColor: '#5e72e4',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#4c63d2';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 16px rgba(94, 114, 228, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#5e72e4';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <i className="material-icons" style={{ fontSize: '20px' }}>picture_as_pdf</i>
              Exportar para PDF (Paisagem)
            </button>
          </Card>
        </div>
      </div>
    </>
  );
}