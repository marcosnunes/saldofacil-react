import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Groq from "groq-sdk";
import { useYear } from "../contexts/YearContext";
import { useAuth } from "../contexts/AuthContext";
import { Navigation } from "../components";
import { fetchAndSaveDataForAI } from "../utils/helpers";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function AIReports() {
  const { user } = useAuth();
  const { selectedYear: yearFromContext } = useYear();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [question, setQuestion] = useState("");
  const [report, setReport] = useState("Preparando dados para análise...");
  const [loading, setLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const chatEndRef = useRef(null);

  const getYear = useCallback(() => searchParams.get("year") || yearFromContext, [searchParams, yearFromContext]);

  useEffect(() => {
    const year = getYear();
    if (user && year) {
      setIsDataReady(false);
      setReport("Preparando dados para análise...");
      (async () => {
        try {
          console.log("[AIReports] Caminhos consultados:");
          console.log("users/" + user.uid);
          console.log("creditCardData/" + user.uid + "/" + year);
          console.log("investments/" + user.uid + "/" + year);
          console.log("tithes/" + user.uid + "/" + year);

          const result = await fetchAndSaveDataForAI(user.uid, year);
          if (result) {
            setIsDataReady(true);
            setReport("Olá! Eu sou o assistente de IA. Pergunte-me sobre seus gastos.");
            console.log("[AIReports] Dados preparados para IA (salvos no localStorage ou retornados).");
          } else {
            setIsDataReady(false);
            setReport("Erro ao preparar dados para análise. Verifique o console para detalhes.");
            console.error("[AIReports] fetchAndSaveDataForAI retornou null/erro.");
          }
        } catch (err) {
          console.error("[AIReports] Erro ao preparar dados para IA:", err);
          setIsDataReady(false);
          setReport("Erro ao preparar dados para análise. Verifique o console para detalhes.");
        }
      })();
    } else if (!year) {
      setReport("Erro: Ano não especificado.");
    } else {
      setReport("Aguardando autenticação do usuário...");
    }
  }, [user, getYear]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [report]);

  function loadDataFromLocalStorage() {
    try {
      const year = getYear();
      const key = `report_data_${year}`;
      const jsonData = localStorage.getItem(key);
      if (jsonData) {
        return JSON.parse(jsonData);
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  async function askAI(e) {
    e.preventDefault();
    const year = getYear();

    const debugJson = localStorage.getItem(`report_data_${year}`);
    console.log('JSON para IA (localStorage):', debugJson);

    if (!question) {
      setReport("Por favor, digite uma pergunta.");
      return;
    }
    if (!year) {
      setReport("Erro: Ano não especificado.");
      return;
    }
    if (!API_KEY) {
      setReport("Erro: API KEY Groq não configurada.");
      return;
    }

    setReport(`Pensando...\n[....]`);
    setLoading(true);

    try {
      const dadosDoUsuario = loadDataFromLocalStorage();

      // Enviar dados completos para análise mais profunda
      const contextoDosDados = dadosDoUsuario
        ? JSON.stringify(dadosDoUsuario, null, 2)
        : "Não há dados de gastos disponíveis.";

      const groq = new Groq({
        apiKey: API_KEY,
        dangerouslyAllowBrowser: true
      });

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Você é um assistente financeiro especializado em análise de dados.
            
Você recebe dados financeiros completos incluindo:
- Créditos (receitas) e débitos (despesas) mensais detalhados
- Dados de cartão de crédito
- Investimentos
- Dízimos
- Resumos estatísticos

Sua função é:
1. Analisar padrões de gastos e receitas
2. Identificar oportunidades de economia
3. Sugerir melhorias na gestão financeira
4. Responder perguntas específicas sobre transações
5. Fornecer insights relevantes e acionáveis

Sempre seja claro, objetivo e forneça números específicos quando disponíveis.`
          },
          {
            role: "user",
            content: `Dados financeiros completos do ano ${year}:\n\n${contextoDosDados}\n\nPergunta: ${question}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000 // Aumentado para respostas mais completas
      });

      const text = completion.choices[0].message.content;
      setReport(text.replace(/\n/g, "<br>"));
    } catch (error) {
      console.error("Erro ao processar pergunta:", error);
      setReport(
        `<span style="color: red;">Desculpe, ocorreu um erro ao processar sua pergunta. ${error.message || ''}</span>`
      );
    } finally {
      setLoading(false);
      setQuestion("");
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navigation title="Análise com IA" onBack={() => navigate('/')} />

      <div className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              <div
                id="reportArea"
                dangerouslySetInnerHTML={{ __html: report }}
              />
              <div ref={chatEndRef} />
            </div>
            <div className="card-action" style={{ padding: '1rem' }}>
              <form
                className="ai-input-wrapper"
                style={{ margin: 0, width: '100%' }}
                onSubmit={askAI}
              >
                <div className="ai-input-container">
                  <span className="material-icons ai-input-icon">psychology</span>
                  <textarea
                    className="ai-input"
                    placeholder="Faça uma pergunta sobre seus gastos..."
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    disabled={loading || !isDataReady}
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        askAI(e);
                      }
                    }}
                  />
                  <button type="submit" className="btn" disabled={loading || !isDataReady}>
                    <span className="material-icons">send</span>
                  </button>
                </div>
              </form>
              {loading && (
                <div className="progress" style={{ marginTop: '1rem' }}>
                  <div className="indeterminate"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}