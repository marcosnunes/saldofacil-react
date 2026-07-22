import { monthsLowercase, monthsPT, formatCurrency } from './helpers';
import rawTaxTables from '../data/salaryTaxTables.json';

function normalizeBracket(bracket) {
  return {
    limit: bracket.limit === null || bracket.limit === undefined ? Infinity : Number(bracket.limit),
    rate: Number(bracket.rate) || 0,
    deduction: Number(bracket.deduction) || 0
  };
}

function normalizeTaxTables(source) {
  return Object.fromEntries(
    Object.entries(source).map(([year, tables]) => [
      year,
      {
        ...tables,
        inss: Array.isArray(tables.inss) ? tables.inss.map(normalizeBracket) : [],
        irrf: Array.isArray(tables.irrf) ? tables.irrf.map(normalizeBracket) : [],
        irrfExemptionFloor: Number(tables.irrfExemptionFloor) || 0,
        dependentDeduction: Number(tables.dependentDeduction) || 0
      }
    ])
  );
}

const TAX_TABLES_BY_YEAR = normalizeTaxTables(rawTaxTables);

const DEFAULT_TRANSPORT_DAYS = [20, 16, 22, 21, 20, 22, 22, 22, 22, 21, 22, 23];

function toNumber(value, fallback = 0) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;

    const normalized = trimmed.includes(',') && trimmed.includes('.')
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed.replace(',', '.');
    if (!normalized) return fallback;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resolveYearTables(year) {
  const supportedYears = Object.keys(TAX_TABLES_BY_YEAR)
    .map(Number)
    .sort((a, b) => a - b);

  if (supportedYears.includes(year)) {
    return TAX_TABLES_BY_YEAR[year];
  }

  if (year < supportedYears[0]) {
    return TAX_TABLES_BY_YEAR[supportedYears[0]];
  }

  return TAX_TABLES_BY_YEAR[supportedYears[supportedYears.length - 1]];
}

function calculateBracketTax(baseValue, table) {
  const base = toNumber(baseValue);
  if (base <= 0) return 0;

  for (const bracket of table) {
    if (base <= bracket.limit) {
      return roundCurrency(Math.max(0, (base * bracket.rate) - bracket.deduction));
    }
  }

  const lastBracket = table[table.length - 1];
  return roundCurrency(Math.max(0, (base * lastBracket.rate) - lastBracket.deduction));
}

function createMonthOverride(index) {
  return {
    transportDays: String(DEFAULT_TRANSPORT_DAYS[index] || 22),
    extra50Hours: '0',
    extra100Hours: '0',
    otherDeductions: '0',
    mealAllowanceAmount: ''
  };
}

