import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation } from '../components';
import { monthsLowercase, monthsPT } from '../utils/helpers';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import Icon from '@mui/material/Icon';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);
export default function Charts() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();

  const [creditData, setCreditData] = useState(Array(12).fill(0));
  const [debitData, setDebitData] = useState(Array(12).fill(0));
  const [balanceData, setBalanceData] = useState(Array(12).fill(0));

  // Load data from Firebase
  useEffect(() => {
    if (!user) return;

    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const userData = snapshot.val() || {};
      
      const credits = [];
      const debits = [];
      const balances = [];

      monthsLowercase.forEach((month) => {
        const monthData = userData[`${month}-${selectedYear}`];
        if (monthData) {
          credits.push(parseFloat(monthData.totalCredit) || 0);
          debits.push(parseFloat(monthData.totalDebit) || 0);
          balances.push(parseFloat(monthData.finalBalance) || 0);
        } else {
          credits.push(0);
          debits.push(0);
          balances.push(0);
        }
      });

      setCreditData(credits);
      setDebitData(debits);
      setBalanceData(balances);
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
    maintainAspectRatio: true,
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

      <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', px: 2 }}>
          <Typography variant="h4" fontWeight={700} align="center" sx={{ mb: 4 }}>
            Gráficos {selectedYear}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Créditos vs. Débitos Mensais</Typography>
                <Box sx={{ maxHeight: 400 }}>
                  <Bar data={creditDebitChartData} options={chartOptions} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Evolução do Saldo Final Mensal</Typography>
                <Box sx={{ maxHeight: 400 }}>
                  <Line data={balanceChartData} options={chartOptions} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Linha de Tendência Anual</Typography>
                <Box sx={{ maxHeight: 400 }}>
                  <Line data={trendChartData} options={chartOptions} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Exportar Dados</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Exporte a visualização atual da página para PDF.
                </Typography>
                <Button variant="contained" color="primary" startIcon={<Icon>picture_as_pdf</Icon>} onClick={() => window.print()}>
                  Exportar para PDF
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
}
