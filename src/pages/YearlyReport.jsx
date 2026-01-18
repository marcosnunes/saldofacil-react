import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from '../components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const colors = {
  primary: '#5e72e4',
  success: '#2dce89',
  danger: '#f5365c',
  info: '#11cdef',
  warning: '#fb6340',
  secondary: '#8898aa',
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
  },
  legend: {
    wrapperStyle: {
      paddingTop: '1rem',
      color: '#525f7f',
    },
  },
};

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

    const fetchYearlyData = async () => {
      try {
        // Buscar dados do ano atual e alguns anos anteriores
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 15 }, (_, i) => currentYear - 14 + i);
        console.log('[YearlyReport] Buscando dados anuais para anos:', years);
        
        const promises = years.map(async (year) => {
          try {
            const monthKey = 'dezembro';
            const yearRef = ref(database, `users/${user.uid}/${year}/${monthKey}`);
            const snapshot = await get(yearRef);
            const data = snapshot.val();
            console.log(`[YearlyReport] ${year}/dezembro:`, data);
            return {
              year: year.toString(),
              balance: data?.finalBalance ? parseFloat(data.finalBalance) : 0,
            };
          } catch (error) {
            console.error(`Erro ao buscar ${year}:`, error.message);
            return {
              year: year.toString(),
              balance: 0,
            };
          }
        });

        const results = await Promise.all(promises);
        console.log('[YearlyReport] Resultados brutos:', results);
        
        // Mostrar todos os resultados, inclusive zeros, para debug
        const filtered = results.filter(item => item.balance > 0);
        console.log('[YearlyReport] Resultados filtrados (balance > 0):', filtered);
        console.log('[YearlyReport] Total de anos com dados:', filtered.length);
        
        setYearlyData(filtered.length > 0 ? filtered : results); // Show all if no data with balance > 0
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar dados anuais:', error);
        setLoading(false);
      }
    };

    fetchYearlyData();

  }, [user]);

  return (
    <>
      <Navigation
        title="Relatório Anual de Saldos"
        onBack={() => navigate('/')}
      />

      <div className="main-content">
        <div className="container">
          {/* Chart Header */}
          <div className="chart-pdf-header">
            <div className="chart-header-content">
              <h2>📊 Evolução de Saldos Anuais</h2>
              <p className="chart-subtitle">Comparativo do saldo final de dezembro ao longo dos anos</p>
              <span className="chart-date">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* Bar Chart Card */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Evolução do Saldo Final (Dezembro)</h3>
                <p className="chart-subtitle">Saldos finais de dezembro por ano</p>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#525f7f' }}>
                <p>Carregando dados...</p>
              </div>
            ) : yearlyData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#525f7f' }}>
                <p>Nenhum dado disponível</p>
              </div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={yearlyData} {...chartConfig}>
                    <CartesianGrid {...chartConfig.cartesianGrid} />
                    <XAxis 
                      dataKey="year"
                      stroke="#525f7f"
                      style={{ fontSize: '0.875rem' }}
                    />
                    <YAxis 
                      stroke="#525f7f"
                      style={{ fontSize: '0.875rem' }}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      {...chartConfig.tooltip}
                      formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Saldo']}
                    />
                    <Legend {...chartConfig.legend} />
                    <Bar 
                      dataKey="balance" 
                      fill={colors.primary}
                      name="Saldo Final"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Yearly Values Grid */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">💰 Saldos Finais por Ano</h3>
                <p className="chart-subtitle">Detalhes com ranking e variação de crescimento</p>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#525f7f' }}>
                <p>Carregando dados...</p>
              </div>
            ) : yearlyData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#525f7f' }}>
                <p>Nenhum dado disponível</p>
              </div>
            ) : (
              <div className="yearly-value-grid">
                {yearlyData.map((item, index) => {
                  const prevYear = index > 0 ? yearlyData[index - 1].balance : item.balance;
                  const percentChange = index > 0 
                    ? ((item.balance - prevYear) / prevYear * 100).toFixed(2)
                    : 0;
                  const isGrowth = percentChange >= 0;

                  return (
                    <div className="yearly-value-item" key={item.year}>
                      <div className="yearly-value-header">
                        <span className="yearly-value-year">{item.year}</span>
                        <span className={`yearly-value-index ${index === 0 ? 'first' : index === 1 ? 'second' : 'other'}`}>
                          #{index + 1}
                        </span>
                      </div>
                      <div className="yearly-value-amount">
                        R$ {item.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {index > 0 && (
                        <div className={`yearly-value-change ${isGrowth ? 'positive' : 'negative'}`}>
                          <span className="change-arrow">{isGrowth ? '📈' : '📉'}</span>
                          <span className="change-percent">{Math.abs(percentChange)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