export function createEmptyVacationPeriod() {
  return {
    id: `vac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startMonthIndex: '',
    startDay: '1',
    totalDays: '0',
    abonoDays: '0',
    averageVacationExtraHours: '0',
    averageAbonoExtraHours: '0'
  };
}

export function createDefaultSalaryConfig() {
  return {
    employeeName: '',
    baseSalary: '4863,11',
    monthlyHours: '220',
    hoursPerDay: '7,333333',
    raisePercent: '7,71',
    raiseMonthIndex: '2',
    mealAllowanceJanToMar: '805',
    mealAllowanceAprToDec: '900',
    mealAllowanceDiscountRate: '20',
    transportPerDay: '12',
    transportMaxPercent: '6',
    launchDay: '5',
    dependents: '0',
    otherDeductionsDefault: '0',
    thirteenthFirstMonthIndex: '10',
    thirteenthSecondMonthIndex: '11',
    monthlyOverrides: Object.fromEntries(
      monthsLowercase.map((monthKey, index) => [monthKey, createMonthOverride(index)])
    ),
    vacationPeriods: []
  };
}

export function mergeSalaryConfig(savedConfig = {}) {
  const defaults = createDefaultSalaryConfig();
  const savedOverrides = savedConfig.monthlyOverrides || {};

  return {
    ...defaults,
    ...savedConfig,
    monthlyOverrides: Object.fromEntries(
      monthsLowercase.map((monthKey, index) => [
        monthKey,
        {
          ...createMonthOverride(index),
          ...(savedOverrides[monthKey] || {})
        }
      ])
    ),
    vacationPeriods: Array.isArray(savedConfig.vacationPeriods)
      ? savedConfig.vacationPeriods.map((period) => ({ ...createEmptyVacationPeriod(), ...period }))
      : []
  };
}

function buildVacationDistribution(periods) {
  const distribution = monthsLowercase.map(() => ({
    vacationDays: 0,
    abonoDays: 0,
    vacationExtraHours: 0,
    abonoExtraHours: 0,
    periods: []
  }));

  for (const rawPeriod of periods) {
    const monthIndex = Number(rawPeriod.startMonthIndex);
    const startDay = clamp(Math.round(toNumber(rawPeriod.startDay, 1)), 1, 30);
    const totalDays = clamp(Math.round(toNumber(rawPeriod.totalDays, 0)), 0, 90);

    if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11 || totalDays <= 0) {
      continue;
    }

    const period = {
      ...rawPeriod,
      startMonthIndex: monthIndex,
      startDay,
      totalDays,
      abonoDays: clamp(Math.round(toNumber(rawPeriod.abonoDays, 0)), 0, 30),
      averageVacationExtraHours: toNumber(rawPeriod.averageVacationExtraHours, 0),
      averageAbonoExtraHours: toNumber(rawPeriod.averageAbonoExtraHours, 0)
    };

    let remainingDays = totalDays;
    let currentMonthIndex = monthIndex;
    let currentStartDay = startDay;

    while (remainingDays > 0 && currentMonthIndex < 12) {
      const availableDays = 30 - currentStartDay + 1;
      const allocatedDays = Math.min(remainingDays, availableDays);
      distribution[currentMonthIndex].vacationDays += allocatedDays;
      distribution[currentMonthIndex].periods.push({
        id: period.id,
        allocatedDays,
        startsHere: currentMonthIndex === monthIndex
      });

      if (currentMonthIndex === monthIndex) {
        distribution[currentMonthIndex].abonoDays += period.abonoDays;
        distribution[currentMonthIndex].vacationExtraHours += period.averageVacationExtraHours;
        distribution[currentMonthIndex].abonoExtraHours += period.averageAbonoExtraHours;
      }

      remainingDays -= allocatedDays;
      currentMonthIndex += 1;
      currentStartDay = 1;
    }
  }

  return distribution;
}

export function buildSalaryProjection(config, year) {
  const safeConfig = mergeSalaryConfig(config);
  const numericYear = Number(year);
  const taxTables = resolveYearTables(numericYear);
  const vacationByMonth = buildVacationDistribution(safeConfig.vacationPeriods);

  const baseSalary = toNumber(safeConfig.baseSalary);
  const monthlyHours = toNumber(safeConfig.monthlyHours, 220);
  const hoursPerDay = toNumber(safeConfig.hoursPerDay, 7.3333333333);
  const raisePercent = toNumber(safeConfig.raisePercent) / 100;
  const raiseMonthIndex = clamp(Math.round(toNumber(safeConfig.raiseMonthIndex, 2)), 0, 11);
  const adjustedSalary = roundCurrency(baseSalary * (1 + raisePercent));
  const mealAllowanceJanToMar = toNumber(safeConfig.mealAllowanceJanToMar);
  const mealAllowanceAprToDec = toNumber(safeConfig.mealAllowanceAprToDec);
  const mealDiscountRate = toNumber(safeConfig.mealAllowanceDiscountRate) / 100;
  const transportPerDay = toNumber(safeConfig.transportPerDay);
  const transportMaxPercent = toNumber(safeConfig.transportMaxPercent) / 100;
  const dependents = clamp(Math.round(toNumber(safeConfig.dependents, 0)), 0, 99);
  const otherDefault = toNumber(safeConfig.otherDeductionsDefault);
  const firstThirteenthMonth = clamp(Math.round(toNumber(safeConfig.thirteenthFirstMonthIndex, 10)), 0, 11);
  const secondThirteenthMonth = clamp(Math.round(toNumber(safeConfig.thirteenthSecondMonthIndex, 11)), 0, 11);

  const months = monthsLowercase.map((monthKey, monthIndex) => {
    const override = safeConfig.monthlyOverrides?.[monthKey] || createMonthOverride(monthIndex);
    const monthVacation = vacationByMonth[monthIndex];
    const monthSalary = monthIndex >= raiseMonthIndex ? adjustedSalary : baseSalary;
    const hourlyRate = monthlyHours > 0 ? monthSalary / monthlyHours : 0;
    const vacationDays = clamp(monthVacation.vacationDays, 0, 30);
    const workedDays = clamp(30 - vacationDays, 0, 30);
    const workedHours = roundCurrency(workedDays * hoursPerDay);
    const extra50Hours = toNumber(override.extra50Hours);
    const extra100Hours = toNumber(override.extra100Hours);
    const vacationHours = roundCurrency(vacationDays * hoursPerDay);
    const abonoDays = monthVacation.abonoDays;
    const abonoHours = roundCurrency(abonoDays * hoursPerDay);
    const vacationExtraHours = monthVacation.vacationExtraHours;
    const abonoExtraHours = monthVacation.abonoExtraHours;

    const regularSalary = roundCurrency(workedHours * hourlyRate);
    const extra50Amount = roundCurrency(extra50Hours * hourlyRate * 1.5);
    const extra100Amount = roundCurrency(extra100Hours * hourlyRate * 2);
    const vacationAmount = roundCurrency(vacationHours * hourlyRate);
    const vacationThird = roundCurrency(vacationAmount / 3);
    const abonoAmount = roundCurrency(abonoHours * hourlyRate);
    const abonoThird = roundCurrency(abonoAmount / 3);
    const vacationExtraAmount = roundCurrency(vacationExtraHours * hourlyRate);
    const abonoExtraAmount = roundCurrency(abonoExtraHours * hourlyRate);

    const thirteenthAmount = firstThirteenthMonth === monthIndex || secondThirteenthMonth === monthIndex
      ? roundCurrency(regularSalary / 2)
      : 0;

    const totalProvents = roundCurrency(
      regularSalary +
      extra50Amount +
      extra100Amount +
      vacationAmount +
      vacationThird +
      abonoAmount +
      abonoThird +
      vacationExtraAmount +
      abonoExtraAmount +
      thirteenthAmount
    );

    const inssSalaryBase = roundCurrency(regularSalary + extra50Amount + extra100Amount);
    const inssVacationBase = roundCurrency(vacationAmount + vacationThird + vacationExtraAmount);
    const inssThirteenthBase = roundCurrency(thirteenthAmount);
    const inssSalary = calculateBracketTax(inssSalaryBase, taxTables.inss);
    const inssVacation = calculateBracketTax(inssVacationBase, taxTables.inss);
    const inssThirteenth = calculateBracketTax(inssThirteenthBase, taxTables.inss);

    const irrfComponents = roundCurrency(
      regularSalary + extra50Amount + extra100Amount + vacationAmount + vacationThird + vacationExtraAmount
    );
    const irrfDeductions = roundCurrency(dependents * taxTables.dependentDeduction);
    const irrfBase = Math.max(0, roundCurrency(irrfComponents - irrfDeductions));
    const irrfExemptionFloor = numericYear >= 2026 ? 5000 : taxTables.irrfExemptionFloor;
    const irrf = irrfBase < irrfExemptionFloor
      ? 0
      : calculateBracketTax(irrfBase, taxTables.irrf);

    const mealAllowanceAmount = toNumber(
      override.mealAllowanceAmount,
      monthIndex <= 2 ? mealAllowanceJanToMar : mealAllowanceAprToDec
    );
    const mealDiscount = roundCurrency(mealAllowanceAmount * mealDiscountRate);
    const transportDays = clamp(Math.round(toNumber(override.transportDays, DEFAULT_TRANSPORT_DAYS[monthIndex] || 22)), 0, 31);
    const transportDiscount = roundCurrency(
      Math.min(transportDays * transportPerDay, regularSalary * transportMaxPercent)
    );
    const otherDeductions = roundCurrency(toNumber(override.otherDeductions, otherDefault));

    const vacationAdvance = vacationDays > 0 || abonoDays > 0
      ? roundCurrency(
        vacationAmount + vacationThird + abonoAmount + abonoThird + vacationExtraAmount + abonoExtraAmount - inssVacation
      )
      : 0;

    const totalDiscounts = roundCurrency(
      inssSalary +
      inssVacation +
      inssThirteenth +
      irrf +
      mealDiscount +
      transportDiscount +
      otherDeductions +
      vacationAdvance
    );
    const netPayroll = roundCurrency(totalProvents - totalDiscounts);
    const totalReceived = roundCurrency(netPayroll + vacationAdvance);
    const fgts = roundCurrency((regularSalary + vacationAmount + vacationThird + vacationExtraAmount) * 0.08);

    return {
      monthIndex,
      monthKey,
      monthLabel: monthsPT[monthIndex],
      monthSalary,
      hourlyRate: roundCurrency(hourlyRate),
      workedDays,
      workedHours,
      vacationDays,
      vacationHours,
      abonoDays,
      extra50Hours,
      extra100Hours,
      transportDays,
      mealAllowanceAmount,
      regularSalary,
      extra50Amount,
      extra100Amount,
      vacationAmount,
      vacationThird,
      abonoAmount,
      abonoThird,
      vacationExtraAmount,
      abonoExtraAmount,
      thirteenthAmount,
      totalProvents,
      inssSalary,
      inssVacation,
      inssThirteenth,
      irrfBase,
      irrf,
      mealDiscount,
      transportDiscount,
      otherDeductions,
      vacationAdvance,
      totalDiscounts,
      netPayroll,
      totalReceived,
      launchAmount: totalReceived,
      fgts,
      formatted: {
        monthSalary: formatCurrency(monthSalary),
        regularSalary: formatCurrency(regularSalary),
        totalProvents: formatCurrency(totalProvents),
        totalDiscounts: formatCurrency(totalDiscounts),
        netPayroll: formatCurrency(netPayroll),
        totalReceived: formatCurrency(totalReceived),
        launchAmount: formatCurrency(totalReceived),
        fgts: formatCurrency(fgts)
      }
    };
  });

  const summary = months.reduce((accumulator, month) => {
    accumulator.totalNetPayroll += month.netPayroll;
    accumulator.totalReceived += month.totalReceived;
    accumulator.totalFgts += month.fgts;
    accumulator.totalThirteenth += month.thirteenthAmount;
    accumulator.totalVacation += month.vacationAmount + month.vacationThird + month.abonoAmount + month.abonoThird;
    return accumulator;
  }, {
    totalNetPayroll: 0,
    totalReceived: 0,
    totalFgts: 0,
    totalThirteenth: 0,
    totalVacation: 0
  });

  return {
    months,
    summary: {
      totalNetPayroll: roundCurrency(summary.totalNetPayroll),
      totalReceived: roundCurrency(summary.totalReceived),
      totalFgts: roundCurrency(summary.totalFgts),
      totalThirteenth: roundCurrency(summary.totalThirteenth),
      totalVacation: roundCurrency(summary.totalVacation),
      formatted: {
        totalNetPayroll: formatCurrency(summary.totalNetPayroll),
        totalReceived: formatCurrency(summary.totalReceived),
        totalFgts: formatCurrency(summary.totalFgts),
        totalThirteenth: formatCurrency(summary.totalThirteenth),
        totalVacation: formatCurrency(summary.totalVacation)
      }
    },
    taxTables
  };
}

export function sortTransactionsByDay(transactions = []) {
  return [...transactions].sort((first, second) => {
    const firstDay = Number(first.day) || 0;
    const secondDay = Number(second.day) || 0;

    if (firstDay !== secondDay) {
      return firstDay - secondDay;
    }

    return String(first.description || '').localeCompare(String(second.description || ''));
  });
}

export function recalculateMonthData(monthData = {}) {
  const initialBalance = Number(monthData.initialBalance) || 0;
  const creditCardBalance = Number(monthData.creditCardBalance) || 0;
  const investmentTotal = Number(monthData.investmentTotal) || 0;
  const transactions = monthData.transactions ? Object.values(monthData.transactions) : [];

  let tithe = 0;
  let totalCredit = 0;
  let transactionDebitTotal = 0;

  transactions.forEach((transaction) => {
    totalCredit += Number(transaction.credit) || 0;
    transactionDebitTotal += Number(transaction.debit) || 0;

    if (transaction.credit && transaction.tithe) {
      tithe += Number(transaction.credit) * 0.1;
    }
  });

  const totalOutflow = transactionDebitTotal + creditCardBalance - investmentTotal;
  const finalBalance = initialBalance + totalCredit - totalOutflow;
  const balance = totalCredit - totalOutflow;
  const percentage = totalCredit > 0 ? (totalOutflow / totalCredit) * 100 : 0;

  return {
    ...monthData,
    transactions,
    initialBalance: initialBalance.toFixed(2),
    creditCardBalance: creditCardBalance.toFixed(2),
    investmentTotal,
    tithe: tithe.toFixed(2),
    totalCredit: totalCredit.toFixed(2),
    totalDebit: totalOutflow.toFixed(2),
    finalBalance: finalBalance.toFixed(2),
    balance: balance.toFixed(2),
    percentage: `${percentage.toFixed(2)}%`
  };
}