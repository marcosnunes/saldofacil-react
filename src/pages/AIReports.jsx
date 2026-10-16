import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useYear } from "../contexts/YearContext";
import { useAuth } from "../contexts/AuthContext";
import { Navigation } from "../components";
import { fetchAndSaveDataForAI, formatCurrency } from "../utils/helpers";
import {
  EMPTY_MEMORY, loadAIMemory, saveAIMemory, memoryToPrompt, findCategory,
  parseMemoryCommand, addFact, addAlias, addExample, hasMemory,
} from "../utils/aiMemory";
import { buildIndex, search } from "../utils/aiSearch";
import { useLocalAI } from "../hooks/useLocalAI";

const generationMessages = [
  "Contando moedas e organizando as ideias...",
  "Fazendo as contas com calma (sem calculadora de feira)...",
  "Conferindo os números antes de responder...",
  "Quase lá: transformando dados em uma resposta clara...",
];

function logAIUI(event, details = {}) {
  console.info(`[LOCAL-AI][renderer] ${event}`, details);
  window.desktop?.localAILog?.(event, details);
}

function AIGenerationModal({ onCancel }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMessageIndex(index => (index + 1) % generationMessages.length);
    }, 2600);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="ai-generation-overlay">
      <section
        className="ai-generation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-generation-title"
        aria-describedby="ai-generation-message"
      >
        <div className="ai-generation-art" aria-hidden="true">
          <span className="ai-generation-orbit ai-generation-orbit-one" />
          <span className="ai-generation-orbit ai-generation-orbit-two" />
          <span className="ai-generation-coin material-icons">paid</span>
          <span className="ai-generation-spark ai-generation-spark-one material-icons">auto_awesome</span>
          <span className="ai-generation-spark ai-generation-spark-two material-icons">star</span>
        </div>
        <p className="ai-generation-eyebrow">Assistente local</p>
        <h2 id="ai-generation-title">A IA está pensando</h2>
        <p id="ai-generation-message" className="ai-generation-message" aria-live="polite">
          {generationMessages[messageIndex]}
        </p>
        <div className="ai-generation-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="ai-generation-hint">A resposta aparecerá completa assim que estiver pronta.</p>
        <button type="button" className="ai-generation-cancel" onClick={onCancel} autoFocus>
          Cancelar <kbd>Esc</kbd>
        </button>
      </section>
    </div>
  );
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
  const [memory, setMemory] = useState(EMPTY_MEMORY);
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [newFact, setNewFact] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [history, setHistory] = useState([]);
  const [lastExchange, setLastExchange] = useState(null);
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState("");
  const pendingQuestionRef = useRef("");

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
    prewarm,
    cancel,
    canUseLocal
  } = useLocalAI();

  const handleCancelGeneration = useCallback(() => {
    cancel();
    setLoading(false);
    setReport("Geração cancelada. Faça uma nova pergunta quando quiser.");
  }, [cancel]);

  const getYear = useCallback(() => searchParams.get("year") || yearFromContext, [searchParams, yearFromContext]);

  useEffect(() => {
    if (canUseLocal || !window.desktop?.localAIWarmup) return;
    loadModel();
    // Aquece o modelo uma única vez ao entrar na tela de IA.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const q = pendingQuestionRef.current;
      if (q) {
        setHistory(prev => [...prev, { q, a: aiResponse }].slice(-2));
        setLastExchange({ q, a: aiResponse });
        setCorrecting(false);
        setCorrection("");
      }
    }
  }, [isGenerating, aiResponse, loading]);

  // Memória do usuário (persistida em aiMemory/{uid})
  useEffect(() => {
    if (!user) return;
    let active = true;
    loadAIMemory(user.uid)
      .then(m => { if (active) setMemory(m); })
      .catch(err => logAIUI("ui.memory_load_failed", { message: err instanceof Error ? err.message : "erro" }))
      .finally(() => { if (active) setMemoryLoaded(true); });
    return () => { active = false; };
  }, [user]);

  const atualizarMemoria = useCallback(fn => {
    setMemory(prev => {
      const next = fn(prev);
      if (next !== prev && user) {
        saveAIMemory(user.uid, next).catch(err =>
          logAIUI("ui.memory_save_failed", { message: err instanceof Error ? err.message : "erro" }));
      }
      return next;
    });
  }, [user]);

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

    // 1.5 RANKING DE MESES (mais/menos dispendioso, maior gasto etc.)
    const mencionaMes = meses.some(mes => perguntaLower.includes(mes));
    if (
      raw && !mencionaMes &&
      perguntaLower.match(/dispendios|\bmeses\b|\bmês\b|\bmes\b|mensal|mensais/) &&
      perguntaLower.match(/mais|menos|maior|menor|caro|barato|dispendios|gast|receb|ganh|economi/)
    ) {
      const mesesRanking = Object.keys(raw).map(mes => ({
        mes,
        totalDebito: Number(raw[mes]?.totalDebit) || 0,
        totalCredito: Number(raw[mes]?.totalCredit) || 0,
        saldoFinal: Number(raw[mes]?.finalBalance) || 0,
      })).filter(m => m.totalDebito || m.totalCredito);

      const porDebito = [...mesesRanking].sort((a, b) => b.totalDebito - a.totalDebito);
      const porCredito = [...mesesRanking].sort((a, b) => b.totalCredito - a.totalCredito);

      return JSON.stringify({
        tipoAnalise: "ranking_mensal",
        mesComMaiorGasto: porDebito[0] || null,
        mesComMenorGasto: porDebito[porDebito.length - 1] || null,
        mesComMaiorReceita: porCredito[0] || null,
        mesesOrdenadosPorGasto: porDebito
      }, null, 2);
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
      totaisPorMes: Object.keys(raw || {}).map(mes => ({
        mes,
        totalDebito: Number(raw[mes]?.totalDebit) || 0,
        totalCredito: Number(raw[mes]?.totalCredit) || 0,
        saldoFinal: Number(raw[mes]?.finalBalance) || 0,
      })),
      summary
    }, null, 2);
  }

  function montarResumoAnual(somenteMeses) {
    if (!fullData?.raw) return "";
    const { raw, investments, tithes } = fullData;
    const MAX_CHARS = 16000;
    const n = v => (Number(v) || 0).toFixed(2);
    const limpa = t => {
      const desc = String(t || "Sem descrição").replace(/\s+/g, " ")      .trim().slice(0, 100);
      const categoria = findCategory(desc, memory.aliases);
      return categoria ? `[${categoria}] ${desc}` : desc;
    };

    const meses = Object.keys(raw).filter(mes => {
      if (somenteMeses && !somenteMeses.includes(mes)) return false;
      const m = raw[mes] || {};
      return (m.debitos?.length || m.creditos?.length || Number(m.totalDebit) || Number(m.totalCredit));
    });

    const montar = agrupar => {
      const partes = ["DADOS FINANCEIROS COMPLETOS (valores em reais; C = receita, D = despesa; [Cartão] = compra no cartão):"];
      meses.forEach(mes => {
        const m = raw[mes];
        partes.push(
          `\n## ${mes}: receitas ${n(m.totalCredit)}, despesas ${n(m.totalDebit)}, saldo inicial ${n(m.initialBalance)}, saldo final ${n(m.finalBalance)}, dízimo ${n(m.tithe)}`
        );
        const itens = [
          ...(m.creditos || []).map(t => ({ tipo: "C", ...t })),
          ...(m.debitos || []).map(t => ({ tipo: "D", ...t })),
        ];
        if (agrupar) {
          const grupos = {};
          itens.forEach(t => {
            const chave = `${t.tipo} ${limpa(t.descricao)}`;
            grupos[chave] = grupos[chave] || { total: 0, qtd: 0 };
            grupos[chave].total += Number(t.valor) || 0;
            grupos[chave].qtd += 1;
          });
          Object.entries(grupos)
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([chave, g]) => partes.push(`${chave} ${n(g.total)}${g.qtd > 1 ? ` (${g.qtd}x)` : ""}`));
        } else {
          itens
            .sort((a, b) => (Number(a.dia) || 0) - (Number(b.dia) || 0))
            .forEach(t => partes.push(`${t.tipo} ${t.dia ? `dia ${t.dia} ` : ""}${limpa(t.descricao)} ${n(t.valor)}`));
        }
      });

      const totais = {};
      if (memory.aliases.length) {
        meses.forEach(mes => {
          [["C", raw[mes].creditos], ["D", raw[mes].debitos]].forEach(([tipo, lista]) => {
            (lista || []).forEach(t => {
              const cat = findCategory(t.descricao, memory.aliases);
              if (!cat) return;
              totais[`${cat} (${tipo})`] = (totais[`${cat} (${tipo})`] || 0) + (Number(t.valor) || 0);
            });
          });
        });
        const linhas = Object.entries(totais);
        if (linhas.length) {
          partes.push("\n## TOTAIS POR CATEGORIA DO USUÁRIO (C = receita, D = despesa)");
          linhas.forEach(([cat, total]) => partes.push(`${cat}: ${n(total)}`));
        }
      }

      const invs = somenteMeses ? [] : (investments?.items || []);
      if (invs.length) {
        partes.push("\n## INVESTIMENTOS");
        invs.forEach(i => partes.push(`${i.month || ""} ${limpa(i.description)} aplicado ${n(i.credit)} resgatado ${n(i.debit)}`));
      }
      if (!somenteMeses && tithes?.length) {
        partes.push("\n## DÍZIMOS");
        tithes.forEach(t => partes.push(`${t.month || ""} ${limpa(t.description)} ${n(t.value)}`));
      }
      return partes.join("\n");
    };

    let texto = montar(false);
    if (texto.length > MAX_CHARS) texto = montar(true);
    if (texto.length > MAX_CHARS) texto = `${texto.slice(0, MAX_CHARS)}\n[dados truncados por tamanho]`;
    return texto;
  }

  const searchIndexRef = useRef({ source: null, index: null });
  function lancamentosRelevantes(pergunta) {
    if (!fullData?.raw) return "";
    if (searchIndexRef.current.source !== fullData.raw || searchIndexRef.current.memory !== memory.aliases) {
      const docs = [];
      Object.entries(fullData.raw).forEach(([mes, m]) => {
        [["C", m?.creditos], ["D", m?.debitos]].forEach(([tipo, lista]) => {
          (lista || []).forEach(t => {
            const desc = String(t.descricao || "Sem descrição").replace(/\s+/g, " ").trim().slice(0, 120);
            const cat = findCategory(desc, memory.aliases);
            docs.push({
              text: `${desc} ${cat || ""}`,
              linha: `${tipo} ${mes}${t.dia ? ` dia ${t.dia}` : ""} ${cat ? `[${cat}] ` : ""}${desc} ${(Number(t.valor) || 0).toFixed(2)}`,
            });
          });
        });
      });
      searchIndexRef.current = { source: fullData.raw, memory: memory.aliases, index: buildIndex(docs) };
    }
    const achados = search(searchIndexRef.current.index, pergunta, 25);
    return achados.length ? achados.map(d => d.linha).join("\n") : "";
  }

  const normalizar = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const MESES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  function mesesCitados(pergunta) {
    const p = normalizar(pergunta);
    return MESES_PT.filter(mes => new RegExp(`\\b${normalizar(mes)}\\b`).test(p));
  }

  const PALAVRAS_ANALISE = /compar|diferenca|variacao|evolucao|por ?que|como |dica|economiz|reduzir|sugest|categoria|onde|principal|tendencia|previs|vale a pena|devo |posso /;

  const PALAVRAS_SIMPLES = new Set(["qual", "quais", "quanto", "quanta", "foi", "fui", "e", "o", "a", "os", "as", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", "meu", "minha", "meus", "minhas", "um", "uma", "eu", "me", "diga", "mostre", "mostra", "ver", "veja", "total", "ano", "mes", "meses", "que", "mais", "menos", "maior", "menor", "tive", "tenho", "ficou", "ficaram", "deu", "saldo", "saldos", "inicial", "final", "receita", "receitas", "recebi", "entrada", "entradas", "credito", "creditos", "despesa", "despesas", "gastei", "gasto", "gastos", "gastar", "debito", "debitos", "saida", "saidas", "paguei", "dizimo", "dizimos", "caro", "barato", "dispendioso", "ganhei", "no", "durante", "ate", "por", "favor"]);

  // Perguntas de leitura simples (um número) são respondidas sem a IA.
  function responderDireto(pergunta) {
    if (!fullData?.raw || pergunta.length > 70) return null;
    const p = normalizar(pergunta);
    if (PALAVRAS_ANALISE.test(p)) return null;

    const nomesMeses = new Set(MESES_PT.map(normalizar));
    const tokens = p.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    const soSimples = tokens.every(t => PALAVRAS_SIMPLES.has(t) || nomesMeses.has(t) || /^\d{4}$/.test(t));
    if (!soSimples) return null;

    const metrica = (() => {
      if (/saldo inicial/.test(p)) return { chave: "initialBalance", nome: "saldo inicial" };
      if (/saldo/.test(p)) return { chave: "finalBalance", nome: "saldo final" };
      if (/receita|recebi|entrada|credito|ganh/.test(p)) return { chave: "totalCredit", nome: "total de receitas" };
      if (/despesa|gast|debito|saida|paguei/.test(p)) return { chave: "totalDebit", nome: "total de despesas" };
      if (/dizimo/.test(p)) return { chave: "tithe", nome: "dízimo" };
      return null;
    })();
    if (!metrica) return null;

    const meses = mesesCitados(pergunta);
    if (meses.length >= 1 && meses.length <= 3) {
      const linhas = meses.map(mes => {
        const valor = Number(fullData.raw[mes]?.[metrica.chave]) || 0;
        return `${mes}: ${formatCurrency(valor, "BRL")}`;
      });
      return `${metrica.nome.charAt(0).toUpperCase()}${metrica.nome.slice(1)} (${getYear()}):\n${linhas.join("\n")}`;
    }

    if (meses.length === 0 && /\b(mes|meses)\b/.test(p) && /mais|maior|menos|menor|caro|barato|dispendios/.test(p)
      && ["totalCredit", "totalDebit"].includes(metrica.chave)) {
      const lista = MESES_PT
        .map(mes => ({ mes, valor: Number(fullData.raw[mes]?.[metrica.chave]) || 0 }))
        .filter(m => m.valor > 0)
        .sort((a, b) => b.valor - a.valor);
      if (!lista.length) return null;
      const menor = /menos|menor|barato/.test(p);
      const alvo = menor ? lista[lista.length - 1] : lista[0];
      return `${menor ? "Menor" : "Maior"} ${metrica.nome} do ano: ${alvo.mes}, com ${formatCurrency(alvo.valor, "BRL")}.`;
    }

    if (meses.length === 0 && /\b(ano|anual|total)\b/.test(p) && ["totalCredit", "totalDebit", "tithe"].includes(metrica.chave)) {
      const total = MESES_PT.reduce((s, mes) => s + (Number(fullData.raw[mes]?.[metrica.chave]) || 0), 0);
      return `${metrica.nome.charAt(0).toUpperCase()}${metrica.nome.slice(1)} em ${getYear()}: ${formatCurrency(total, "BRL")}.`;
    }
    return null;
  }

  function prefixoAno(year) {
    const mem = memoryToPrompt(memory);
    return `Ano: ${year}\n\n${mem ? `${mem}\n\n` : ""}${montarResumoAnual()}\n\n`;
  }

  function blocoConversa() {
    if (!history.length) return "";
    const clip = (t, n) => String(t).replace(/\s+/g, " ").trim().slice(0, n);
    return `CONVERSA RECENTE:\n${history.map(h => `Usuário: ${clip(h.q, 150)}\nAssistente: ${clip(h.a, 300)}`).join("\n")}\n\n`;
  }

  // Pré-carrega o ano (com a memória) no cache do modelo para as perguntas amplas começarem mais rápido.
  useEffect(() => {
    if (!isModelLoaded || !isDataReady || !fullData || !memoryLoaded) return;
    const year = getYear();
    if (year) prewarm(prefixoAno(year));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModelLoaded, isDataReady, fullData, memoryLoaded, memory]);

  function responderComando(texto) {
    const cmd = parseMemoryCommand(texto);
    if (!cmd) return null;
    if (cmd.type === "fact") {
      atualizarMemoria(m => addFact(m, cmd.text));
      return `Anotado! Vou lembrar que: ${cmd.text}`;
    }
    atualizarMemoria(m => addAlias(m, cmd.term, cmd.category));
    return `Combinado! Daqui em diante "${cmd.term}" será tratado como ${cmd.category}.`;
  }

  function registrarAprovacao() {
    if (!lastExchange) return;
    atualizarMemoria(m => addExample(m, lastExchange.q, lastExchange.a));
    setLastExchange(null);
    setReport(prev => `${prev}\n\n👍 Obrigado! Vou usar esta resposta como referência.`);
  }

  function enviarCorrecao(e) {
    e.preventDefault();
    if (!correction.trim()) return;
    atualizarMemoria(m => addFact(m, `Correção do usuário (sobre "${lastExchange?.q?.slice(0, 80) || "pergunta anterior"}"): ${correction}`));
    setCorrecting(false);
    setCorrection("");
    setLastExchange(null);
    setReport(prev => `${prev}\n\n👎 Anotado! Vou levar essa correção em conta nas próximas respostas.`);
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
    const comando = responderComando(question.trim());
    if (comando) {
      setReport(comando);
      setQuestion("");
      setLastExchange(null);
      return;
    }
    const direta = responderDireto(question.trim());
    if (direta) {
      logAIUI("ui.direct_answer", { questionLength: question.length });
      setReport(direta);
      setHistory(prev => [...prev, { q: question.trim(), a: direta }].slice(-2));
      setLastExchange(null);
      setQuestion("");
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

    const meses = mesesCitados(question);
    const ehMensal = meses.length >= 1 && meses.length <= 2 && question.length <= 80 && !PALAVRAS_ANALISE.test(normalizar(question));
    const conversa = blocoConversa();
    let prompt;
    if (ehMensal) {
      // Contexto enxuto: só os meses citados (rápido, sem depender do cache do ano).
      const mem = memoryToPrompt(memory);
      prompt = `Ano: ${year}\n\n${mem ? `${mem}\n\n` : ""}DADOS FINANCEIROS:\n${montarResumoAnual(meses)}\n\n${conversa}PERGUNTA:\n${question}`;
    } else {
      // Prefixo idêntico ao pré-carregado, para reaproveitar o cache do modelo.
      const relevantes = lancamentosRelevantes(question);
      prompt = `${prefixoAno(year)}${conversa}PERGUNTA:\n${question}\n\nANÁLISE PRÉ-CALCULADA RELACIONADA À PERGUNTA:\n${criarContextoInteligente(question)}${relevantes ? `\n\nLANÇAMENTOS MAIS RELEVANTES PARA A PERGUNTA (busca por descrição, todos os meses):\n${relevantes}` : ""}`;
    }

    pendingQuestionRef.current = question.trim();
    setLastExchange(null);

    setLoading(true);
    setReport("Preparando resposta da IA local...");
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
              {lastExchange && !loading && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#8898aa' }}>Esta resposta ajudou?</span>
                  <button type="button" className="btn" onClick={registrarAprovacao} aria-label="Resposta boa">👍</button>
                  <button type="button" className="btn" onClick={() => setCorrecting(c => !c)} aria-label="Resposta ruim">👎</button>
                </div>
              )}
              {correcting && lastExchange && (
                <form onSubmit={enviarCorrecao} style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="ai-input"
                    style={{ flex: 1 }}
                    placeholder="O que estava errado? (ex: Isso é investimento, não despesa)"
                    value={correction}
                    maxLength={200}
                    onChange={e => setCorrection(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn">Enviar</button>
                </form>
              )}
              <div style={{ marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setMemoryOpen(o => !o)}>
                  <span className="material-icons">memory</span>
                  Memória da IA {hasMemory(memory) ? `(${memory.facts.length + memory.aliases.length + memory.examples.length})` : ""}
                </button>
                {memoryOpen && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                    <p style={{ color: '#8898aa', marginTop: 0 }}>
                      O que a IA aprendeu com você. Dica: digite "lembre que prefiro respostas curtas" ou "considere ifood como Alimentação" na pergunta.
                    </p>
                    <strong>Fatos e preferências</strong>
                    {memory.facts.length === 0 && <p style={{ color: '#8898aa' }}>Nada ainda.</p>}
                    {memory.facts.map(f => (
                      <div key={f} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', padding: '0.2rem 0' }}>
                        <span>{f}</span>
                        <button type="button" className="btn" aria-label="Apagar fato" onClick={() => atualizarMemoria(m => ({ ...m, facts: m.facts.filter(x => x !== f) }))}>
                          <span className="material-icons">delete</span>
                        </button>
                      </div>
                    ))}
                    <form onSubmit={e => { e.preventDefault(); if (newFact.trim()) { atualizarMemoria(m => addFact(m, newFact)); setNewFact(""); } }} style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
                      <input className="ai-input" style={{ flex: 1 }} placeholder="Novo fato ou preferência" value={newFact} maxLength={200} onChange={e => setNewFact(e.target.value)} />
                      <button type="submit" className="btn">Adicionar</button>
                    </form>
                    <strong>Categorias</strong>
                    {memory.aliases.length === 0 && <p style={{ color: '#8898aa' }}>Nenhuma ainda.</p>}
                    {memory.aliases.map(a => (
                      <div key={a.term} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', padding: '0.2rem 0' }}>
                        <span>"{a.term}" → {a.category}</span>
                        <button type="button" className="btn" aria-label="Apagar categoria" onClick={() => atualizarMemoria(m => ({ ...m, aliases: m.aliases.filter(x => x.term !== a.term) }))}>
                          <span className="material-icons">delete</span>
                        </button>
                      </div>
                    ))}
                    <form onSubmit={e => { e.preventDefault(); if (newTerm.trim() && newCategory.trim()) { atualizarMemoria(m => addAlias(m, newTerm, newCategory)); setNewTerm(""); setNewCategory(""); } }} style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
                      <input className="ai-input" style={{ flex: 1 }} placeholder='Descrição contém (ex: ifood)' value={newTerm} maxLength={40} onChange={e => setNewTerm(e.target.value)} />
                      <input className="ai-input" style={{ flex: 1 }} placeholder="Categoria (ex: Alimentação)" value={newCategory} maxLength={40} onChange={e => setNewCategory(e.target.value)} />
                      <button type="submit" className="btn">Adicionar</button>
                    </form>
                    <strong>Respostas aprovadas: {memory.examples.length}</strong>
                    {memory.examples.length > 0 && (
                      <button type="button" className="btn" style={{ marginLeft: '0.5rem' }} onClick={() => atualizarMemoria(m => ({ ...m, examples: [] }))}>Limpar</button>
                    )}
                    {hasMemory(memory) && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <button type="button" className="btn" onClick={() => { if (window.confirm("Apagar toda a memória da IA?")) atualizarMemoria(() => ({ ...EMPTY_MEMORY })); }}>
                          Apagar toda a memória
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#8898aa', textAlign: 'center' }}>Built with Llama</p>
            </div>
          </div>
        </div>
      </div>
      {loading && <AIGenerationModal onCancel={handleCancelGeneration} />}
    </div>
  );
}