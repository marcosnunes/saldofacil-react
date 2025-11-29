import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';
import { monthsLowercase, monthsPT } from '../utils/helpers';
import ReactMarkdown from 'react-markdown';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ? import.meta.env.VITE_GEMINI_API_KEY.trim() : null;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

export default function AIReports() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callApi = async (prompt, history) => {
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    contents.unshift({ role: 'user', parts: [{ text: prompt }] });
    contents.push({ role: 'user', parts: [{ text: userInput }] });

    const requestBody = { contents };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || "Erro na API");
    }

    const responseData = await response.json();
    return responseData.candidates[0].content.parts[0].text;
  };

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      if (!user) return;
      if (!API_KEY || API_KEY === "SUA_CHAVE_API_GEMINI_AQUI") {
        alert("Por favor, configure sua chave da API do Gemini no arquivo .env");
        setIsLoading(false);
        return;
      }

      let promptText = `Aja como um especialista em finanças e analise os seguintes dados financeiros de um usuário para o ano de ${selectedYear}. Forneça um resumo geral e insights. Seja detalhado e use formatação em markdown.\n\n`;
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

      if (Object.keys(yearData).length === 0) {
        setMessages([{ role: 'model', text: "Não há dados financeiros para analisar. Adicione transações e tente novamente." }]);
        setIsLoading(false);
        return;
      }

      for (const monthName in yearData) {
        const monthData = yearData[monthName];
        promptText += `--- Mês: ${monthName} ---\n`;
        if (monthData.transactions) {
          Object.values(monthData.transactions).forEach(t => {
            promptText += `- Dia ${t.day}: ${t.description} | Crédito: ${t.credit || 0} | Débito: ${t.debit || 0}\n`;
          });
        }
      }
      setInitialPrompt(promptText);

      try {
        const initialAnalysis = await callApi(promptText, []);
        setMessages([{ role: 'model', text: initialAnalysis }]);
      } catch (error) {
        setMessages([{ role: 'model', text: `Ocorreu um erro ao gerar a análise inicial: ${error.message}` }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndAnalyze();
  }, [user, selectedYear]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const responseText = await callApi(initialPrompt, newMessages);
      setMessages([...newMessages, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', text: `Ocorreu um erro: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation title="Relatórios com IA" onBack={() => navigate(-1)} onNext={() => navigate(-1)} />
      <div className="main-content">
        <div className="container">
          <div className="chat-container">
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`chat-bubble ${msg.role}`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ))}
              {isLoading && (
                <div className="chat-bubble model">
                  <div className="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Faça uma pergunta sobre seus dados..."
                disabled={isLoading}
              />
              <button type="submit" className="btn" disabled={isLoading}>
                <i className="material-icons">send</i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
