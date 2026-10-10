import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useYear } from "../contexts/YearContext";
import { useAuth } from "../contexts/AuthContext";
import { Navigation } from "../components";
import { fetchAndSaveDataForAI } from "../utils/helpers";
import { useLocalAI } from "../hooks/useLocalAI";

function logAIUI(event, details = {}) {
  console.info(`[LOCAL-AI][renderer] ${event}`, details);
  window.desktop?.localAILog?.(event, details);
}

export default function AIReports() {
  const { user } = useAuth();
  const { selectedYear: yearFromContext } = useYear();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [question, setQuestion] = useState("");
  const [report, setReport] = useState("Preparando dados para análise...");
  const [loading, setLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [fullData, setFullData] = useState(null);
  const chatEndRef = useRef(null);

  // Local AI hook
  const {
    isLoaded: isModelLoaded,
    isLoading: isModelLoading,
    isGenerating,
    response: aiResponse,
    error: aiError,
    statusMessage,
    loadModel,
    generate,
    canUseLocal
  } = useLocalAI();

  const getYear = useCallback(() => searchParams.get("year") || yearFromContext, [searchParams, yearFromContext]);

  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith("report_data_") || key === "local_ai_model_download_confirmed")
        .forEach(key => localStorage.removeItem(key));
    } catch {
      if (import.meta.env.DEV) console.warn("Unable to clear the legacy AI cache.");
    }

    const year = getYear();
    if (user && year) {
      setIsDataReady(false);
      setReport("Preparando dados para análise...");
      (async () => {
        try {
          const result = await fetchAndSaveDataForAI(user.uid, year);
          if (result) {
            setFullData(result);
            setIsDataReady(true);
            setReport("Olá! Eu sou o assistente de IA. Pergunte-me sobre seus gastos.");
          } else {
            setIsDataReady(false);
            setReport("Erro ao preparar dados para análise. Tente novamente.");
          }
        } catch (error) {
          logAIUI("ui.context_prepare_failed", {
            errorName: error instanceof Error ? error.name : typeof error,
            errorMessage: error instanceof Error ? error.message : "Falha ao preparar os dados financeiros.",
          });
          setIsDataReady(false);
          setReport("Erro ao preparar dados para análise. Tente novamente.");
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

  // Keep the report in sync with the bundled local model.
  useEffect(() => {
    if (isDataReady) {
      if (isModelLoading) {
        setReport(statusMessage);
      } else if (isModelLoaded) {
        setReport("Olá! Eu sou o assistente de IA. Pergunte-me sobre seus gastos.");
      } else {
        setReport(statusMessage);
      }
    }
  }, [isDataReady, isModelLoaded, isModelLoading, statusMessage]);

  // Update report with AI generation progress
  useEffect(() => {
    if (aiResponse) {
      setReport(aiResponse);
    }
  }, [aiResponse]);

  // Handle AI errors
  useEffect(() => {
    if (aiError) {
      setReport(`Erro: ${aiError}`);
      setLoading(false);
    }
  }, [aiError]);

  // Handle AI generation completion
  useEffect(() => {
    if (!isGenerating && aiResponse && loading) {
      setLoading(false);
      setQuestion("");
    }
  }, [isGenerating, aiResponse, loading]);

  useEffect(() => {
    if (!isGenerating || aiResponse) return undefined;
    const timeoutId = window.setTimeout(() => {
      setReport("A IA ainda está processando seus dados. A resposta aparecerá aqui assim que for gerada.");
    }, 10000);
    return () => window.clearTimeout(timeoutId);
  }, [isGenerating, aiResponse]);

  function criarContextoInteligente(pergunta) {
    if (!fullData) return "Não há dados de gastos disponíveis.";

    const perguntaLower = pergunta.toLowerCase();
    const { raw, summary } = fullData;

    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    // 1. PERGUNTAS SOBRE MÚLTIPLOS SALDOS
    const contemSaldoFinalOuInicial = perguntaLower.match(/saldos? (finais?|iniciais?)/);
    
    if (contemSaldoFinalOuInicial) {
      const mesesEncontrados = meses
        .filter(mes => perguntaLower.includes(mes))
        .map(mes => mes.charAt(0).toUpperCase() + mes.slice(1));

      if (mesesEncontrados.length > 0 && raw) {
        const dadosMesesMultiplos = {};

        mesesEncontrados.forEach(mesCap => {
          const dadosMes = raw[mesCap];
          if (dadosMes) {
            dadosMesesMultiplos[mesCap] = {
              saldoInicial: dadosMes.initialBalance || 0,
              saldoFinal: dadosMes.finalBalance || 0,
              totalCredito: dadosMes.totalCredit || 0,
              totalDebito: dadosMes.totalDebit || 0,
              balance: dadosMes.balance || 0
            };
          }
        });

        const resultado = {
          tipoAnalise: "saldos_multiplos",
          meses: dadosMesesMultiplos
        };

        return JSON.stringify(resultado, null, 2);
      }
    }

    // 2. PERGUNTAS SOBRE GASTOS POR CATEGORIA
    if (perguntaLower.match(/gast(o|ei|os)|categor|onde|estabelecimento|compra/)) {
      const gastosPorEstabelecimento = {};

      Object.keys(raw || {}).forEach(mes => {
        const mesData = raw[mes];
        if (mesData.debitos) {
          mesData.debitos.forEach(d => {
            const estabelecimento = d.descricao.split(' - ')[0].trim();
            if (!gastosPorEstabelecimento[estabelecimento]) {
              gastosPorEstabelecimento[estabelecimento] = {
                total: 0,
                quantidade: 0
              };
            }
            gastosPorEstabelecimento[estabelecimento].total += d.valor;
            gastosPorEstabelecimento[estabelecimento].quantidade += 1;
          });
        }
      });

      const topGastos = Object.entries(gastosPorEstabelecimento)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10)
        .map(([nome, dados]) => ({
          estabelecimento: nome,
          totalGasto: dados.total,
          quantidadeCompras: dados.quantidade,
          mediaGasto: dados.total / dados.quantidade
        }));

      return JSON.stringify({
        tipoAnalise: "gastos_por_categoria",
        topEstabelecimentos: topGastos,
        totalGeral: Object.values(gastosPorEstabelecimento).reduce((acc, e) => acc + e.total, 0)
      }, null, 2);
    }

    // 3. PERGUNTAS SOBRE MÊS ESPECÍFICO
    const mesEspecifico = meses.find(mes => perguntaLower.includes(mes));

    if (mesEspecifico && raw && !contemSaldoFinalOuInicial) {
      const mesCap = mesEspecifico.charAt(0).toUpperCase() + mesEspecifico.slice(1);
      const dadosMes = raw[mesCap];

      if (dadosMes) {
        const debitosPorCategoria = {};
        dadosMes.debitos?.forEach(d => {
          const categoria = d.descricao.split(' - ')[0].trim();
          if (!debitosPorCategoria[categoria]) {
            debitosPorCategoria[categoria] = { total: 0, itens: [] };
          }
          debitosPorCategoria[categoria].total += d.valor;
          debitosPorCategoria[categoria].itens.push(d);
        });

        const topCategorias = Object.entries(debitosPorCategoria)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 10)
          .map(([cat, dados]) => ({
            categoria: cat,
            total: dados.total,
            quantidade: dados.itens.length
          }));

        return JSON.stringify({
          tipoAnalise: "mes_detalhado",
          mes: mesCap,
          saldoInicial: dadosMes.initialBalance || 0,
          saldoFinal: dadosMes.finalBalance || 0,
          totalCredito: dadosMes.totalCredit || 0,
          totalDebito: dadosMes.totalDebit || 0,
          topCategorias,
          quantidadeTransacoes: {
            creditos: dadosMes.creditos?.length || 0,
            debitos: dadosMes.debitos?.length || 0
          }
        }, null, 2);
      }
    }

    // 4. PERGUNTAS SOBRE COMPARAÇÃO
    if (perguntaLower.match(/compar|diferença|variação|evolução/)) {
      const dadosMensais = meses.map(mes => {
        const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);
        const dadosMes = raw?.[mesCap];
        if (!dadosMes) return null;

        return {
          mes: mesCap,
          saldoInicial: dadosMes.initialBalance || 0,
          saldoFinal: dadosMes.finalBalance || 0,
          totalCredito: dadosMes.totalCredit || 0,
          totalDebito: dadosMes.totalDebit || 0
        };
      }).filter(Boolean);

      return JSON.stringify({
        tipoAnalise: "comparacao_mensal",
        dadosMensais,
        summary
      }, null, 2);
    }

    // 5. PERGUNTAS SOBRE ECONOMIA
    if (perguntaLower.match(/economia|economizar|reduzir|sugest|insight|melho/)) {
      const gastosPorEstabelecimento = {};
      const gastosMensais = [];

      Object.keys(raw || {}).forEach(mes => {
        const mesData = raw[mes];
        if (mesData.debitos) {
          mesData.debitos.forEach(d => {
            const estabelecimento = d.descricao.split(' - ')[0].trim();
            if (!gastosPorEstabelecimento[estabelecimento]) {
              gastosPorEstabelecimento[estabelecimento] = { total: 0, quantidade: 0 };
            }
            gastosPorEstabelecimento[estabelecimento].total += d.valor;
            gastosPorEstabelecimento[estabelecimento].quantidade += 1;
          });
        }

        gastosMensais.push({
          mes,
          totalDebito: mesData.totalDebit || 0,
          totalCredito: mesData.totalCredit || 0
        });
      });

      const topGastos = Object.entries(gastosPorEstabelecimento)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10)
        .map(([nome, dados]) => ({
          estabelecimento: nome,
          total: dados.total,
          frequencia: dados.quantidade,
          mediaGasto: dados.total / dados.quantidade
        }));

      return JSON.stringify({
        tipoAnalise: "insights_economia",
        topGastos,
        gastosMensais,
        summary
      }, null, 2);
    }

    // 6. FALLBACK: Resumo geral
    return JSON.stringify({
      tipoAnalise: "resumo_geral",
      summary
    }, null, 2);
  }

  async function askAI(e) {
    e.preventDefault();
    const year = getYear();
    logAIUI("ui.submit_received", {
      hasQuestion: Boolean(question.trim()),
      yearAvailable: Boolean(year),
      modelReady: isModelLoaded,
      dataReady: isDataReady,
    });

    if (!question.trim()) {
      logAIUI("ui.submit_blocked", { reason: "empty_question" });
      setReport("Por favor, digite uma pergunta.");
      return;
    }
    if (!year) {
      logAIUI("ui.submit_blocked", { reason: "year_unavailable" });
      setReport("Erro: Ano não especificado.");
      return;
    }
    if (!canUseLocal) {
      logAIUI("ui.submit_blocked", {
        reason: isModelLoading ? "model_loading" : "model_unavailable",
      });
      setReport(statusMessage);
      loadModel();
      return;
    }
    if (!isModelLoaded) {
      logAIUI("ui.submit_blocked", { reason: "model_not_ready" });
      return;
    }

    const contextoDosDados = criarContextoInteligente(question);
    const prompt = `Ano: ${year}\n\nDADOS FINANCEIROS (JSON):\n${contextoDosDados}\n\nPERGUNTA:\n${question}`;

    setLoading(true);
    setReport("Analisando seus dados localmente. A resposta será exibida conforme for gerada...");
    generate(prompt);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navigation title="Análise com IA" onBack={() => navigate('/')} />

      <div className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {!canUseLocal && isDataReady && !isModelLoading && (
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#e74c3c' }}>
                  <p>{statusMessage}</p>
                  <button className="btn" onClick={loadModel} disabled={isModelLoading}>
                    <span className="material-icons">refresh</span>
                    Tentar carregar modelo
                  </button>
                </div>
              )}

              {isModelLoading && isDataReady && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: '#8898aa', margin: 0 }}>
                    {statusMessage}
                  </p>
                </div>
              )}

              <div id="reportArea" style={{ whiteSpace: 'pre-wrap' }}>{report}</div>
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
                    placeholder="Ex: Qual o saldo final de Agosto? / Onde gasto mais dinheiro? / Como posso economizar?"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    disabled={loading || !isDataReady || !canUseLocal || isModelLoading}
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        askAI(e);
                      }
                    }}
                  />
                  <button type="submit" className="btn" disabled={loading || !isDataReady || !canUseLocal || isModelLoading}>
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