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
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [monthlyBalances, setMonthlyBalances] = useState({});

  // Form state
  const [description, setDescription] = useState('');
  const [installments, setInstallments] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // inglês

  // Load all data from Firebase
  useEffect(() => {
    if (!user) return;
    console.log('[CreditCard] Usuário logado:', user?.uid);
    console.log('[CreditCard] Ano selecionado:', selectedYear);

    // Lê diretamente do nó do ano selecionado
    const dataRef = ref(database, `creditCardData/${user.uid}`);
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const allData = snapshot.val() || {};
      const items = Object.keys(allData)
        .map(key => ({ ...allData[key], id: key }))
        .filter(item => item.year === selectedYear);
      
      console.log('[CreditCard] Dados do ano carregados:', items);
      setData(items);
    }, (error) => {
      console.error("[CreditCard] Erro ao ler dados do ano:", error);
    });

    return () => unsubscribe();
  }, [user, selectedYear]);

  // Calculate monthly balances
  useEffect(() => {
    const balances = {};
    monthsPT.forEach((monthName, index) => {
      // Normalizar mês para comparar
      const normalizedMonth = monthName
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ').trim();
      const filteredData = data.filter(item => {
        if (!item.month) return false;
        const [itemMonth, itemYear] = item.month.split(' ');
        // Normalizar também o mês do item
        const normalizedItemMonth = itemMonth
           .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ').trim();
        return normalizedItemMonth === normalizedMonth && parseInt(itemYear) === selectedYear;
      });
      console.log(`[CreditCard] Filtrando para mês ${monthName}:`, filteredData);
      const total = filteredData.reduce((acc, item) => acc + (item.value || 0), 0);
      balances[monthBalanceIds[index]] = total.toFixed(2);
    });
    console.log('[CreditCard] Balances calculados:', balances);
    setMonthlyBalances(balances);
    // Save to Firebase
    if (user) {
      monthBalanceIds.forEach((id) => {
        const value = parseFloat(balances[id]) || 0;
        const monthRef = ref(database, `creditCardBalances/${user.uid}/${selectedYear}/${id}`);
        set(monthRef, value).catch(console.error);
      });
    }
  }, [data, selectedYear, user]);

  // Add item
  const handleAddItem = async () => {
    console.log('[CreditCard] handleAddItem chamado:', { selectedMonth, description, installments, totalValue });
    if (!selectedMonth || !description || !installments || !totalValue) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }

    const numInstallments = parseInt(installments);
    const total = parseFloat(totalValue);

    if (isNaN(numInstallments) || numInstallments <= 0 || isNaN(total) || total <= 0) {
      alert("Por favor, insira valores válidos.");
      return;
    }

    const installmentValue = total / numInstallments;
    const promises = [];
    let currentMonthIndex = months.indexOf(selectedMonth);
    let yearForInstallment = selectedYear;

    for (let i = 0; i < numInstallments; i++) {
      const ptMonthName = monthsPT[currentMonthIndex];
      const uniqueId = uuidv4();
      const itemRef = ref(database, `creditCardData/${user.uid}/${uniqueId}`);
      
      const dataToSave = {
        description: `${description} ${i + 1}/${numInstallments}`,
        value: installmentValue.toFixed(2),
        month: `${ptMonthName} ${yearForInstallment}`,
        baseDescription: description,
        fitid: uniqueId,
        year: yearForInstallment
      };

      console.log('[CreditCard] Salvando lançamento:', dataToSave);
      promises.push(set(itemRef, dataToSave));

      currentMonthIndex++;
      if (currentMonthIndex > 11) {
        currentMonthIndex = 0;
        yearForInstallment++;
      }
    }

    await Promise.all(promises);
    console.log('[CreditCard] Todos os lançamentos salvos no Firebase.');

    setDescription('');
    setInstallments('');
    setTotalValue('');
    setSelectedMonth('');
  };

  // Delete purchase group
  const handleDeletePurchase = async (baseDescription, items) => {
    if (!window.confirm(`Tem certeza que deseja excluir todos os lançamentos de "${baseDescription}"?`)) {
      return;
    }

    const deletePromises = items.map(item => {
      const itemRef = ref(database, `creditCardData/${user.uid}/${item.id}`);
      return remove(itemRef);
    });

    await Promise.all(deletePromises);
  };

  // Import OFX
  const handleImportOFX = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Buscar todos os lançamentos existentes do usuário para evitar duplicidade
    const allDataRef = ref(database, `creditCardData/${user.uid}`);
    const snapshot = await new Promise(resolve => onValue(allDataRef, resolve, { onlyOnce: true }));
    const allData = snapshot.val() || {};

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const ofxData = e.target.result;
        const parsedTransactions = parseCreditCardOFX(ofxData);

        if (parsedTransactions.length === 0) {
          alert("Nenhuma despesa encontrada no arquivo OFX.");
          return;
        }

        // Check for duplicates
        const existingKeys = new Set();
        for (const year in allData) {
          for (const itemId in allData[year]) {
            const item = allData[year][itemId];
            if (item && item.fitid && item.description) {
              existingKeys.add(item.fitid + item.description);
            }
          }
        }

        const newTransactions = parsedTransactions.filter(p => {
          const key = p.fitid + p.description;
          return !existingKeys.has(key);
        });

        if (newTransactions.length === 0) {
          alert("Nenhuma nova despesa para importar. Os lançamentos já existem.");
          return;
        }

        const importPromises = newTransactions.map(trans => {
          const uniqueId = uuidv4();
          const transRef = ref(database, `creditCardData/${user.uid}/${uniqueId}`);
          const [, month, year] = trans.date.split('/');
          const monthIndex = parseInt(month, 10) - 1;
          const ptMonthName = monthsPT[monthIndex];

          return set(transRef, {
            description: trans.description,
            value: trans.amount,
            month: `${ptMonthName} ${year}`,
            fitid: trans.fitid,
            year: parseInt(year, 10)
          });
        });

        await Promise.all(importPromises);
        alert(`${newTransactions.length} despesa(s) importada(s) com sucesso!`);
      } catch (error) {
        console.error("Erro ao processar OFX:", error);
        alert("Erro ao processar arquivo OFX.");
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  // Group data by description
  const groupedData = data.reduce((acc, item) => {
    if (!item.month) return acc; // ignora itens sem mês
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
  console.log('[CreditCard] Dados agrupados por descrição:', groupedData);

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
                  //icon="date_range"
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
                {Object.keys(groupedData).length === 0 ? (
                  <Card>
                    <span className="card-title">Nenhum lançamento para o ano selecionado.</span>
                  </Card>
                ) : (
                  Object.keys(groupedData).sort().map(baseDescription => {
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
                  })
                )}
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
