import { useState, useRef, useEffect } from "react";
import { useNavigate }from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useYear } from "../contexts/YearContext";
import { Navigation } from "../components";

const MODEL_NAME = "gemini-2.5-pro";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AIReports() {
  const { selectedYear } = useYear();
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Efeito inicial, mostra mensagem padrão
  useEffect(() => {
    if (selectedYear) {
      setReport("Olá! Eu sou o Gemini. Pergunte-me sobre seus gastos.");
    } else {
      setReport("Erro: Ano não especificado na URL.");
    }
  }, [selectedYear]);

  // Efeito para rolar para o final da conversa
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [report]);

  // Busca dados do Local Storage (exatamente igual ao HTML)
  function loadDataFromLocalStorage() {
    try {
      const key = `report_data_${selectedYear}`;
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

  async function askGemini(e) {
    e.preventDefault();
    if (!question) {
      setReport("Por favor, digite uma pergunta.");
      return;
    }
    if (!selectedYear) {
      setReport("Erro: Ano não especificado na URL.");
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

      const contextoDosDados = dadosDoUsuario
        ? JSON.stringify(dadosDoUsuario, null, 2)
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
        `<span style="color: red;">Desculpe, ocorreu um erro ao processar sua pergunta.</span>`
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
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                className="input-field"
                style={{ display: "flex", alignItems: "center", gap: "1rem", margin: 0 }}
                onSubmit={askGemini}
              >
                <span className="material-icons prefix" style={{fontSize: 24}}>psychology</span>
                <input
                  type="text"
                  placeholder="Faça uma pergunta sobre seus gastos..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  disabled={loading}
                  style={{ flex: 1, margin: 0 }}
                />
                <button type="submit" className="btn" disabled={loading}>
                  <span className="material-icons">send</span>
                </button>
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