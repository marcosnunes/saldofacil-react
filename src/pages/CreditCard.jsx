import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set, onValue, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { Navigation, Card, InputField, SelectField } from '../components';
import { uuidv4, monthsPT, parseCreditCardOFX } from '../utils/helpers';

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const monthOptions = months.map((month, index) => ({
  value: month,
  label: monthsPT[index]
}));

const monthBalanceIds = [
  'januaryCreditCardBalance',
  'februaryCreditCardBalance',
  'marchCreditCardBalance',
  'aprilCreditCardBalance',
  'mayCreditCardBalance',
  'juneCreditCardBalance',
  'julyCreditCardBalance',
  'augustCreditCardBalance',
  'septemberCreditCardBalance',
  'octoberCreditCardBalance',
  'novemberCreditCardBalance',
  'decemberCreditCardBalance'
];

export default function CreditCard() {

  import { Box, Grid, Paper, Typography, Button } from '@mui/material';
  // ...existing code...

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
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleAddItem}>Adicionar</Button>
                    <Button variant="contained" color="success" component="label">
                      Importar Fatura
                      <input type="file" accept=".ofx" hidden onChange={handleImportOFX} />
                    </Button>
                  </Box>
                </Paper>
                <Box>
                  {Object.keys(groupedData).sort().map(baseDescription => {
                    const items = groupedData[baseDescription];
                    return (
                      <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }} key={baseDescription}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>{baseDescription}</Typography>
                        {items.map(item => (
                          <Typography key={item.id} variant="body2">
                            {item.description}: R$ {item.value.toFixed(2)}
                          </Typography>
                        ))}
                        <Button variant="outlined" color="error" onClick={() => handleDeletePurchase(baseDescription, items)} sx={{ mt: 2 }}>
                          Excluir Compra
                        </Button>
                      </Paper>
                    );
                  })}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Faturas Mensais</Typography>
                  <Grid container spacing={1}>
                    {monthsPT.map((month, index) => (
                      <Grid item xs={4} key={month}>
                        <Typography variant="body2" fontWeight={600}>{month.substring(0, 3)}</Typography>
                        <Typography variant="body2" color="warning.main">
                          {monthlyBalances[monthBalanceIds[index]] || '0.00'}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Button variant="contained" color="primary" onClick={() => window.print()} sx={{ mt: 3 }}>
                    Exportar PDF
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </>
    );
  }
        const parsedTransactions = parseCreditCardOFX(ofxData);

        if (parsedTransactions.length === 0) {
          alert("Nenhuma despesa encontrada no arquivo OFX.");
          return;
        }

        // Check for duplicates
        const existingKeys = new Set();
        for (const year in allTimeData) {
          for (const itemId in allTimeData[year]) {
            const item = allTimeData[year][itemId];
            if (item && item.fitid && item.description) {
              existingKeys.add(item.fitid + item.description);
            }
          }
        }

        let newCount = 0;
        const promises = [];

        for (const transaction of parsedTransactions) {
          const key = transaction.fitid + transaction.description;
          if (!existingKeys.has(key)) {
            const item = {
              month: `${transaction.month} ${transaction.year}`,
              description: transaction.description,
              value: transaction.value,
              fitid: transaction.fitid
            };
            const itemId = uuidv4();
            const itemRef = ref(database, `creditCardData/${user.uid}/${transaction.year}/${itemId}`);
            promises.push(set(itemRef, { ...item, id: itemId }));
            newCount++;
          }
        }

        if (promises.length > 0) {
          await Promise.all(promises);
          alert(`${newCount} despesa(s) importada(s) com sucesso!`);
        } else {
          alert("Nenhuma despesa nova para importar.");
        }
      } catch (error) {
        console.error("Erro ao processar OFX:", error);
        alert("Erro ao processar arquivo OFX.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Group data by description
  const groupedData = data.reduce((acc, item) => {
    const [, itemYear] = item.month.split(' ');
    if (parseInt(itemYear) === selectedYear) {
      const baseDescription = item.description.split(' (')[0].split(' - Parcela')[0];
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

      <div className="main-content">
        <div className="container">
          <div className="data-layout">
            {/* Main Column */}
            <div className="main-column">
              <Card id="Registrar_Compra">
                <span className="card-title">Registrar Nova Compra</span>
                
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
              </Card>

              {/* Grouped Cards */}
              <div id="groupedCardContainer">
                {Object.keys(groupedData).sort().map(baseDescription => {
                  const items = groupedData[baseDescription];
                  return (
                    <Card key={baseDescription}>
                      <span className="card-title">{baseDescription}</span>
                      {items.map(item => (
                        <p key={item.id}>
                          {item.description}: R$ {item.value.toFixed(2)}
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
            </div>

            {/* Sidebar Column */}
            <div className="sidebar-column">
              <Card>
                <span className="card-title">Faturas Mensais</span>
                <div className="value-grid">
                  {monthsPT.map((month, index) => (
                    <div className="value-item" key={month}>
                      <span className="value-title">{month.substring(0, 3)}</span>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
