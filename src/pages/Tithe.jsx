import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card } from '../components';
import { monthsPT, monthsLowercase } from '../utils/helpers';

export default function Tithe() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();

  const [monthlyTithes, setMonthlyTithes] = useState({});
  const [yearTotal, setYearTotal] = useState('0.00');

  // Load data from Firebase
  useEffect(() => {
    if (!user) return;

    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const userData = snapshot.val() || {};
      const yearData = userData[selectedYear] || {};
      const tithes = {};
      let total = 0;

      monthsLowercase.forEach((month, index) => {
        const monthData = yearData[month];
        const tithe = monthData?.tithe || '0.00';
        tithes[monthsPT[index]] = tithe;
        total += parseFloat(tithe) || 0;
      });

      setMonthlyTithes(tithes);
      setYearTotal(total.toFixed(2));
    });

    return () => unsubscribe();
  }, [user, selectedYear]);

  return (
    <>
      <Navigation
        title={`Dízimo ${selectedYear}`}
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <div className="main-content">
        <div className="container">
          <Card>
            <div style={{ textAlign: 'center' }}>
              <span className="card-title">Total Anual de Dízimo</span>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                R$ {yearTotal}
              </p>
              <p className="grey-text" style={{ marginTop: '1rem' }}>
                Lembre-se de lançar a saída (débito) correspondente em cada mês para que seu saldo reflita a doação.
              </p>
            </div>
          </Card>

          <Card>
            <span className="card-title">Valores Mensais</span>
            <div className="value-grid">
              {monthsPT.map((month) => (
                <div className="value-item" key={month}>
                  <span className="value-title">{month}</span>
                  <span className="value-amount">{monthlyTithes[month] || '0.00'}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
