import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Card, InputField, SelectField } from '../components';

const monthOptions = [
  { value: 'Janeiro', label: 'Janeiro' },
  { value: 'Fevereiro', label: 'Fevereiro' },
  { value: 'Março', label: 'Março' },
  { value: 'Abril', label: 'Abril' },
  { value: 'Maio', label: 'Maio' },
  { value: 'Junho', label: 'Junho' },
  { value: 'Julho', label: 'Julho' },
  { value: 'Agosto', label: 'Agosto' },
  { value: 'Setembro', label: 'Setembro' },
  { value: 'Outubro', label: 'Outubro' },
  { value: 'Novembro', label: 'Novembro' },
  { value: 'Dezembro', label: 'Dezembro' }
];
const monthBalanceIds = monthOptions.map(opt => opt.value.toLowerCase() + 'CreditCardBalance');


import { Box, Grid, Paper, Typography, Button } from '@mui/material';

export default function CreditCard() {

  const navigate = useNavigate();
    const selectedYear = new Date().getFullYear();
  const [description, setDescription] = useState('');
  const [installments, setInstallments] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || '');
  const [data] = useState([]);
  const [monthlyBalances] = useState({});

    // Handler stubs
    const handleAddItem = () => {};
    const handleImportOFX = () => {};
    const handleDeletePurchase = () => {};

  // Group data by description
  const groupedData = data.reduce((acc, item) => {
    const [, itemYear] = item.month?.split(' ') || [];
    if (parseInt(itemYear) === selectedYear) {
      const baseDescription = item.description?.split(' (')[0]?.split(' - Parcela')[0];
      if (!acc[baseDescription]) {
        acc[baseDescription] = [];
      }
      acc[baseDescription].push(item);
    }
    return acc;
  }, {});

  return (
    <>
      <Navigation
        title={`Cartão de Crédito ${selectedYear}`}
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />
      <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Registrar Nova Compra</Typography>
                <InputField
                  label="Descrição"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  icon="shopping_cart"
                  placeholder="Ex: Compra online"
                />
                <InputField
                  label="Nº de Parcelas"
                  id="installments"
                  type="number"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  icon="payment"
                  placeholder="Ex: 12"
                />
                <InputField
                  label="Valor Total da Compra (R$)"
                  id="totalValue"
                  type="number"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  icon="attach_money"
                  placeholder="Ex: 1200.00"
                />
                <SelectField
                  label="Mês da Compra"
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  options={monthOptions}
                  placeholder="Mês da primeira parcela"
                  icon="date_range"
                />
                <div className="add-container">
                  <button className="btn" onClick={handleAddItem}>Adicionar</button>
                  <label className="btn success">
                    Importar Fatura
                    <input type="file" accept=".ofx" onChange={handleImportOFX} />
                  </label>
                </div>
              </Paper>
              <div id="groupedCardContainer">
                {Object.keys(groupedData).sort().map(baseDescription => {
                  const items = groupedData[baseDescription];
                  return (
                    <Card key={baseDescription}>
                      <span className="card-title">{baseDescription}</span>
                      {items.map(item => (
                        <p key={item.id}>
                          {item.description}: R$ {item.value?.toFixed(2) ?? '0.00'}
                        </p>
                      ))}
                      <button 
                        className="btn-delete btn" 
                        onClick={() => handleDeletePurchase(baseDescription, items)}
                        style={{ marginTop: '1rem' }}
                      >
                        Excluir Compra
                      </button>
                    </Card>
                  );
                })}
              </div>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <span className="card-title">Faturas Mensais</span>
                <div className="value-grid">
                  {monthOptions.map((opt, index) => (
                    <div className="value-item" key={opt.value}>
                      <span className="value-title">{opt.value.substring(0, 3)}</span>
                      <span className="value-amount orange-text">
                        {monthlyBalances[monthBalanceIds[index]] || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="btn" onClick={() => window.print()} style={{ marginTop: '1.5rem' }}>
                  Exportar PDF
                </button>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
}
