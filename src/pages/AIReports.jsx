import { useState } from 'react';
import { Navigation, Card } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';
import { monthsLowercase, monthsPT } from '../utils/helpers';
import ReactMarkdown from 'react-markdown';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

export default function AIReports() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllData = async () => {
    if (!user) return null;

    const yearData = {};
    for (let i = 0; i < monthsLowercase.length; i++) {
      const monthKey = monthsLowercase[i];
      const monthName = monthsPT[i];
      const monthRef = ref(database, `users/${user.uid}/${monthKey}-${selectedYear}`);
      const snapshot = await get(monthRef);
      if (snapshot.exists()) {
        yearData[monthName] = snapshot.val();
      }
    }
    return yearData;
  };

  const handleGenerateReport = async () => {
    if (!API_KEY || API_KEY === "SUA_CHAVE_API_GEMINI_AQUI") {
      alert("Por favor, configure sua chave da API do Gemini no arquivo .env");
      return;
    }

    setIsLoading(true);
    setReport('');

    try {
      const data = await fetchAllData();
      if (!data || Object.keys(data).length === 0) {
        setReport("Não há dados suficientes para gerar um relatório. Por favor, adicione transações nos meses para obter uma análise.");
        setIsLoading(false);
        return;
      }

      let prompt = `Aja como um especialista em finanças e analise os seguintes dados financeiros de um usuário para o ano de ${selectedYear}. Forneça insights, um resumo geral e sugestões de melhoria. Seja detalhado e use formatação em markdown.\n\n`;

      for (const monthName in data) {
        const monthData = data[monthName];
        prompt += `--- Mês: ${monthName} ---\n`;
        prompt += `Saldo Inicial: ${monthData.initialBalance || 'Não informado'}\n`;
        
        if (monthData.transactions && monthData.transactions.length > 0) {
          prompt += "Lançamentos:\n";
          monthData.transactions.forEach(t => {
            prompt += `- Dia ${t.day}: ${t.description} | Crédito: ${t.credit || 0} | Débito: ${t.debit || 0}\n`;
          });
        }
        
        prompt += `Total Crédito: ${monthData.totalCredit || 0}\n`;
        prompt += `Total Débito: ${monthData.totalDebit || 0}\n`;
        prompt += `Balanço do Mês: ${monthData.balance || 0}\n`;
        prompt += `Saldo Final: ${monthData.finalBalance || 0}\n\n`;
      }

      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const responseData = await response.json();
      const insights = responseData.candidates[0].content.parts[0].text;
      setReport(insights);

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      setReport(`Ocorreu um erro ao gerar o relatório: ${error.message}. Verifique sua chave de API e a conexão com a internet.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation title="Relatórios com IA" />
      <div className="main-content">
        <div className="container">
          <Card>
            <span className="card-title">Análise Financeira Inteligente</span>
            <p style={{ marginBottom: '1.5rem' }}>
              Clique no botão abaixo para que nossa inteligência artificial analise seus dados financeiros do ano de {selectedYear} e gere insights e recomendações personalizadas para você.
            </p>
            <button className="btn" onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? 'Analisando...' : 'Gerar Relatório'}
            </button>
          </Card>

          {report && (
            <Card>
              <div className="markdown-content">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
