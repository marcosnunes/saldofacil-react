import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useYear } from '../contexts/YearContext';
import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';
import { monthsLowercase, monthsPT } from '../utils/helpers';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AIReports() {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [model, setModel] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize model and fetch initial analysis
  useEffect(() => {
    const initAI = async () => {
      if (!user) return;
      if (!API_KEY) {
        alert("Por favor, configure sua chave da API do Gemini no arquivo .env");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const aiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        setModel(aiModel);

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
        
        const initialQuestion = "Faça um resumo da situação financeira.";
        const fullPrompt = initialPrompt + "\n\n" + initialQuestion;

        const result = await aiModel.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        const initialHistory = [
          { role: "user", parts: [{ text: fullPrompt }] },
          { role: "model", parts: [{ text: text }] }
        ];
        
        setChatHistory(initialHistory);
        setMessages([{ role: 'model', text: text }]);

      } catch (error) {
        console.error("Erro na análise inicial:", error);
        setMessages([{ role: 'model', text: `Ocorreu um erro ao gerar a análise inicial: ${error.message}` }]);
      } finally {
        setIsLoading(false);
      }
    };

    initAI();
  }, [user, selectedYear]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !model) return;

    const userMessageText = userInput;
    const newUiMessages = [...messages, { role: 'user', text: userMessageText }];
    setMessages(newUiMessages);
    setUserInput('');
    setIsLoading(true);

    // This mirrors the working HTML logic: start a new chat with full history for each message
    try {
      const chatSession = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 4096,
        },
      });

      const result = await chatSession.sendMessage(userMessageText);
      const response = await result.response;
      const text = response.text();

      // Update history with the latest interaction
      const updatedHistory = await chatSession.getHistory();
      setChatHistory(updatedHistory);
      
      setMessages([...newUiMessages, { role: 'model', text: text }]);

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages([...newUiMessages, { role: 'model', text: `Ocorreu um erro: ${error.message}` }]);
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
                disabled={isLoading || !model}
              />
              <button type="submit" className="btn" disabled={isLoading || !model}>
                <i className="material-icons">send</i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
