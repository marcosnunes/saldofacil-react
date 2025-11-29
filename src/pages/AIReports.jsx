import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-pro";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AIReports() {
  // Recupera o ano da URL, igual ao HTML
  const [searchParams] = useSearchParams();
  const selectedYear = searchParams.get("year");
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  // Efeito inicial, mostra mensagem padrão
  useEffect(() => {
    if (selectedYear) {
      setReport("Olá! Eu sou o Gemini. Pergunte-me sobre seus gastos.");
    } else {
      setReport("Erro: Ano não especificado na URL.");
    }
  }, [selectedYear]);

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

  // Gestos para navegação, igual ao HTML
  const touchstartX = useRef(0);
  const touchendX = useRef(0);
  const gestureZone = 50;

  function handleGesture() {
    if (
      touchendX.current < touchstartX.current &&
      Math.abs(touchendX.current - touchstartX.current) > gestureZone
    ) {
      navigate(1);
    }
    else if (
      touchendX.current > touchstartX.current &&
      Math.abs(touchendX.current - touchstartX.current) > gestureZone
    ) {
      navigate(-1);
    }
  }

  useEffect(() => {
    // Gestos touch
    function onTouchStart(e) {
      touchstartX.current = e.changedTouches[0].screenX;
    }
    function onTouchEnd(e) {
      touchendX.current = e.changedTouches[0].screenX;
      handleGesture();
    }
    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div>
      <nav className="navigation">
        <div className="nav-wrapper" style={{display: "flex", justifyContent:"space-between", alignItems: "center", padding: "1rem"}}>
          <button className="btn btn-default" onClick={() => navigate(-1)}>Voltar</button>
          <span className="brand-logo center">Análise com IA</span>
          <button className="btn btn-default" onClick={() => navigate(1)}>Próximo</button>
        </div>
      </nav>
      <div className="main-content">
        <div className="container" style={{maxWidth: 600, margin: "0 auto"}}>
          <div className="card">
            <div className="card-content">
              <div
                id="reportArea"
                style={{ minHeight: "120px", marginBottom: "1rem"}}
                dangerouslySetInnerHTML={{ __html: report }}
              />
              <form
                className="input-field"
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                onSubmit={askGemini}
              >
                <span className="material-icons prefix" style={{fontSize: 24}}>psychology</span>
                <input
                  type="text"
                  placeholder="Faça uma pergunta sobre seus gastos..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" className="btn" disabled={loading}>
                  <span className="material-icons">send</span>
                </button>
              </form>
              {loading && (
                <div className="progress">
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