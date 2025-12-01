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
  const [allTimeData] = useState({});
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
    const yearDataRef = ref(database, `creditCardData/${user.uid}/${selectedYear}`);
    const unsubscribe = onValue(yearDataRef, (snapshot) => {
      const yearData = snapshot.val() || {};
      console.log(`[CreditCard] yearData (${selectedYear}):`, yearData);
      const items = Object.keys(yearData).map(key => {
        const item = { ...yearData[key], id: key };
        item.value = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
        if (item.month) {
          item.month = item.month
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
            .replace(/\s+/g, ' ') // remove espaços duplicados
            .trim();
        }
        return item;
      });
      console.log('[CreditCard] items array antes do setData:', items);
      setData(items);
    });

    return () => unsubscribe();
  }, [user, selectedYear]);

  // Calculate and update balances when data changes
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

    const currentMonthIndex = months.indexOf(selectedMonth);
    let monthIndex = currentMonthIndex;
    // Corrigir: ano inicial deve ser o selectedYear
    let yearForInstallment = selectedYear;

    const promises = [];

    for (let i = 0; i < numInstallments; i++) {
      const monthNamePT = monthsPT[monthIndex];
      const item = {
        month: `${monthNamePT} ${yearForInstallment}`,
        description: `${description} - Parcela ${i + 1}/${numInstallments}`,
        value: parseFloat((total / numInstallments).toFixed(2))
      };
      console.log(`[CreditCard] Lançamento gerado:`, item);
      const itemId = uuidv4();
      const itemRef = ref(database, `creditCardData/${user.uid}/${yearForInstallment}/${itemId}`);
      promises.push(set(itemRef, { ...item, id: itemId }));
      monthIndex++;
      if (monthIndex >= 12) {
        monthIndex = 0;
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
      const [, itemYear] = item.month.split(' ');
      const itemRef = ref(database, `creditCardData/${user.uid}/${itemYear}/${item.id}`);
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
