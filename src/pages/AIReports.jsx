import { useSearchParams } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useYear } from "../contexts/YearContext";
import { useAuth } from "../contexts/AuthContext";
import { Navigation } from "../components";
import { fetchAndSaveDataForAI } from "../utils/helpers";
import { useState, useRef, useEffect, useCallback } from "react";
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
import Icon from '@mui/material/Icon';
const MODEL_NAME = "gemini-2.5-pro";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AIReports() {
  const { user } = useAuth();
  const { selectedYear: yearFromContext } = useYear();
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
      // Logs dos caminhos que serão consultados no RTDB
      console.log("[AIReports] Caminhos consultados:");
      console.log("users/" + user.uid);
      console.log("creditCardData/" + user.uid + "/" + year);
      console.log("investments/" + user.uid + "/" + year);
      console.log("tithes/" + user.uid + "/" + year);
      fetchAndSaveDataForAI(user.uid, year).then(() => {
        setIsDataReady(true);
        setReport("Olá! Eu sou o Gemini. Pergunte-me sobre seus gastos.");
      });
    } else if (!year) {
      setReport("Erro: Ano não especificado.");
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
    console.log('JSON para IA:', debugJson);

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
    <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', py: 4 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 2 }}>
        <Typography variant="h4" fontWeight={700} align="center" sx={{ mb: 4 }}>
          Análise com IA
        </Typography>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
            <div id="reportArea" dangerouslySetInnerHTML={{ __html: report }} />
            <div ref={chatEndRef} />
          </Box>
          <Box component="form" onSubmit={askGemini} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Icon sx={{ fontSize: 28, color: 'primary.main' }}>psychology</Icon>
            <input
              type="text"
              placeholder="Faça uma pergunta sobre seus gastos..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              disabled={loading || !isDataReady}
              style={{ flex: 1, margin: 0, padding: '10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
            />
            <Button type="submit" variant="contained" color="primary" startIcon={<Icon>send</Icon>} disabled={loading || !isDataReady}>
              Perguntar
            </Button>
          </Box>
          {loading && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <CircularProgress color="primary" />
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}