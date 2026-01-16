import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { ref, remove } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card, SelectField, Footer } from '../components';
import '../styles/dashboard.css';

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
  { id: 'card18', path: '/report', title: 'Relatório Mensal', icon: 'assessment' },
  { id: 'card25', path: '/yearly-report', title: 'Relatório Anual', icon: 'calendar_today' },
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
    const { selectedYear } = useYear();
    if (!window.confirm(`Tem certeza que deseja limpar todos os dados do ano de ${selectedYear}? Esta ação é irreversível.`)) {
      return;
    }
    try {
      const userId = user?.uid;
      const userRootRef = ref(database, `users/${userId}/${selectedYear}`);
      const creditCardRootRef = ref(database, `creditCardData/${userId}/${selectedYear}`);
      const creditCardBalancesRootRef = ref(database, `creditCardBalances/${userId}/${selectedYear}`);
      const investmentsRootRef = ref(database, `investmentsData/${userId}/${selectedYear}`);
      const investmentBalancesRootRef = ref(database, `investmentBalances/${userId}/${selectedYear}`);
      const tithesRootRef = ref(database, `tithes/${userId}/${selectedYear}`);

      await Promise.all([
        remove(userRootRef),
        remove(creditCardRootRef),
        remove(creditCardBalancesRootRef),
        remove(investmentsRootRef),
        remove(investmentBalancesRootRef),
        remove(tithesRootRef)
      ]);

      alert(`Todos os dados do ano de ${selectedYear} foram apagados.`);
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
      <div className="navigation">
        <div className="nav-wrapper">
          <span className="brand-logo">Saldo Fácil</span>
        </div>
      </div>

      <div className="main-content">
        <div className="container">
          {/* User Card */}
          <Card className="user-card">
            <h5 className="user-greeting">
              <b>Olá,</b><br /><br />{displayName}!
            </h5>
            <div className="user-actions">
              <div className="year-selector-wrapper">
                <SelectField
                  label="Ano de Referência"
                  id="yearSelector"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  options={yearOptions}
                />
              </div>
              <div className="user-buttons">
                <button onClick={handleLogout} className="btn-user-action">
                  <i className="material-icons">exit_to_app</i> Logout
                </button>
                <button onClick={handleDeleteAccount} className="btn-user-action red">
                  <i className="material-icons">delete_forever</i> Excluir Conta
                </button>
              </div>
            </div>
          </Card>

          {/* Monthly Control Section */}
          <h4 className="section-title">Controle Mensal</h4>
          <div className="dashboard-grid">
            {monthCards.map((card) => (
              <div
                key={card.id}
                className="card nav-card"
                onClick={() => handleCardClick(card.path)}
              >
                <div className="card-content">
                  <i className="material-icons">{card.icon}</i>
                  <span className="card-title">{card.title}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tools and Reports Section */}
          <h4 className="section-title">Ferramentas e Relatórios</h4>
          <div className="dashboard-grid">
            {toolCards.map((card) => (
              <div
                key={card.id}
                className="card nav-card"
                onClick={() => handleCardClick(card.path)}
              >
                <div className="card-content">
                  <i className="material-icons">{card.icon}</i>
                  <span className="card-title">{card.title}</span>
                </div>
              </div>
            ))}
            <div className="card nav-card" onClick={handleClearData}>
              <div className="card-content">
                <i className="material-icons">autorenew</i>
                <span className="card-title">Recomeçar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
