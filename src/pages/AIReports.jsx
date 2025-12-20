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
  const [fullData, setFullData] = useState(null);
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
            // Carregar dados completos em memória
            const jsonData = localStorage.getItem(`report_data_${year}`);
            if (jsonData) {
              setFullData(JSON.parse(jsonData));
            }
            setIsDataReady(true);
            setReport("Olá! Eu sou o assistente de IA. Pergunte-me sobre seus gastos.");
            console.log("[AIReports] Dados completos carregados.");
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

    // Função para criar contexto ultra-inteligente baseado na pergunta
  function criarContextoInteligente(pergunta) {
    if (!fullData) return "Não há dados de gastos disponíveis.";

    const perguntaLower = pergunta.toLowerCase();
    const { raw, summary } = fullData;

    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    // 1. PERGUNTAS SOBRE MÚLTIPLOS SALDOS (PRIORIDADE MÁXIMA!)
    const contemSaldoFinalOuInicial = perguntaLower.match(/saldo (final|inicial)/);
    
    if (contemSaldoFinalOuInicial) {
      // Buscar TODOS os meses mencionados na pergunta
      const mesesEncontrados = meses
        .filter(mes => perguntaLower.includes(mes))
        .map(mes => mes.charAt(0).toUpperCase() + mes.slice(1));

      console.log("=== DEBUG: DETECÇÃO DE MÚLTIPLOS MESES ===");
      console.log("Pergunta contém 'saldo final' ou 'saldo inicial'?", !!contemSaldoFinalOuInicial);
      console.log("Meses detectados na pergunta:", mesesEncontrados);

      if (mesesEncontrados.length > 0 && raw) {
        const dadosMesesMultiplos = {};

        mesesEncontrados.forEach(mesCap => {
          const dadosMes = raw[mesCap];
          console.log(`Buscando dados de ${mesCap}:`, dadosMes ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
          
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

        console.log("=== MÚLTIPLOS MESES COMPILADOS ===");
        console.log("Dados compilados:", dadosMesesMultiplos);
        console.log("==================================");

        const resultado = {
          tipoAnalise: "saldos_multiplos",
          meses: dadosMesesMultiplos
        };

        console.log("JSON que será enviado para IA:", JSON.stringify(resultado, null, 2));

        return JSON.stringify(resultado, null, 2);
      }
    }

    // 2. PERGUNTAS SOBRE GASTOS POR CATEGORIA/ESTABELECIMENTO
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
                quantidade: 0,
                transacoes: []
              };
            }
            gastosPorEstabelecimento[estabelecimento].total += d.valor;
            gastosPorEstabelecimento[estabelecimento].quantidade += 1;
            gastosPorEstabelecimento[estabelecimento].transacoes.push({
              mes,
              valor: d.valor,
              dia: d.dia
            });
          });
        }
      });

      const topGastos = Object.entries(gastosPorEstabelecimento)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 15)
        .map(([nome, dados]) => ({
          estabelecimento: nome,
          totalGasto: dados.total,
          quantidadeCompras: dados.quantidade,
          mediaGasto: dados.total / dados.quantidade,
          transacoes: dados.transacoes
        }));

      return JSON.stringify({
        tipoAnalise: "gastos_por_categoria",
        topEstabelecimentos: topGastos,
        totalGeral: Object.values(gastosPorEstabelecimento).reduce((acc, e) => acc + e.total, 0)
      }, null, 2);
    }

    // 3. PERGUNTAS SOBRE MÊS ESPECÍFICO DETALHADO (SEM conflito com saldos)
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

    // 4. PERGUNTAS SOBRE COMPARAÇÃO ENTRE MESES
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

    // 5. PERGUNTAS SOBRE ECONOMIA/INSIGHTS
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

    // 6. FALLBACK: Resumo geral otimizado
    return JSON.stringify({
      tipoAnalise: "resumo_geral",
      summary
    }, null, 2);
  }

    async function askAI(e) {
    e.preventDefault();
    const year = getYear();

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
      const contextoDosDados = criarContextoInteligente(question);

      console.log("=== CONTEXTO ENVIADO PARA IA ===");
      console.log("Pergunta:", question);
      console.log("Tamanho:", contextoDosDados.length, "caracteres");
      console.log("Conteúdo:", contextoDosDados);
      console.log("================================");

      // ⭐ ADICIONAR AQUI: Parse e log do objeto real
      try {
        const contextoParsed = JSON.parse(contextoDosDados);
        console.log("=== OBJETO PARSEADO ===");
        console.log("Tipo de análise:", contextoParsed.tipoAnalise);
        if (contextoParsed.tipoAnalise === "saldos_multiplos") {
          console.log("Meses no objeto:", Object.keys(contextoParsed.meses || {}));
          console.log("Dados completos:", contextoParsed.meses);
        }
        console.log("=======================");
      } catch (parseError) {
        console.error("❌ ERRO AO FAZER PARSE DO JSON:", parseError);
        console.log("String que tentou parsear:", contextoDosDados);
      }

      const groq = new Groq({
        apiKey: API_KEY,
        dangerouslyAllowBrowser: true
      });

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Você é um assistente financeiro especializado. Você SEMPRE recebe dados financeiros em formato JSON estruturado.

TIPOS DE ANÁLISE QUE VOCÊ RECEBE:
1. **saldos_multiplos**: Objeto com dados de múltiplos meses (saldoInicial, saldoFinal, totalCredito, totalDebito)
2. **gastos_por_categoria**: Rankings de estabelecimentos e gastos totais
3. **mes_detalhado**: Análise completa de um mês específico
4. **comparacao_mensal**: Dados mês a mês do ano
5. **insights_economia**: Dados para sugerir economias
6. **resumo_geral**: Resumo do ano inteiro

REGRAS ABSOLUTAS:
✅ SEMPRE use os valores EXATOS do JSON fornecido
✅ NUNCA diga "não há dados" - os dados estão SEMPRE no JSON
✅ Para perguntas sobre saldos, use os campos "saldoInicial" e "saldoFinal" do JSON
✅ Formate valores monetários como R$ X,XX
✅ Seja direto e objetivo

FORMATO DE RESPOSTA:
- Liste os valores pedidos de forma clara
- Use formatação em negrito para destaques (**texto**)
- Se houver múltiplos meses, liste todos
- Adicione insights apenas se for relevante`
          },
          {
            role: "user",
            content: `Ano: ${year}

DADOS FINANCEIROS (JSON):
${contextoDosDados}

PERGUNTA DO USUÁRIO:
${question}

IMPORTANTE: Responda APENAS com base nos dados do JSON acima. NÃO invente informações.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const text = completion.choices[0].message.content;
      setReport(text.replace(/\n/g, "<br>"));
    } catch (error) {
      console.error("Erro ao processar pergunta:", error);

      let errorMessage = "Desculpe, ocorreu um erro ao processar sua pergunta.";
      if (error.message?.includes("rate_limit_exceeded")) {
        errorMessage = "Limite de tokens excedido. Tente uma pergunta mais específica.";
      }

      setReport(`<span style="color: red;">${errorMessage}</span>`);
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
                    placeholder="Ex: Qual o saldo final de Agosto? / Onde gasto mais dinheiro? / Como posso economizar?"
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