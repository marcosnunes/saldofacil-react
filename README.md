# 💰 Saldo Fácil - Aplicativo de Controle Financeiro Pessoal

Um **Progressive Web App (PWA)** moderno para controle financeiro anual, disponível na web, iOS, Android e computador. Organize suas receitas e despesas com relatórios inteligentes e análise com IA.

## 🌐 Acesse Agora

| Plataforma | Link |
|-----------|------|
| **Web** | [https://saldofacil.vercel.app](https://saldofacil.vercel.app) |
| **Android** | [Play Store](https://play.google.com/store/apps/details?id=com.autossuficiencia) |
| **iOS/Mac** | Acesse pelo link web |

---

## 🎯 O que é Saldo Fácil?

Todos precisamos de uma vida financeira organizada. **Saldo Fácil** é uma ferramenta inteligente que auxilia o controle financeiro anual, permitindo:

- 📊 Lançar receitas (créditos) e despesas (débitos) diários
- 💳 Gerenciar compras parceladas no cartão de crédito
- 📈 Acompanhar investimentos e aplicações
- 📋 Gerar relatórios detalhados e gráficos de tendências
- 🤖 Analisar gastos com IA conversacional
- 📥 Importar extratos bancários (OFX)
- 📑 Exportar relatórios em PDF e Excel

---

## 📚 Guia de Uso Prático

### Como Começar?

1. **Registre um saldo inicial** no mês de Janeiro (campo "Saldo Inicial")
   - Mesmo que seus lançamentos comecem depois, o app precisa de um ponto de partida

2. **Adicione suas transações** no campo "Fazer lançamentos"
   - Preencha: dia da operação, descrição (importante!) e valor
   - Créditos = o que entra | Débitos = o que sai

3. **Os meses subsequentes** são preenchidos automaticamente
   - O saldo inicial de cada mês é o saldo final do anterior

### 💡 Dicas para Máxima Utilidade

#### Planejamento Anual Inteligente
```
Melhor prática: Lançar TODOS os valores fixos e gastos fixos do ano
┌─────────────────────────────────────────────────────────┐
│ Receitas Fixas:                                          │
│ • Salário mensal                                         │
│ • Rentabilidade de investimentos                         │
│                                                          │
│ Despesas Fixas:                                          │
│ • Aluguel/Hipoteca                                       │
│ • Internet, água, luz                                    │
│ • Seguros                                                │
│ • Parcelas de empréstimos                               │
└─────────────────────────────────────────────────────────┘
Resultado: Visão clara de quanto sobra/falta cada mês
```

#### Contas Variáveis
- **Água/Energia:** Estime baseado no ano anterior (seu maior consumo)
- **Edite depois:** Quando a conta cheira, clique em "Editar" e insira o valor real
- **Resultado:** Controle real e prático de seus gastos

#### 🎯 Descrições Consistentes
⚠️ **IMPORTANTE:** O app agrupa transações por descrição exata
```
❌ ERRADO:
• "Salário" em Janeiro
• " Salário" em Fevereiro (com espaço)
→ App reconhece como 2 descrições diferentes!

✅ CORRETO:
• Use SEMPRE a mesma descrição exatamente igual
• "Salário" em todos os meses
• "Energia" em todos os meses
→ App agrupa e soma corretamente no Relatório
```

---

## 💳 Gestão de Cartão de Crédito

### Como Funciona?

1. **Registre suas compras** com:
   - Descrição da compra
   - Número de parcelas
   - Valor total

2. **Selecione o mês da compra**
   - A **1ª parcela** aparece no mês selecionado
   - As parcelas subsequentes são distribuídas nos próximos meses

3. **Limitação:** Parcelas só vão até dezembro
   - Parcelas para o próximo ano não aparecem (por design)

### Integração com Saldo
- A fatua mensal do cartão é **automaticamente descontada** do saldo do mês
- Afeta o resultado final de caixa

---

## 📊 Relatórios e Análises Avançadas

### 📄 Tipos de Relatórios

| Relatório | O que mostra |
|-----------|-------------|
| **Relatório Mensal** | Todas as transações do mês com subtotais |
| **Relatório Anual** | Consolidação de todos os 12 meses |
| **Dízimos** | Acumulado de contribuições (mensal e anual) |
| **Gráficos** | Visualizações de tendências e evolução |

### 📈 Gráficos Disponíveis

- **Crédito vs Débito:** Barras mensais para comparar receitas e despesas
- **Evolução do Saldo:** Linhas mostrando tendência ao longo do ano
- **Tendência Quadrática:** Projeção de tendência financeira
- **Evolução Anual:** Comparativo de dezembro entre anos

### 💱 Conversão de Moedas
- **Real (BRL)** - Padrão
- **Dólar (USD)**
- **Euro (EUR)**
- **Libra (GBP)**
- Taxas atualizadas em tempo real

### 📥 📤 Exportação

✅ **Agora funciona em TODOS os dispositivos:**
- Desktop (Mac, Windows, Linux)
- Mobile (Android)
- iOS

Exporte para:
- 📊 **Excel** - Dados estruturados para análise adicional
- 📄 **PDF** - Relatórios formatados prontos para imprimir/compartilhar

---

## 🤖 Análise Inteligente com IA

### Como Usar?

Acesse a página **"Perguntando para IA"** e faça qualquer pergunta sobre seus lançamentos:

**Exemplos de perguntas:**
- "Quanto gastei em alimentação este mês?"
- "Qual foi meu maior gasto no último trimestre?"
- "Onde posso economizar mais?"
- "Qual foi minha receita total em 2024?"
- "Como estou me saindo financeiramente?"

### Tecnologia
- **Motor:** Groq (Llama 3.1) - Ultra-rápido
- **Dados:** Contexto completo de transações, cartões, investimentos e dízimos
- **Privacidade:** Dados agregados do Firebase, sem armazenamento adicional

---

## 📥 Importar Extratos Bancários

### Como Importar?

1. **Baixe seu extrato em formato OFX** do seu banco
2. **Navegue até o mês** correspondente ao extrato
3. **Clique no botão de importação** (card "Fazer Lançamentos")
4. **Selecione o arquivo OFX**

### ⚠️ Observações

- ✅ **Testado com:** Nubank, Caixa, Banco do Brasil
- ⚠️ **Pode funcionar com:** Outros bancos (teste!)
- ❌ **Pode não funcionar:** Bancos com formato OFX diferente
- 🖥️ **Disponível em:** Versão web (navegador em computador)
- 📱 **Não disponível em:** Aplicativo Android/iOS (limitação técnica)

---

## 🏗️ Arquitetura Técnica

### Stack Principal

| Componente | Tecnologia | Versão |
|-----------|-----------|--------|
| **Framework** | React | 19.2.0 |
| **Roteamento** | React Router | 7.9.6 |
| **Build** | Vite | 7.2.4 |
| **Backend** | Firebase | Latest |
| **Banco de Dados** | Firebase Realtime DB | - |
| **Autenticação** | Firebase Auth | Email/Senha |
| **IA** | Groq (Llama 3.1) | Latest |
| **Gráficos** | Recharts + Chart.js | 3.5.1 + 4.5.1 |
| **Exportação** | jsPDF + ExcelJS | Latest |

### Estrutura de Dados (Firebase)

```
users/
  └── {uid}/
      ├── {year}/
      │   ├── {month}/
      │   │   ├── initialBalance: "1000.00"
      │   │   ├── transactions: { uuid: { date, description, credit, debit, balance } }
      │   │   ├── totalCredit: "5000.00"
      │   │   ├── totalDebit: "2000.00"
      │   │   ├── finalBalance: "4000.00"
      │   │   └── tithe: "500.00"
      │   └── creditCardData/
      └── investmentsData/
```

**Chaves de mês:** `january`, `february`, ..., `december`

### Estado Global (React Context)

| Context | Responsabilidades |
|---------|------------------|
| **AuthContext** | Usuário autenticado, loading de auth, verificação de email |
| **YearContext** | Ano selecionado (persistido em localStorage) |
| **MonthlyContext** | Dados do mês (transações, saldos, cartão) |

### Roteamento

- **HashRouter:** Compatibilidade com WebView Android
- **Lazy Loading:** Páginas pesadas carregam sob demanda (code-splitting)
- **ProtectedRoute:** Garante autenticação e verificação de email

---

## 🔐 Segurança e Regras do Banco de Dados

### Princípios de Segurança

✅ **Autenticação Obrigatória:** Todos os dados requerem login  
✅ **Isolamento por Usuário:** Cada usuário vê apenas seus dados (`auth.uid`)  
✅ **Verificação de Email:** Usuários precisam confirmar email para usar o app  
✅ **Validação de Dados:** Tipos, ranges e estruturas validadas no servidor  

### Regras de Validação

**Transações:** Valores não-negativos, descrição obrigatória  
**Cartão de Crédito:** Parcelas > 0, valor total > 0  
**Investimentos:** Valores de débito/crédito >= 0, descrição obrigatória  
**Dízimos:** Valores não-negativos  

### Implementação de Email Verification

O app implementa verificação obrigatória de email:

**Novo Usuário:**
1. Registra com email
2. Firebase envia email de verificação automaticamente
3. Clica no link do email
4. Redirecionado para login (ainda precisa fazer login)
5. App verifica automaticamente a cada 3s se foi confirmado
6. Após confirmação, acesso liberado ao app

**Usuário Antigo (sem verificação):**
1. Tenta fazer login
2. App detecta email não verificado
3. Envia email de verificação automaticamente
4. Mesma verificação automática a cada 3s
5. Após confirmação, acesso ao app

**Segurança:**
- Nenhum usuário consegue usar o app sem verificar email
- Rate limit protege contra abuso
- ProtectedRoute bloqueia rotas quando email não está verificado

---

## 🚀 Setup para Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# 1. Clonar repositório
git clone <repo-url>
cd saldofacil-react

# 2. Instalar dependências
npm install

# 3. Criar arquivo .env
# Copiar variáveis do arquivo src/config/firebase.js
cp .env.example .env
# Preencheer: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.

# 4. Executar em desenvolvimento
npm run dev
# Abre http://localhost:5173

# 5. Build para produção
npm run build
# Output: dist/

# 6. Verificar linting
npm run lint
```

### Estrutura de Pastas

```
src/
├── components/      # Componentes reutilizáveis
├── contexts/        # Context API (Auth, Year, Monthly)
├── pages/          # Páginas da aplicação
├── styles/         # CSS global
├── utils/          # Funções utilitárias (export, helpers)
├── config/         # Configurações (Firebase)
├── App.jsx         # Componente raiz com rotas
└── main.jsx        # Entry point
```

---

## 🔧 Adicionando Novas Funcionalidades

### Adicionar uma Nova Página

1. Criar `src/pages/NovaPage.jsx`
2. Registrar em `App.jsx`:
   ```jsx
   const NovaPage = lazy(() => import('./pages/NovaPage'));
   // Em routes:
   <Route path="/nova-page" element={
     <ProtectedRoute>
       <Suspense fallback={<LoadingFallback />}>
         <NovaPage />
       </Suspense>
     </ProtectedRoute>
   } />
   ```
3. Usar contextos:
   ```jsx
   const { user } = useAuth();
   const { selectedYear } = useYear();
   ```
4. Se acessar dados mensais, usar padrão de Firebase listener

### Adicionar um Campo em Transações

1. Atualizar `MonthlyPage.jsx` (buscar `uuidv4()`)
2. Atualizar escrita no Firebase: `set(ref(database, ...), { transactions: {...} })`
3. Atualizar cálculos no `useEffect()`
4. Se for exportar, atualizar `utils/export.js`

---

## 📝 Padrões de Código

### Mapeamento de Meses

```javascript
// helpers.js
monthsPT = ['Janeiro', 'Fevereiro', ..., 'Dezembro']  // Exibição
monthsLowercase = ['january', 'february', ..., 'december']  // Firebase keys

// Converter:
monthsLowercase[monthIndex]  // Para queries
monthsPT[monthIndex]         // Para UI
```

### Formatação de Moeda

```javascript
import { formatCurrency } from './utils/helpers';

formatCurrency(1234.56, 'BRL')  // "R$ 1.234,56"
```

### Firebase Listener Pattern

```jsx
useEffect(() => {
  if (!user || !selectedYear) return;
  
  const monthRef = ref(database, `users/${user.uid}/${selectedYear}/january/`);
  const unsubscribe = onValue(monthRef, (snapshot) => {
    if (snapshot.exists()) {
      setMonthData(snapshot.val());
    }
  });
  
  return () => unsubscribe();  // ⚠️ CRÍTICO: cleanup
}, [user, selectedYear]);
```

---

## ⚠️ Armadilhas Comuns

| Armadilha | ❌ Errado | ✅ Correto |
|-----------|----------|---------|
| **localStorage** | Armazenar transações | Usar Firebase Realtime DB |
| **Memory Leak** | Não fazer unsubscribe | `return () => unsubscribe()` no useEffect |
| **Roteamento** | BrowserRouter | HashRouter |
| **Descrições** | "Salário" e " Salário" | "Salário" sempre igual |
| **Mês anterior** | Hardcodar "january" | Usar monthsLowercase[index] |
| **Email** | Ignorar verificação | Implementar obrigatoriamente |

---

## 📊 Funcionalidades Especiais

### Dízimo Automático

- Marcas transações de crédito como "dízimo"
- Calcula automaticamente 10% das receitas marcadas
- Relatório específico de dízimos acumulados

### Investimentos

- Aplicações (débito) e resgates (crédito) separados
- Lançamentos recorrentes (aplicação mensal automática)
- Simulador de rendimentos com taxa anual
- Integração no saldo final do mês

### Calculadora de Salário

- Calcula líquido a partir do bruto
- Simula descontos (INSS, IR, etc.)
- Ferramenta auxiliar para orçamento

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|--------|
| **Dados não sincronizam** | Verificar conexão Firebase, UID do usuário |
| **Relatório não agrupa** | Verificar se descrição está digitada EXATAMENTE igual |
| **Email de verificação não chega** | Verificar pasta de spam, reenviar email |
| **Importar OFX não funciona** | Verificar formato do arquivo, tentar outro banco |
| **Gráficos em branco** | Verificar se há dados no mês, browser console para erros |

---

## 📞 Suporte e Contribuição

- **Issues:** Reporte problemas na aba Issues
- **Sugestões:** Descreva sua ideia
- **Contribuições:** Pull requests bem-vindas

---

## 📄 Licença

Projeto privado de código aberto.

---

**Versão:** 4.0  
**Última atualização:** Janeiro 2026  
**Status:** ✅ Em produção ✅ Testado em produção ✅ Suportado regularmente

#### 6. **Ferramentas Auxiliares**
- **Calculadora de Juros Compostos:** Projeção de investimentos com aportes mensais
- **Conversor de Moedas:** Conversão em tempo real via API (open.er-api.com)
- **Simulador de Salário Líquido:** Cálculo de INSS e IRRF com tabelas atualizadas
- **Integração com APIs do Banco Central:** Taxa Selic e Poupança em tempo real

### 💡 Características Técnicas Avançadas

**Arquitetura de Componentes:**
- Componentes funcionais com React Hooks (useState, useEffect, useCallback)
- Context Providers para estado compartilhado
- Protected Routes para páginas autenticadas
- Swipeable Layout para navegação touch
- Lazy loading de dados do Firebase

**Padrões de Código:**
- Separation of Concerns (componentes, páginas, contextos, utilitários)
- DRY (Don't Repeat Yourself) com helpers compartilhados
- Single Responsibility Principle
- Async/await para operações assíncronas
- Error handling robusto
- Exports/imports centralizados (index.js)

**Helpers e Utilitários:**
- `helpers.js`: Formatação de moedas, parsing OFX, geração UUID, agregação de dados
- `export.js`: Exportação PDF/Excel otimizada para web e mobile
- `monthsPT` e `monthsLowercase`: Arrays de meses para navegação

**Firebase Integration:**
- Autenticação: `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`
- Realtime Database: `ref`, `set`, `onValue`, `get`, `remove`
- Listeners em tempo real para sincronização automática
- Regras de segurança: dados isolados por usuário

**Performance e UX:**
- Auto-save de todas as alterações
- Feedback visual imediato (loading, success, error)
- Debounce em inputs para reduzir chamadas ao Firebase
- Cálculos client-side para rapidez
- PWA para uso offline
- Otimização de renderização com React.memo

**Design System:**
- Variáveis CSS customizadas (--color-primary, --shadow-soft, etc.)
- Paleta consistente: Primary #5e72e4, Success #2dce89, Danger #f5365c
- Tipografia: Poppins (300-700 weights)
- Material Icons para ícones
- Responsive breakpoints: 600px, 768px, 992px
- Dark mode friendly (estrutura preparada)

**Segurança:**
- Firebase Authentication com verificação de email
- Dados criptografados em trânsito (HTTPS)
- Regras de segurança no Realtime Database
- Validação de inputs no frontend
- Política de privacidade completa (LGPD compliance)
- Opção de exclusão permanente de conta

### 📱 Deployment e Distribuição

**Web (Vercel):**
- Build otimizado com Vite
- Hospedagem em https://saldofacil.vercel.app
- CDN global para baixa latência
- HTTPS automático
- Suporte a PWA

**Mobile (Play Store):**
- WebView Android com JavascriptInterface
- Download de arquivos via interface nativa
- Swipe gestures nativos
- Disponível em: https://play.google.com/store/apps/details?id=com.autossuficiencia

### 🔧 Configuração para Desenvolvimento

1. Clone o repositório
2. Instale dependências: `npm install`
3. Configure variáveis de ambiente (.env):
   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_DATABASE_URL=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_GROQ_API_KEY=
   ```
4. Execute: `npm run dev`
5. Build produção: `npm run build`

### 📊 Estrutura de Pastas

```
src/
├── components/       # Componentes reutilizáveis
├── config/          # Configuração Firebase
├── contexts/        # Context Providers (Auth, Year, Monthly)
├── pages/           # Páginas da aplicação
├── styles/          # CSS global e específico
└── utils/           # Helpers e funções utilitárias
```

### 🚀 Principais Diferenciais

✅ **Sem anúncios** - Experiência limpa e focada  
✅ **Dados na nuvem** - Acesso de múltiplos dispositivos  
✅ **IA integrada** - Análise inteligente com Groq (Llama 3.1)  
⚠️ **Requer internet** - Conexão obrigatória para sincronização de dados  
✅ **Exportação universal** - PDF e Excel em qualquer dispositivo  
✅ **Gratuito** - Totalmente grátis para uso pessoal  
✅ **Open Source** - Código disponível no GitHub  

---

### ⚠️ Requisitos de Conectividade

**O app Saldo Fácil REQUER CONEXÃO COM A INTERNET para funcionar.**

- 🌐 **Autenticação:** Necessária conexão para login/logout e criação de conta
- 💾 **Sincronização de Dados:** Todos os lançamentos são salvos no Firebase Realtime Database
- 📊 **IA & Análises:** Funcionalidades com IA (Gemini) requerem internet
- 💱 **Conversor de Moedas:** Cotações em tempo real requerem acesso à API
- 🔄 **Atualizações:** Dados não sincronizam sem conexão

**Recomendações:**
- Use o app com WiFi ou conexão 4G/5G ativa
- Evite usar em modo avião ou com dados móveis desativados
- Para cidades com internet instável, considere usar no horário de melhor sinal

**Nota:** Embora o README anterior mencionasse offline-first, o app atualmente funciona totalmente online. Uma versão offline com sincronização será implementada em futuras atualizações.

---

**Desenvolvido com ❤️ por Marcos Nunes**  
📧 marcos.lindolpho@gmail.com  
🔗 https://github.com/marcosnunes/saldofacil-react
