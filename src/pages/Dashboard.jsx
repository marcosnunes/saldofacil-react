import { signOut } from 'firebase/auth';
import { ref, remove } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card, SelectField, Footer } from '../components';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import { Box, Grid, Typography, Paper, Button } from '@mui/material';
import Icon from '@mui/material/Icon';
const monthCards = [
  { id: 'card1', path: '/month/1', title: 'Janeiro', icon: 'wb_sunny' },
  { id: 'card2', path: '/month/2', title: 'Fevereiro', icon: 'wb_sunny' },
  { id: 'card3', path: '/month/3', title: 'Março', icon: 'eco' },
  { id: 'card4', path: '/month/4', title: 'Abril', icon: 'park' },
  { id: 'card5', path: '/month/5', title: 'Maio', icon: 'forest' },
  { id: 'card6', path: '/month/6', title: 'Junho', icon: 'ac_unit' },
  { id: 'card7', path: '/month/7', title: 'Julho', icon: 'cloud' },
  { id: 'card8', path: '/month/8', title: 'Agosto', icon: 'nightlight' },
  { id: 'card9', path: '/month/9', title: 'Setembro', icon: 'local_florist' },
  { id: 'card10', path: '/month/10', title: 'Outubro', icon: 'grass' },
  { id: 'card11', path: '/month/11', title: 'Novembro', icon: 'landscape' },
  { id: 'card12', path: '/month/12', title: 'Dezembro', icon: 'wb_sunny' },
];

const toolCards = [
  { id: 'card13', path: '/credit-card', title: 'Cartão de Crédito', icon: 'credit_card' },
  { id: 'card22', path: '/investments', title: 'Investimentos', icon: 'trending_up' },
  { id: 'card17', path: '/tithe', title: 'Dízimos', icon: 'favorite' },
  { id: 'card18', path: '/report', title: 'Relatório Anual', icon: 'assessment' },
  { id: 'card19', path: '/charts', title: 'Gráficos', icon: 'bar_chart' },
  { id: 'card16', path: '/tools', title: 'Ferramentas', icon: 'construction' },
  { id: 'card23', path: '/salary', title: 'Salário Líquido', icon: 'calculate' },
  { id: 'card14', path: '/faq', title: 'FAQ', icon: 'help_outline' },
  { id: 'card15', path: '/privacy', title: 'Privacidade', icon: 'privacy_tip' },
  { id: 'card24', path: '/ai-reports', title: 'Relatórios com IA', icon: 'auto_awesome' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedYear, setSelectedYear } = useYear();
  const navigate = useNavigate();

  const displayName = user?.displayName || user?.email || 'Usuário';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleDeleteAccount = () => {
    navigate('/delete-account');
  };

  const handleClearData = async () => {
    if (!window.confirm("Tem certeza que deseja limpar TODOS os dados de TODOS os anos? Esta ação é irreversível.")) {
      return;
    }

    const userId = user?.uid;
    if (!userId) {
      alert("Usuário não autenticado.");
      return;
    }

    try {
      const userRootRef = ref(database, 'users/' + userId);
      const creditCardRootRef = ref(database, 'creditCardData/' + userId);
      const creditCardBalancesRootRef = ref(database, 'creditCardBalances/' + userId);
      const investmentsRootRef = ref(database, 'investimentsData/' + userId);

      await Promise.all([
        remove(userRootRef),
        remove(creditCardRootRef),
        remove(creditCardBalancesRootRef),
        remove(investmentsRootRef)
      ]);

      alert("Todos os seus dados foram apagados permanentemente.");
      localStorage.clear();
    } catch (error) {
      console.error("Erro ao apagar dados:", error);
      alert("Erro ao apagar dados. Tente novamente.");
    }
  };

  const handleCardClick = (path) => {
    navigate(path);
  };

  const yearOptions = [];
  for (let year = 2020; year <= 2030; year++) {
    yearOptions.push({ value: year, label: year.toString() });
  }

  return (
    <>
      <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', pb: 4 }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: 2, mb: 4, boxShadow: 2 }}>
          <Typography variant="h4" align="center" fontWeight={700} letterSpacing={2}>
            Saldo Fácil
          </Typography>
        </Box>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Olá, <span style={{ color: '#1976d2' }}>{displayName}</span>!
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <SelectField
                  label="Ano de Referência"
                  id="yearSelector"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  options={yearOptions}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="contained" color="primary" startIcon={<Icon>exit_to_app</Icon>} onClick={handleLogout}>
                    Logout
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<Icon>delete_forever</Icon>} onClick={handleDeleteAccount}>
                    Excluir Conta
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="h6" fontWeight={500} sx={{ mb: 2, mt: 4 }}>
            Controle Mensal
          </Typography>
          <Grid container spacing={2}>
            {monthCards.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.id}>
                <Paper elevation={2} sx={{ p: 2, textAlign: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { boxShadow: 6, bgcolor: '#e3f2fd' } }} onClick={() => handleCardClick(card.path)}>
                  <Icon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }}>{card.icon}</Icon>
                  <Typography variant="subtitle1" fontWeight={500}>{card.title}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" fontWeight={500} sx={{ mb: 2, mt: 4 }}>
            Ferramentas e Relatórios
          </Typography>
          <Grid container spacing={2}>
            {toolCards.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.id}>
                <Paper elevation={2} sx={{ p: 2, textAlign: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { boxShadow: 6, bgcolor: '#e3f2fd' } }} onClick={() => handleCardClick(card.path)}>
                  <Icon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }}>{card.icon}</Icon>
                  <Typography variant="subtitle1" fontWeight={500}>{card.title}</Typography>
                </Paper>
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { boxShadow: 6, bgcolor: '#e3f2fd' } }} onClick={handleClearData}>
                <Icon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }}>autorenew</Icon>
                <Typography variant="subtitle1" fontWeight={500}>Recomeçar</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ mt: 6 }}>
          <Footer />
        </Box>
      </Box>
    </>
  );
}
