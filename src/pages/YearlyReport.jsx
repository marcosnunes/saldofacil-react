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

  return (
    <>
      <Navigation
        title="Relatório Anual de Saldos"
        onBack={() => navigate('/tools')}
      />

      <div className="main-content">
        <div className="container">
          <Card>
            <span className="card-title">Evolução do Saldo Final (Dezembro)</span>
            {loading ? (
              <p>Carregando dados...</p>
            ) : (
              <div style={{ height: '400px', marginTop: '2rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="balance" fill="var(--color-primary)" name="Saldo Final" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card>
            <span className="card-title">Saldos Finais de Dezembro por Ano</span>
            {loading ? (
              <p>Carregando dados...</p>
            ) : (
              <div className="value-grid">
                {yearlyData.map(({ year, balance }) => (
                  <div className="value-item" key={year}>
                    <span className="value-title">{year}</span>
                    <span className="value-amount">R$ {balance.toFixed(2)}</span>
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
