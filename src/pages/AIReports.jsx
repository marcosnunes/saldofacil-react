import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useYear } from "../contexts/YearContext";
import { useAuth } from "../contexts/AuthContext";
import { Navigation } from "../components";
import { fetchAndSaveDataForAI } from "../utils/helpers";

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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

  // Efeito para buscar os dados ao carregar a página
  useEffect(() => {
    const year = getYear();
    if (user && year) {
      setIsDataReady(false);
      setReport("Preparando dados para análise...");
      // Executa em IIFE async para usar await
      (async () => {
        try {
          // Logs dos caminhos que serão consultados no RTDB (úteis para debug)
          console.log("[AIReports] Caminhos consultados:");
          console.log("users/" + user.uid);
          console.log("creditCardData/" + user.uid + "/" + year);
          console.log("investments/" + user.uid + "/" + year);
          console.log("tithes/" + user.uid + "/" + year);

          const result = await fetchAndSaveDataForAI(user.uid, year);
          if (result) {
            setIsDataReady(true);
            setReport("Olá! Eu sou o Gemini. Pergunte-me sobre seus gastos.");
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

  // Efeito para rolar para o final da conversa
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [report]);

  // Busca dados do Local Storage (exatamente igual ao HTML)
  function loadDataFromLocalStorage() {
    try {
      const year = getYear();
      const key = `report_data_${year}`;
      const jsonData = localStorage.getItem(key);
      if (jsonData) {
        return JSON.parse(jsonData);
      } else {
        // fallback: talvez o helper retornou em memória, mas não conseguiu gravar; tentar nada
        return null;
      }
    } catch {
      return null;
    }
  }

  async function askGemini(e) {
    e.preventDefault();
    const year = getYear();

    // LOG EXTRA: Mostra o JSON salvo no localStorage
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
      setReport("Erro: API KEY Gemini não configurada.");
      return;
    }

    setReport(`
      Pensando...
      [....]
    `);
    setLoading(true);

    try {
      const dadosDoUsuario = loadDataFromLocalStorage();

      // Otimizado: usa apenas summary para economizar tokens
      const contextoDosDados = dadosDoUsuario
        ? (dadosDoUsuario.summary
          ? `RESUMO:\n${JSON.stringify(dadosDoUsuario.summary, null, 2)}`
          : JSON.stringify(dadosDoUsuario, null, 2)
        )
        : "Não há dados de gastos disponíveis.";

      const prompt = `
        Você é um assistente financeiro. 
        Analise os seguintes dados do usuário (em formato JSON):
        
        --- Início dos Dados ---
        ${contextoDosDados}
        --- Fim dos Dados ---
        
        Com base APENAS nos dados fornecidos acima, 
        responda à seguinte pergunta do usuário:
        "${question}"
      `;

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      // Quebra linhas como no HTML (pode melhorar com Markdown depois)
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
                onSubmit={askGemini}
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
                        askGemini(e);
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