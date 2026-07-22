import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, ref, set } from 'firebase/database';
import { Navigation, Card, InputField, SelectField } from '../components';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { monthsLowercase, monthsPT } from '../utils/helpers';
import {
  buildSalaryProjection,
  createDefaultSalaryConfig,
  createEmptyVacationPeriod,
  mergeSalaryConfig,
  recalculateMonthData,
  sortTransactionsByDay
} from '../utils/salaryProjection';

export default function SalaryCalculator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedYear } = useYear();

  const [config, setConfig] = useState(createDefaultSalaryConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const monthOptions = monthsPT.map((month, index) => ({
    label: month,
    value: String(index)
  }));

  const planningPath = (userId, year) => `users/${userId}/salaryPlanning/${year}`;

  useEffect(() => {
    let isActive = true;

    async function loadPlanning() {
      if (!user || !selectedYear) {
        if (isActive) {
          setConfig(createDefaultSalaryConfig());
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const planningRef = ref(database, planningPath(user.uid, selectedYear));
        const snapshot = await get(planningRef);
        const saved = snapshot.val();

        if (isActive) {
          setConfig(mergeSalaryConfig(saved?.config || {}));
          setStatusMessage('');
        }
      } catch (error) {
        console.error('Erro ao carregar planejamento salarial:', error);
        if (isActive) {
          setConfig(createDefaultSalaryConfig());
          setStatusMessage('Não foi possível carregar o planejamento salvo deste ano.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadPlanning();

    return () => {
      isActive = false;
    };
  }, [selectedYear, user]);

  const projection = buildSalaryProjection(config, Number(selectedYear || new Date().getFullYear()));

  const updateField = (field, value) => {
    setConfig((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updateMonthlyOverride = (monthKey, field, value) => {
    setConfig((current) => ({
      ...current,
      monthlyOverrides: {
        ...current.monthlyOverrides,
        [monthKey]: {
          ...current.monthlyOverrides[monthKey],
          [field]: value
        }
      }
    }));
  };

  const updateVacationPeriod = (periodId, field, value) => {
    setConfig((current) => ({
      ...current,
      vacationPeriods: current.vacationPeriods.map((period) => (
        period.id === periodId
          ? { ...period, [field]: value }
          : period
      ))
    }));
  };

  const addVacationPeriod = () => {
    setConfig((current) => ({
      ...current,
      vacationPeriods: [...current.vacationPeriods, createEmptyVacationPeriod()]
    }));
  };

  const removeVacationPeriod = (periodId) => {
    setConfig((current) => ({
      ...current,
      vacationPeriods: current.vacationPeriods.filter((period) => period.id !== periodId)
    }));
  };

  const persistPlanning = async (extra = {}) => {
    if (!user || !selectedYear) {
      return;
    }

    const planningRef = ref(database, planningPath(user.uid, selectedYear));
    await set(planningRef, {
      config,
      summary: {
        totalNetPayroll: projection.summary.totalNetPayroll,
        totalReceived: projection.summary.totalReceived,
        totalFgts: projection.summary.totalFgts,
        totalThirteenth: projection.summary.totalThirteenth,
        totalVacation: projection.summary.totalVacation
      },
      months: projection.months.map((month) => ({
        monthKey: month.monthKey,
        monthLabel: month.monthLabel,
        workedDays: month.workedDays,
        vacationDays: month.vacationDays,
        netPayroll: month.netPayroll,
        totalReceived: month.totalReceived,
        launchAmount: month.launchAmount
      })),
      updatedAt: new Date().toISOString(),
      ...extra
    });
  };

  const handleSavePlanning = async () => {
    if (!user || !selectedYear) {
      setStatusMessage('Faça login e selecione um ano antes de salvar o planejamento.');
      return;
    }

    setIsSaving(true);
    setStatusMessage('');

    try {
      await persistPlanning();
      setStatusMessage('Planejamento salarial salvo com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar planejamento salarial:', error);
      setStatusMessage('Não foi possível salvar o planejamento salarial.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToMonths = async () => {
    if (!user || !selectedYear) {
      setStatusMessage('Faça login e selecione um ano antes de lançar salários.');
      return;
    }

    const launchDay = Number(config.launchDay);
    if (!Number.isInteger(launchDay) || launchDay < 1 || launchDay > 31) {
      setStatusMessage('Informe um dia de lançamento válido entre 1 e 31.');
      return;
    }

    setIsApplying(true);
    setStatusMessage('');

    try {
      let previousFinalBalance = 0;

      await persistPlanning({ appliedAt: new Date().toISOString() });

      for (let monthIndex = 0; monthIndex < projection.months.length; monthIndex += 1) {
        const month = projection.months[monthIndex];
        const monthRef = ref(database, `users/${user.uid}/${selectedYear}/${month.monthKey}`);
        const snapshot = await get(monthRef);
        const existingMonthData = snapshot.val() || {};
        const existingTransactions = existingMonthData.transactions
          ? Object.values(existingMonthData.transactions)
          : [];
        const salaryTransactionId = `salary-${selectedYear}-${month.monthKey}`;
        const salaryTransaction = {
          id: salaryTransactionId,
          description: 'Salário',
          credit: month.launchAmount,
          debit: 0,
          day: String(launchDay),
          tithe: false,
          dayBalance: 0,
          isSalaryProjection: true
        };

        const transactionsWithoutSalary = existingTransactions.filter(
          (transaction) => transaction.id !== salaryTransactionId
        );

        const updatedTransactions = month.launchAmount > 0
          ? sortTransactionsByDay([...transactionsWithoutSalary, salaryTransaction])
          : sortTransactionsByDay(transactionsWithoutSalary);

        const normalizedMonthData = recalculateMonthData({
          ...existingMonthData,
          initialBalance: monthIndex === 0
            ? (existingMonthData.initialBalance ?? '0.00')
            : previousFinalBalance.toFixed(2),
          creditCardBalance: existingMonthData.creditCardBalance ?? '0.00',
          investmentTotal: existingMonthData.investmentTotal ?? 0,
          transactions: updatedTransactions
        });

        await set(monthRef, normalizedMonthData);
        previousFinalBalance = Number(normalizedMonthData.finalBalance) || 0;
      }

      setStatusMessage('Salários lançados e atualizados em todos os meses do ano selecionado.');
    } catch (error) {
      console.error('Erro ao lançar salários nos meses:', error);
      setStatusMessage('Não foi possível aplicar os salários aos meses.');
    } finally {
      setIsApplying(false);
    }
  };

  const renderBaseFieldGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
      <InputField
        label="Nome do colaborador"
        id="employeeName"
        value={config.employeeName}
        onChange={(event) => updateField('employeeName', event.target.value)}
        icon="badge"
      />
      <InputField
        label="Salário base inicial (R$)"
        id="baseSalary"
        value={config.baseSalary}
        onChange={(event) => updateField('baseSalary', event.target.value)}
        icon="attach_money"
      />
      <InputField
        label="Horas mensais"
        id="monthlyHours"
        value={config.monthlyHours}
        onChange={(event) => updateField('monthlyHours', event.target.value)}
        icon="schedule"
      />
      <InputField
        label="Horas por dia"
        id="hoursPerDay"
        value={config.hoursPerDay}
        onChange={(event) => updateField('hoursPerDay', event.target.value)}
        icon="timelapse"
      />
      <InputField
        label="% reajuste salarial"
        id="raisePercent"
        value={config.raisePercent}
        onChange={(event) => updateField('raisePercent', event.target.value)}
        icon="trending_up"
      />
      <SelectField
        label="Mês do reajuste"
        id="raiseMonthIndex"
        value={config.raiseMonthIndex}
        onChange={(event) => updateField('raiseMonthIndex', event.target.value)}
        options={monthOptions}
      />
      <InputField
        label="VA Jan-Mar (R$)"
        id="mealAllowanceJanToMar"
        value={config.mealAllowanceJanToMar}
        onChange={(event) => updateField('mealAllowanceJanToMar', event.target.value)}
        icon="restaurant"
      />
      <InputField
        label="VA Abr-Dez (R$)"
        id="mealAllowanceAprToDec"
        value={config.mealAllowanceAprToDec}
        onChange={(event) => updateField('mealAllowanceAprToDec', event.target.value)}
        icon="restaurant_menu"
      />
      <InputField
        label="% desconto VA"
        id="mealAllowanceDiscountRate"
        value={config.mealAllowanceDiscountRate}
        onChange={(event) => updateField('mealAllowanceDiscountRate', event.target.value)}
        icon="percent"
      />
      <InputField
        label="VT por dia (R$)"
        id="transportPerDay"
        value={config.transportPerDay}
        onChange={(event) => updateField('transportPerDay', event.target.value)}
        icon="directions_bus"
      />
      <InputField
        label="Máximo VT (% salário)"
        id="transportMaxPercent"
        value={config.transportMaxPercent}
        onChange={(event) => updateField('transportMaxPercent', event.target.value)}
        icon="savings"
      />
      <InputField
        label="Dependentes IRRF"
        id="dependents"
        type="number"
        value={config.dependents}
        onChange={(event) => updateField('dependents', event.target.value)}
        icon="people"
        min="0"
      />
      <InputField
        label="Outros descontos padrão (R$)"
        id="otherDeductionsDefault"
        value={config.otherDeductionsDefault}
        onChange={(event) => updateField('otherDeductionsDefault', event.target.value)}
        icon="money_off"
      />
      <InputField
        label="Dia do lançamento"
        id="launchDay"
        type="number"
        value={config.launchDay}
        onChange={(event) => updateField('launchDay', event.target.value)}
        icon="calendar_today"
        min="1"
        max="31"
      />
      <SelectField
        label="1ª parcela do 13º"
        id="thirteenthFirstMonthIndex"
        value={config.thirteenthFirstMonthIndex}
        onChange={(event) => updateField('thirteenthFirstMonthIndex', event.target.value)}
        options={monthOptions}
      />
      <SelectField
        label="2ª parcela do 13º"
        id="thirteenthSecondMonthIndex"
        value={config.thirteenthSecondMonthIndex}
        onChange={(event) => updateField('thirteenthSecondMonthIndex', event.target.value)}
        options={monthOptions}
      />
    </div>
  );

  if (isLoading) {
    return (
      <>
        <Navigation
          title="Calculadora de Salário"
          onBack={() => navigate(-1)}
          onNext={() => navigate(-1)}
        />

        <div className="main-content">
          <div className="container">
            <Card>
              <span className="card-title">Carregando planejamento salarial...</span>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation
        title="Calculadora de Salário"
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <div className="main-content">
        <div className="container">
          <Card>
            <span className="card-title">Planejamento Salarial {selectedYear || ''}</span>
            <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary, #666)' }}>
              A projeção abaixo replica a estrutura da planilha anual: reajuste, férias, 13º e descontos.
              O valor de lançamento usa o recebimento total do mês, incluindo adiantamento de férias quando existir.
            </p>
            {renderBaseFieldGrid()}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <button type="button" className="btn" onClick={handleSavePlanning} disabled={isSaving || isApplying}>
                {isSaving ? 'Salvando...' : 'Salvar planejamento'}
              </button>
              <button type="button" className="btn btn-nav" onClick={handleApplyToMonths} disabled={isSaving || isApplying}>
                {isApplying ? 'Lançando salários...' : 'Lançar salários nos meses'}
              </button>
            </div>
            {statusMessage && (
              <p style={{ marginTop: '1rem', color: 'var(--color-primary)' }}>{statusMessage}</p>
            )}
          </Card>

          <Card>
            <span className="card-title">Períodos de Férias</span>
            <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary, #666)' }}>
              Em vez de preencher férias mês a mês, defina cada período uma única vez. A página distribui os dias automaticamente nos meses afetados.
            </p>
            {config.vacationPeriods.length === 0 && (
              <p style={{ marginBottom: '1rem' }}>Nenhum período cadastrado.</p>
            )}
            {config.vacationPeriods.map((period, index) => (
              <div
                key={period.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <strong>Período {index + 1}</strong>
                  <button type="button" className="btn red" onClick={() => removeVacationPeriod(period.id)}>
                    Remover
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <SelectField
                    label="Mês de início"
                    id={`vacation-start-month-${period.id}`}
                    value={period.startMonthIndex}
                    onChange={(event) => updateVacationPeriod(period.id, 'startMonthIndex', event.target.value)}
                    options={monthOptions}
                    placeholder="Selecione o mês"
                  />
                  <InputField
                    label="Dia de início"
                    id={`vacation-start-day-${period.id}`}
                    type="number"
                    value={period.startDay}
                    onChange={(event) => updateVacationPeriod(period.id, 'startDay', event.target.value)}
                    icon="today"
                    min="1"
                    max="30"
                  />
                  <InputField
                    label="Dias de férias"
                    id={`vacation-total-days-${period.id}`}
                    type="number"
                    value={period.totalDays}
                    onChange={(event) => updateVacationPeriod(period.id, 'totalDays', event.target.value)}
                    icon="calendar_month"
                    min="0"
                    max="90"
                  />
                  <InputField
                    label="Abono pecuniário (dias)"
                    id={`vacation-abono-days-${period.id}`}
                    type="number"
                    value={period.abonoDays}
                    onChange={(event) => updateVacationPeriod(period.id, 'abonoDays', event.target.value)}
                    icon="sell"
                    min="0"
                    max="30"
                  />
                  <InputField
                    label="Média H.Extras Férias"
                    id={`vacation-extra-hours-${period.id}`}
                    value={period.averageVacationExtraHours}
                    onChange={(event) => updateVacationPeriod(period.id, 'averageVacationExtraHours', event.target.value)}
                    icon="bolt"
                  />
                  <InputField
                    label="Média H.Extras Abono"
                    id={`vacation-abono-extra-hours-${period.id}`}
                    value={period.averageAbonoExtraHours}
                    onChange={(event) => updateVacationPeriod(period.id, 'averageAbonoExtraHours', event.target.value)}
                    icon="flare"
                  />
                </div>
              </div>
            ))}
            <button type="button" className="btn" onClick={addVacationPeriod}>
              + Adicionar período de férias
            </button>
          </Card>

          <Card>
            <span className="card-title">Ajustes Mensais</span>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Mês</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Dias VT</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>H.Extras 50%</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>H.Extras 100%</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>VA do mês</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Outros descontos</th>
                  </tr>
                </thead>
                <tbody>
                  {monthsLowercase.map((monthKey, index) => {
                    const override = config.monthlyOverrides[monthKey];

                    return (
                      <tr key={monthKey} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem' }}>{monthsPT[index]}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            value={override.transportDays}
                            onChange={(event) => updateMonthlyOverride(monthKey, 'transportDays', event.target.value)}
                            style={{ width: '100%' }}
                            min="0"
                            max="31"
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            value={override.extra50Hours}
                            onChange={(event) => updateMonthlyOverride(monthKey, 'extra50Hours', event.target.value)}
                            style={{ width: '100%' }}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            value={override.extra100Hours}
                            onChange={(event) => updateMonthlyOverride(monthKey, 'extra100Hours', event.target.value)}
                            style={{ width: '100%' }}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            value={override.mealAllowanceAmount}
                            onChange={(event) => updateMonthlyOverride(monthKey, 'mealAllowanceAmount', event.target.value)}
                            style={{ width: '100%' }}
                            min="0"
                            step="0.01"
                            placeholder="Automático"
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            value={override.otherDeductions}
                            onChange={(event) => updateMonthlyOverride(monthKey, 'otherDeductions', event.target.value)}
                            style={{ width: '100%' }}
                            min="0"
                            step="0.01"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <span className="card-title">Resumo Anual</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Total líquido da folha</strong>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{projection.summary.formatted.totalNetPayroll}</p>
              </div>
              <div>
                <strong>Total efetivamente recebido</strong>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-success)' }}>{projection.summary.formatted.totalReceived}</p>
              </div>
              <div>
                <strong>Total de férias e abonos</strong>
                <p style={{ fontSize: '1.2rem' }}>{projection.summary.formatted.totalVacation}</p>
              </div>
              <div>
                <strong>Total do 13º</strong>
                <p style={{ fontSize: '1.2rem' }}>{projection.summary.formatted.totalThirteenth}</p>
              </div>
              <div>
                <strong>Total FGTS</strong>
                <p style={{ fontSize: '1.2rem' }}>{projection.summary.formatted.totalFgts}</p>
              </div>
            </div>
          </Card>

          <Card>
            <span className="card-title">Projeção Mês a Mês</span>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1080px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Mês</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Dias trabalhados</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Férias</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Salário base</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Proventos</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Descontos</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Líquido folha</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Recebimento total</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Lançamento</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.months.map((month) => (
                    <tr key={month.monthKey} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>{month.monthLabel}</td>
                      <td style={{ padding: '0.75rem' }}>{month.workedDays}</td>
                      <td style={{ padding: '0.75rem' }}>{month.vacationDays}</td>
                      <td style={{ padding: '0.75rem' }}>{month.formatted.monthSalary}</td>
                      <td style={{ padding: '0.75rem' }}>{month.formatted.totalProvents}</td>
                      <td style={{ padding: '0.75rem' }}>{month.formatted.totalDiscounts}</td>
                      <td style={{ padding: '0.75rem' }}>{month.formatted.netPayroll}</td>
                      <td style={{ padding: '0.75rem' }}>{month.formatted.totalReceived}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--color-primary)' }}>{month.formatted.launchAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
