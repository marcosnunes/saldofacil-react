import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation, Card, InputField, TransactionCard } from '../components';
import { monthsPT } from '../utils/helpers';
import { MonthlyProvider, useMonthly } from '../contexts/MonthlyContext';

export default function MonthlyPage() {
    const { monthId } = useParams();
    const monthIndex = parseInt(monthId) - 1;
    return (
      <MonthlyProvider monthIndex={monthIndex}>
        <MonthlyContent monthIndex={monthIndex} />
      </MonthlyProvider>
    );
  }

  function MonthlyContent({ monthIndex }) {
    const { transactions, initialBalance, tithe, creditCardBalance, investmentBalance, totalCredit, totalDebit, balance, finalBalance, percentage, addTransaction, updateTransaction, deleteTransaction, importOFX, setInitialBalance } = useMonthly();
    const { selectedYear } = useMonthly();
    const monthName = monthsPT[monthIndex];
    const navigate = useNavigate();
    const prevMonth = monthIndex === 0 ? 12 : monthIndex;
    const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2;

    // Form state
    const [description, setDescription] = useState('');
    return (
      <div>
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
            <div className="monthly-layout">
              <div className="main-column">
                <Card id="card-lancamento">
                  <span className="card-title">{editingId ? 'Editar lançamento' : 'Fazer lançamento'}</span>
                  <InputField label="Descrição" id="description" value={description} onChange={(e) => setDescription(e.target.value)} icon="description" placeholder="Descrição" />
                  {editingId ? (
                    parseFloat(debit) > 0 ? (
                      <InputField label="Débito" id="debit" type="number" value={debit} onChange={(e) => setDebit(e.target.value)} icon="arrow_downward" placeholder="Débito" />
                    ) : (
                      <InputField label="Crédito" id="credit" type="number" value={credit} onChange={(e) => setCredit(e.target.value)} icon="arrow_upward" placeholder="Crédito" />
                    )
                  ) : (
                    <div>
                      <InputField label="Débito" id="debit" type="number" value={debit} onChange={(e) => setDebit(e.target.value)} icon="arrow_downward" placeholder="Débito" />
                      <InputField label="Crédito" id="credit" type="number" value={credit} onChange={(e) => setCredit(e.target.value)} icon="arrow_upward" placeholder="Crédito" />
                    </div>
                  )}
                  <div style={{ paddingLeft: '0', marginBottom: '1.5rem' }}>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={isTithe} onChange={(e) => setIsTithe(e.target.checked)} />
                      <span>É dízimo?</span>
                    </label>
                  </div>
                  <InputField label="Dia" id="day" type="number" value={day} onChange={(e) => setDay(e.target.value)} icon="calendar_today" placeholder="Dia" min="1" max="31" />
                  <div className="add-container">
                    {editingId ? (
                      <div>
                        <button className="btn" onClick={handleSaveEdit}>Salvar</button>
                        <button className="btn red" onClick={handleCancelEdit}>Cancelar</button>
                      </div>
                    ) : (
                      <div>
                        <button className="btn" onClick={handleAddTransaction}>Adicionar</button>
                        <label className="btn success">
                          Importar Extrato
                          <input type="file" accept=".ofx" onChange={handleImportOFX} />
                        </label>
                      </div>
                    )}
                  </div>
                </Card>
                <div id="dataCards">
                  {(() => {
                    const seen = new Set();
                    return transactionsWithBalance.filter(t => {
                      const key = (t.FITID ? t.FITID + t.description : t.description);
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    }).map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        runningBalance={transaction.runningBalance}
                        onEdit={() => handleEditTransaction(transaction)}
                        onDelete={() => handleDeleteTransaction(transaction.id)}
                      />
                    ));
                  })()}
                </div>
              </div>
              <div className="sidebar-column">
                <Card>
                  <span className="card-title">Saldo Inicial</span>
                  <InputField label="Saldo Inicial do Período" id="initialBalance" type="number" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} icon="account_balance_wallet" placeholder="Saldo Inicial" />
                </Card>
                <Card>
                  <span className="card-title">Resultados do Mês</span>
                  <div className="results-list">
                    <p>Dízimo: <span className="blue-text">{tithe}</span></p>
                    <p>Cartão de Crédito: <span className="orange-text">{creditCardBalance}</span></p>
                    <p>Total Crédito: <span className="green-text">{totalCredit}</span></p>
                    <p>Total Débito: <span className="orange-text">{totalDebit}</span></p>
                    <p>Total Investimentos: <span className="orange-text">{investmentBalance}</span></p>
                    <p>Balanço: <span>{balance}</span></p>
                    <p>Débito ÷ Crédito: <span>{percentage}</span></p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                      Saldo Final: <span style={{ color: 'var(--color-primary)' }}>{finalBalance}</span>
                    </p>
                  </div>
                  <button className="btn" onClick={() => window.print()} style={{ marginTop: '1.5rem' }}>
                    Exportar para PDF
                  </button>
                </Card>
              </div>
            </div>
          </div>
        </div>
              </div>
              <div className="sidebar-column">
                <Card>
                  <span className="card-title">Saldo Inicial</span>
                  <InputField label="Saldo Inicial do Período" id="initialBalance" type="number" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} icon="account_balance_wallet" placeholder="Saldo Inicial" />
                </Card>
                <Card>
                  <span className="card-title">Resultados do Mês</span>
                  <div className="results-list">
                    <p>Dízimo: <span className="blue-text">{tithe}</span></p>
                    <p>Cartão de Crédito: <span className="orange-text">{creditCardBalance}</span></p>
                    <p>Total Crédito: <span className="green-text">{totalCredit}</span></p>
                    <p>Total Débito: <span className="orange-text">{totalDebit}</span></p>
                    <p>Total Investimentos: <span className="orange-text">{investmentBalance}</span></p>
                    <p>Balanço: <span>{balance}</span></p>
                    <p>Débito ÷ Crédito: <span>{percentage}</span></p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                      Saldo Final: <span style={{ color: 'var(--color-primary)' }}>{finalBalance}</span>
                    </p>
                  </div>
                  <button className="btn" onClick={() => window.print()} style={{ marginTop: '1.5rem' }}>
                    Exportar para PDF
                  </button>
                  {/* Botão de exportação para Excel pode ser adaptado para usar dados do contexto */}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

                      icon="arrow_upward"
                      placeholder="Crédito"
                    />
                  </>
                )}

                <div style={{ paddingLeft: '0', marginBottom: '1.5rem' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isTithe}
                      onChange={(e) => setIsTithe(e.target.checked)}
                    />
                    <span>É dízimo?</span>
                  </label>
                </div>

                <InputField
                  label="Dia"
                  id="day"
                  type="number"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  icon="calendar_today"
                  placeholder="Dia"
                  min="1"
                  max="31"
                />

                <div className="add-container">
                  {editingId ? (
                    <>
                      <button className="btn" onClick={handleSaveEdit}>Salvar</button>
                      <button className="btn red" onClick={handleCancelEdit}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button className="btn" onClick={handleAddTransaction}>Adicionar</button>
                      <label className="btn success">
                        Importar Extrato
                        <input type="file" accept=".ofx" onChange={handleImportOFX} />
                      </label>
                    </>
                  )}
                </div>
              </Card>

              <div id="dataCards">
                {/* Filtra duplicados por FITID + descrição antes de renderizar */}
                {(() => {
                  const seen = new Set();
                  return transactionsWithBalance.filter(t => {
                    const key = (t.FITID ? t.FITID + t.description : t.description);
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  }).map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      runningBalance={transaction.runningBalance}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                    />
                  ));
                })()}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="sidebar-column">
              <Card>
                <span className="card-title">Saldo Inicial</span>
                {monthIndex === 0 ? (
                  <InputField
                    label="Saldo Inicial do Período"
                    id="initialBalance"
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    icon="account_balance_wallet"
                    placeholder="Saldo Inicial"
                  />
                ) : (
                  <div style={{ marginTop: '1rem', fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                    {prevFinalBalance !== '' ? `R$ ${Number(prevFinalBalance).toFixed(2)}` : 'Carregando...'}
                  </div>
                )}
              </Card>

              <Card>
                <span className="card-title">Resultados do Mês</span>
                <div className="results-list">
                  <p>Dízimo: <span className="blue-text">{tithe}</span></p>
                  <p>Cartão de Crédito: <span className="orange-text">{creditCardBalance}</span></p>
                  <p>Total Crédito: <span className="green-text">{totalCredit}</span></p>
                  <p>Total Débito: <span className="orange-text">{totalDebit}</span></p>
                  <p>Total Investimentos: <span className="orange-text">{investmentBalance}</span></p>
                  <p>Balanço: <span>{balance}</span></p>
                  <p>Débito ÷ Crédito: <span>{percentage}</span></p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Saldo Final: <span style={{ color: 'var(--color-primary)' }}>{finalBalance}</span>
                  </p>
                </div>
                <button className="btn" onClick={() => window.print()} style={{ marginTop: '1.5rem' }}>
                  Exportar para PDF
                </button>
                <button className="btn success" onClick={handleExportExcel} style={{ marginTop: '0.5rem' }}>
                  Exportar para Excel
                </button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );