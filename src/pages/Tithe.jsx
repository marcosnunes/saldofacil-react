
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation } from '../components';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
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
      const tithes = {};
      let total = 0;

      monthsLowercase.forEach((month, index) => {
        const monthData = userData[`${month}-${selectedYear}`];
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

      <Box sx={{ py: 4, px: { xs: 1, sm: 2 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Total Anual de Dízimo</Typography>
              <Typography variant="h3" color="primary" fontWeight={700} sx={{ mb: 2 }}>R$ {yearTotal}</Typography>
              <Typography variant="body2" color="text.secondary">
                Lembre-se de lançar a saída (débito) correspondente em cada mês para que seu saldo reflita a doação.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Valores Mensais</Typography>
              <Grid container spacing={2}>
                {monthsPT.map((month) => (
                  <Grid item xs={6} sm={4} key={month}>
                    <Box sx={{ textAlign: 'center', p: 1, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>{month}</Typography>
                      <Typography variant="h6" color="primary" fontWeight={700}>{monthlyTithes[month] || '0.00'}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
