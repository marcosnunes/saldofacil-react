import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Card, InputField } from '../components';

export default function SalaryCalculator() {
  const navigate = useNavigate();

  const [salarioBruto, setSalarioBruto] = useState('');
  const [valeTransporte, setValeTransporte] = useState('');
  const [valeAlimentacao, setValeAlimentacao] = useState('');
  const [dependentes, setDependentes] = useState('');
  const [outrasDeducoes, setOutrasDeducoes] = useState('');

  // Results
  const [results, setResults] = useState({
    salarioBrutoInicial: 'R$ 0,00',
    salarioBaseCalculo: 'R$ 0,00',
    descontoINSS: 'R$ 0,00',
    descontoIRRF: 'R$ 0,00',
    descontoVT: 'R$ 0,00',
    descontoVA: 'R$ 0,00',
    salarioLiquido: 'R$ 0,00',
    totalcomBeneficios: 'R$ 0,00'
  });

  const formatBRL = (value) => {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
  };

  const calcularINSS = (salario) => {
    // Fórmulas INSS 2026
    const faixas = [
      { limite: 1693.72, aliquota: 0.075, deducao: 0 },
      { limite: 3115.09, aliquota: 0.09, deducao: 25.41 },
      { limite: 4672.64, aliquota: 0.12, deducao: 118.87 },
      { limite: 9032.50, aliquota: 0.14, deducao: 212.18 }
    ];

    let inss = 0;

    for (const faixa of faixas) {
      if (salario <= faixa.limite) {
        inss = (salario * faixa.aliquota) - faixa.deducao;
        break;
      }
    }

    if (salario > faixas[faixas.length - 1].limite) {
      const lastFaixa = faixas[faixas.length - 1];
      inss = (lastFaixa.limite * lastFaixa.aliquota) - lastFaixa.deducao;
    }

    return Math.max(inss, 0);
  };

  const calcularIRRF = (baseCalculo, numDependentes, deducoes) => {
    // Dedução por dependente 2026
    const deducaoDependente = 359.05;
    const base = baseCalculo - (numDependentes * deducaoDependente) - deducoes;

    if (base <= 0) return 0;

    // Fórmulas IRRF 2026 - Isenção até R$ 5.000,00
    const faixas = [
      { limite: 5000.00, aliquota: 0, deducao: 0 },
      { limite: 6000.00, aliquota: 0.075, deducao: 375.00 },
      { limite: 7000.00, aliquota: 0.15, deducao: 675.00 },
      { limite: 8000.00, aliquota: 0.225, deducao: 1050.00 },
      { limite: Infinity, aliquota: 0.275, deducao: 1350.00 }
    ];

    let irrf = 0;

    for (const faixa of faixas) {
      if (base <= faixa.limite) {
        irrf = (base * faixa.aliquota) - faixa.deducao;
        break;
      }
    }

    return Math.max(irrf, 0);
  };

  const handleCalculate = (e) => {
    e.preventDefault();

    const bruto = parseFloat(salarioBruto.replace(',', '.')) || 0;
    const vt = parseFloat(valeTransporte.replace(',', '.')) || 0;
    const va = parseFloat(valeAlimentacao.replace(',', '.')) || 0;
    const deps = parseInt(dependentes) || 0;
    const outras = parseFloat(outrasDeducoes.replace(',', '.')) || 0;

    if (bruto <= 0) {
      alert('Digite um valor em reais verdadeiro.');
      return;
    }

    // Calculate VT and VA discounts
    const descontoVT = Math.min(bruto * 0.06, vt);
    const descontoVA = va * 0.20;

    // Calculate INSS
    const inss = calcularINSS(bruto);

    // Calculate IRRF
    const baseIRRF = bruto - inss;
    const irrf = calcularIRRF(baseIRRF, deps, outras);

    // Calculate base display
    const baseDisplay = bruto - inss - irrf;

    // Calculate net salary
    const salarioLiquido = bruto - inss - irrf - descontoVT - descontoVA;

    // Calculate total with benefits
    const totalBeneficios = salarioLiquido + vt + va;

    setResults({
      salarioBrutoInicial: formatBRL(bruto),
      salarioBaseCalculo: formatBRL(baseDisplay),
      descontoINSS: formatBRL(inss),
      descontoIRRF: formatBRL(irrf),
      descontoVT: `${formatBRL(descontoVT)} (${((descontoVT / bruto) * 100).toFixed(2).replace('.', ',')}%)`,
      descontoVA: `${formatBRL(descontoVA)} (${va > 0 ? ((descontoVA / va) * 100).toFixed(2).replace('.', ',') : '0,00'}%)`,
      salarioLiquido: formatBRL(salarioLiquido),
      totalcomBeneficios: formatBRL(totalBeneficios)
    });
  };

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
            <span className="card-title">Simulador de Salário Líquido</span>
            <form onSubmit={handleCalculate}>
              <InputField
                label="Salário Bruto (R$)"
                id="salarioBruto"
                value={salarioBruto}
                onChange={(e) => setSalarioBruto(e.target.value)}
                icon="attach_money"
                placeholder="Ex: 3500,00"
              />

              <InputField
                label="Benefício de Vale-Transporte (R$)"
                id="valeTransporte"
                value={valeTransporte}
                onChange={(e) => setValeTransporte(e.target.value)}
                icon="directions_bus"
                placeholder="Ex: 180,50"
              />

              <InputField
                label="Benefício de Vale-Alimentação (R$)"
                id="valeAlimentacao"
                value={valeAlimentacao}
                onChange={(e) => setValeAlimentacao(e.target.value)}
                icon="restaurant"
                placeholder="Ex: 450,00"
              />

              <InputField
                label="Número de Dependentes"
                id="dependentes"
                type="number"
                value={dependentes}
                onChange={(e) => setDependentes(e.target.value)}
                icon="people"
                placeholder="Digite 0 para nenhum"
                min="0"
              />

              <InputField
                label="Outros Descontos (R$)"
                id="outrasDeducoes"
                value={outrasDeducoes}
                onChange={(e) => setOutrasDeducoes(e.target.value)}
                icon="money_off"
                placeholder="Ex: 50,00"
              />

              <button type="submit" className="btn">Calcular Salário Líquido</button>
            </form>
          </Card>

          <Card>
            <span className="card-title">Demonstrativo</span>
            <div className="results-list">
              <p><strong>(+) Salário Bruto:</strong> <strong className="green-text">{results.salarioBrutoInicial}</strong></p>
              <p>(+) Base de Cálculo IRRF: <span className="orange-text">{results.salarioBaseCalculo}</span></p>
              <p>(-) Desconto INSS: <span className="orange-text">{results.descontoINSS}</span></p>
              <p>(-) Desconto IRRF: <span className="orange-text">{results.descontoIRRF}</span></p>
              <p>(-) Desconto VT: <span className="orange-text">{results.descontoVT}</span></p>
              <p>(-) Desconto VA: <span className="orange-text">{results.descontoVA}</span></p>
              <hr style={{ borderTop: '1px solid #eee', margin: '1rem 0' }} />
              <p style={{ fontSize: '1.2rem' }}>
                <strong>(=) Salário Líquido:</strong> <strong style={{ color: 'var(--color-primary)' }}>{results.salarioLiquido}</strong>
              </p>
              <hr style={{ borderTop: '1px solid #eee', margin: '1rem 0' }} />
              <p style={{ fontSize: '1.2rem' }}>
                <strong>Total a Receber (Líquido + Benefícios):</strong> <strong style={{ color: 'var(--color-success)' }}>{results.totalcomBeneficios}</strong>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
