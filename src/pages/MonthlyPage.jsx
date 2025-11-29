import { useNavigate } from 'react-router-dom';
import { Navigation, Card, InputField, TransactionCard } from '../components';
import { Box, Grid, Paper, Typography, Button } from '@mui/material';

export default function MonthlyPage() {
    const navigate = useNavigate();
    // Example: selectedMonth and selectedYear could come from props, context, or state
    const selectedMonth = 0; // January as default, replace with actual logic
    const selectedYear = 2024; // Replace with actual logic

    // Array of month names
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthName = monthNames[selectedMonth];

    // Calculate previous and next month/year for navigation
    const prevMonth =
      selectedMonth === 0
        ? `11/${selectedYear - 1}`
        : `${selectedMonth - 1}/${selectedYear}`;
    const nextMonth =
      selectedMonth === 11
        ? `0/${selectedYear + 1}`
        : `${selectedMonth + 1}/${selectedYear}`;

    // Removed unused and undefined variables per lint errors
    const handleClearMonth = () => {};
    // Running balance stub
    // const transactionsWithBalance = transactions.map(t => ({ ...t, runningBalance: 0 }));
    return (
      <>
        <Navigation
          title={`${monthName} ${selectedYear}`}
          onBack={() => navigate(`/month/${prevMonth}`)}
          onNext={() => navigate(`/month/${nextMonth}`)}
        />
        <div className="main-content">
          <div className="container">
            <button className="btn btn-nav" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>
              Início
            </button>
            <button className="btn red" onClick={handleClearMonth} style={{ marginBottom: '1rem', marginLeft: '1rem' }}>
              Limpar mês
            </button>
            {/* ...rest of the JSX... */}
          </div>
        </div>
      </>
    );
  }
