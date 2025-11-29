
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, InputField } from '../components';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

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
    const faixas = [
      { limite: 1518.00, aliquota: 0.075, deducao: 0 },
      { limite: 2793.88, aliquota: 0.09, deducao: 22.77 },
      { limite: 4190.83, aliquota: 0.12, deducao: 106.59 },
      { limite: 8157.41, aliquota: 0.14, deducao: 190.42 }
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
    const deducaoDependente = 189.59;
    const base = baseCalculo - (numDependentes * deducaoDependente) - deducoes;

    if (base <= 0) return 0;

    const faixas = [
      { limite: 2428.80, aliquota: 0, deducao: 0 },
      { limite: 2826.65, aliquota: 0.075, deducao: 182.16 },
      { limite: 3751.05, aliquota: 0.15, deducao: 394.16 },
      { limite: 4664.68, aliquota: 0.225, deducao: 712.73 },
      { limite: Infinity, aliquota: 0.275, deducao: 908.73 }
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

      <Box sx={{ py: 4, px: { xs: 1, sm: 2 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Simulador de Salário Líquido</Typography>
              <Box component="form" onSubmit={handleCalculate} sx={{ mb: 2 }}>
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
                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                  Calcular Salário Líquido
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Demonstrativo</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1"><b>(+) Salário Bruto:</b> <span style={{ color: '#43a047', fontWeight: 700 }}>{results.salarioBrutoInicial}</span></Typography>
                <Typography variant="body2">(+) Base de Cálculo IRRF: <span style={{ color: '#fb8c00' }}>{results.salarioBaseCalculo}</span></Typography>
                <Typography variant="body2">(-) Desconto INSS: <span style={{ color: '#fb8c00' }}>{results.descontoINSS}</span></Typography>
                <Typography variant="body2">(-) Desconto IRRF: <span style={{ color: '#fb8c00' }}>{results.descontoIRRF}</span></Typography>
                <Typography variant="body2">(-) Desconto VT: <span style={{ color: '#fb8c00' }}>{results.descontoVT}</span></Typography>
                <Typography variant="body2">(-) Desconto VA: <span style={{ color: '#fb8c00' }}>{results.descontoVA}</span></Typography>
                <Box sx={{ borderTop: '1px solid #eee', my: 2 }} />
                <Typography variant="h6" color="primary" fontWeight={700}>(=) Salário Líquido: {results.salarioLiquido}</Typography>
                <Box sx={{ borderTop: '1px solid #eee', my: 2 }} />
                <Typography variant="h6" color="success.main" fontWeight={700}>Total a Receber (Líquido + Benefícios): {results.totalcomBeneficios}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
