import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigation, Card } from '../components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function YearlyReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [yearlyData, setYearlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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
      setYearlyData(results.filter(item => item.balance > 0)); // Only show years with data
      setLoading(false);
    });

  }, [user]);

  // Cores profissionais
  const colors = {
    primary: '#5e72e4',
    info: '#11cdef',
  };

  const chartConfig = {
    margin: { top: 20, right: 20, left: -5, bottom: 0 },
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
      fontSize: 13,
    },
  };

  const formatCurrency = (value) => `R$ ${value.toFixed(2)}`;

  return (
    <>
      <Navigation
        title="Relatório Anual de Saldos"
        onBack={() => navigate('/')}
      />

      <div className="main-content charts-page">
        <div className="container">
          {/* Header */}
          <div className="chart-pdf-header">
            <div className="chart-header-content">
              <h2 className="chart-header-title">📅 Histórico Anual de Saldos</h2>
              <p className="chart-header-subtitle">Evolução do saldo final de dezembro por ano</p>
              <p className="chart-header-date">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <Card className="chart-card">
            <div className="chart-header">
              <span className="chart-title">📊 Evolução do Saldo Final (Dezembro)</span>
              <span className="chart-subtitle">Comparativo de saldos finais por ano</span>
            </div>
            {loading ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#8898aa' }}>Carregando dados...</p>
            ) : (
              <div className="chart-container" style={{ height: '400px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData} margin={chartConfig.margin}>
                    <CartesianGrid {...chartConfig.cartesianGrid} />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: colors.info, fontSize: 12 }}
                      axisLine={{ stroke: '#e0e6ed' }}
                    />
                    <YAxis 
                      tick={{ fill: colors.info, fontSize: 12 }}
                      axisLine={{ stroke: '#e0e6ed' }}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      {...chartConfig.tooltip}
                    />
                    <Legend {...chartConfig.legend} />
                    <Bar dataKey="balance" fill={colors.primary} name="Saldo Final" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="chart-card">
            <div className="chart-header">
              <span className="chart-title">💰 Saldos Finais de Dezembro por Ano</span>
              <span className="chart-subtitle">Detalhamento de valores consolidados</span>
            </div>
            {loading ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#8898aa' }}>Carregando dados...</p>
            ) : yearlyData.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#8898aa' }}>Sem dados disponíveis para exibir</p>
            ) : (
              <div className="yearly-value-grid">
                {yearlyData.map(({ year, balance }, index) => (
                  <div className="yearly-value-item" key={year}>
                    <div className="yearly-value-header">
                      <span className="yearly-value-year">{year}</span>
                      <span className="yearly-value-index">{index + 1}º</span>
                    </div>
                    <div className="yearly-value-content">
                      <span className="yearly-value-amount">{formatCurrency(balance)}</span>
                      {yearlyData.length > 1 && index > 0 && (
                        <span className="yearly-value-change">
                          {balance > yearlyData[index - 1].balance ? '↑' : '↓'} 
                          {Math.abs((((balance - yearlyData[index - 1].balance) / yearlyData[index - 1].balance) * 100)).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
