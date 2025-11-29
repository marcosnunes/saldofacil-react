import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';
import { monthsLowercase, monthsPT } from '../utils/helpers';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ? import.meta.env.VITE_GEMINI_API_KEY.trim() : null;

// Initialize the SDK
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

export default function AIReports() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chat, setChat] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      if (!user) return;
      if (!model) {
        alert("Por favor, configure sua chave da API do Gemini no arquivo .env");
        setIsLoading(false);
        return;
      }

      let initialPrompt = `Aja como um especialista em finanças e analise os seguintes dados financeiros de um usuário para o ano de ${selectedYear}. Forneça um resumo geral e insights. Seja detalhado e use formatação em markdown.\n\n`;
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
        initialPrompt += `--- Mês: ${monthName} ---\n`;
        if (monthData.transactions) {
          Object.values(monthData.transactions).forEach(t => {
            initialPrompt += `- Dia ${t.day}: ${t.description} | Crédito: ${t.credit || 0} | Débito: ${t.debit || 0}\n`;
          });
        }
      }
      
      // Start a new chat session with the initial context
      const chatSession = model.startChat({
        history: [{ role: "user", parts: [{ text: initialPrompt }] }],
        generationConfig: { maxOutputTokens: 4096 },
      });
      setChat(chatSession);

      try {
        // Ask for the initial summary
        const result = await chatSession.sendMessage("Faça um resumo da situação financeira.");
        const response = result.response;
        const text = response.text();
        setMessages([{ role: 'model', text }]);
      } catch (error) {
        console.error("Erro na análise inicial:", error);
        setMessages([{ role: 'model', text: `Ocorreu um erro ao gerar a análise inicial. Verifique o console para mais detalhes.` }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndAnalyze();
  }, [user, selectedYear]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chat) return;

    const userMessage = userInput;
    const newMessages = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const text = response.text();
      setMessages([...newMessages, { role: 'model', text }]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages([...newMessages, { role: 'model', text: `Ocorreu um erro. Verifique o console para mais detalhes.` }]);
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
