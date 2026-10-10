# 💰 Saldo Fácil - Controle Financeiro Anual Inteligente

Um **Progressive Web App (PWA)** moderno para controle financeiro pessoal anual, disponível na web, Android, iOS e desktop. Gerencie receitas, despesas, investimentos e cartão de crédito com relatórios inteligentes e análise com IA local no desktop Windows.

## 🌐 Acesse Agora

| Plataforma | Link | Status |
|-----------|------|--------|
| **Web** | [https://saldofacil.vercel.app](https://saldofacil.vercel.app) | ✅ Ativo |
| **Android** | [Play Store](https://play.google.com/store/apps/details?id=com.autossuficiencia) | ✅ Ativo |
| **iOS/Mac** | Acesse pelo link web | ✅ Compatível |
| **Desktop (PWA)** | Instale pelo navegador | ✅ Recomendado |

---

## 🪟 WinApp CLI (Windows/Electron)

Este projeto agora segue o fluxo recomendado da documentação da WinApp CLI para Electron:

- Uso da CLI via NPM (`@microsoft/winappcli`)
- Manifesto versionado em `Package.appxmanifest`
- Assets MSIX gerados em `Assets/`
- Scripts para identidade de debug, restore e empacotamento MSIX

### Comandos principais

```bash
# Verifica a instalação local da CLI
npm run winapp:help

# Regenera manifesto + assets + alias de execução
npm run winapp:manifest:sync

# Restaura SDKs e pacotes WinApp (quando winapp.yaml estiver presente)
npm run winapp:restore

# Aplica identidade de debug no Electron (desenvolvimento)
npm run desktop:winapp:debug:add

# Remove identidade de debug no Electron
npm run desktop:winapp:debug:clear

# Gera MSIX via WinApp a partir do layout desktop
npm run desktop:winapp:msix
```

### Quando usar cada fluxo

- **Instalador EXE/NSIS tradicional:** `npm run desktop:setup`
- **Pacote AppX (electron-builder / Store):** `npm run desktop:appx` ou `npm run desktop:appx:store`
- **Pacote MSIX com WinApp CLI:** `npm run desktop:winapp:msix`

> Observação: a identidade de debug da WinApp em apps Electron pode causar janela branca em alguns dispositivos Windows durante desenvolvimento (limitação conhecida da Microsoft/Electron). Isso não afeta o empacotamento MSIX final.

---

## 🎯 O que é Saldo Fácil?

Controle financeiro claro e organizado em uma única plataforma. **Saldo Fácil** é a ferramenta perfeita para quem quer entender seus fluxos de caixa ao longo do ano, permitindo:

- 📊 **Lançar receitas e despesas** com categorização automática por descrição
- 💳 **Gerenciar cartão de crédito** com distribuição automática de parcelas
- 📈 **Acompanhar investimentos** com simulações de rendimento
- 📋 **Relatórios detalhados** com gráficos e tendências
- 🤖 **Análise com IA local no desktop Windows** (llama.cpp) - perguntas e dados financeiros são processados no computador
- 📥 **Importar extratos** em formato OFX (banco a banco)
- 📑 **Exportar** em PDF ou Excel com um clique
- 💱 **Conversão de moedas** em tempo real (USD, EUR, GBP)
- 📱 **Funcionar offline-ready** com PWA (dados sincronizam ao voltar online)

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
📋 Melhor prática: Lançar TODOS os valores fixos e gastos previstos do ano
┌──────────────────────────────────────────────────────────┐
│ RECEITAS FIXAS:                                           │
│  • Salário mensal                                         │
│  • Rentabilidade de investimentos (mensalizada)           │
│  • Outras receitas recorrentes                            │
│                                                            │
│ DESPESAS FIXAS:                                           │
│  • Aluguel/Hipoteca                                       │
│  • Internet, água, luz, gás                               │
│  • Seguros (auto, residencial, saúde)                     │
│  • Parcelas de empréstimos/financiamentos                 │
│  • Assinaturas (streaming, apps, etc)                     │
│                                                            │
│ RESULTADO: Visão 360º de quanto sobra/falta cada mês      │
└──────────────────────────────────────────────────────────┘
```

#### Contas Variáveis (Estimativa → Realidade)
- **Primeira lançada:** Estime por histórico do ano anterior
- **Conta chega:** Clique "Editar" e insira o valor real
- **Automático:** App recalcula saldos instantaneamente
- **Resultado:** Controle evoluindo conforme dados reais

#### 🎯 Descrições Consistentes (CRÍTICO)
O app agrupa transações por descrição **exatamente igual**:

```
❌ ERRO COMUM:
  • "Salário" (jan)
  • " Salário" (fev) ← espaço extra
  • "Salario" (mar) ← sem acento
→ App reconhece como 3 descrições diferentes
→ Relatório não agrupa corretamente!

✅ SOLUÇÃO:
  • Sempre "Salário" (mesma ortografia)
  • Copiar/colar descrição dos meses anteriores
  • Usar lista de "descrições recentes" para autocomplete
→ App agrupa e soma corretamente no Relatório
```

---

## 💳 Gestão de Cartão de Crédito

### Como Funciona?

1. **Registre a compra** com:
   - Descrição (ex: "Compra Shopee")
   - Valor total
   - Número de parcelas
   - Mês da compra

2. **Parcelas são distribuídas automaticamente:**
   - 1ª parcela no mês selecionado
   - Demais parcelas nos meses subsequentes
   - Exemplo: Compra em Jan com 12x → parcelas de Jan a Dez

3. **Fatua integrada ao saldo:**
   - Total mensal de parcelas é **automaticamente descontado** do saldo
   - Aparece no resultado final de caixa

### ⚠️ Observações Importantes

- ✅ Parcelas dentro do mesmo ano funcionam perfeitamente
- ⚠️ **Parcelas que ultrapassam dezembro não são criadas** (por design - próximo ano tem seus próprios dados)
- 💡 **Dica:** Para janeiro com 12 parcelas, use 11 para não exceder o ano fiscal

---

## 📊 Relatórios e Análises Avançadas

### 📄 Tipos de Relatórios

| Relatório | Visualiza | Usa |
|-----------|-----------|-----|
| **Lançamentos** | Todas as transações do mês com detalhes | Página "Fazer Lançamentos" |
| **Consolidado Mensal** | Subtotais, saldos, cartão, investimentos | Página "Relatório" |
| **Consolidado Anual** | Resumo de todos os 12 meses | Página "Relatório Anual" |
| **Dízimos** | Acumulado de contribuições por mês e anual | Página "Dízimos" |
| **Gráficos** | Visualizações e tendências | Página "Gráficos" |

### 📈 Gráficos Disponíveis

- **Crédito vs Débito:** Barras comparando receitas × despesas mensalmente
- **Evolução do Saldo:** Linhas mostrando tendência de caixa ao longo do ano
- **Tendência Quadrática:** Projeção de padrão financeiro futuro
- **Comparativo Anual:** Dezembro entre anos anteriores (histórico)
- **Distribuição de Gastos:** Pizza de categorias (por descrição)

### 💱 Conversão de Moedas
- **Real (BRL)** - Padrão do app
- **Dólar (USD)**
- **Euro (EUR)**
- **Libra (GBP)**
- Cotações atualizadas em tempo real via API externa

### 📥 📤 Exportação

✅ **Funciona em TODOS os dispositivos:**
- Desktop (Windows, Mac, Linux)
- Mobile (Android, iOS)
- PWA instalado

**Exportar para:**
- 📊 **Excel** - Planilha formatada com cálculos
- 📄 **PDF** - Relatório visual pronto para imprimir/compartilhar

---

## 🤖 Análise Inteligente com IA

### Como Usar?

Acesse a página **"Perguntando para IA"** e faça qualquer pergunta sobre seus dados financeiros:

**Exemplos de perguntas:**
- "Quanto gastei em alimentação este mês?"
- "Qual foi meu maior gasto no último trimestre?"
- "Em qual categoria devo economizar mais?"
- "Qual foi minha receita total em 2025?"
- "Como estou me saindo financeiramente?"
- "Qual é minha taxa de poupança mensal?"
- "Compare meus gastos com mês anterior"

### Tecnologia & Privacidade

- **Modelo:** Claude2 Alpaca 7B quantizado em GGUF Q6_K (5,53 GB)
- **Contexto:** Acesso a TODOS seus dados (transações, cartão, investimentos, dízimos)
- **Disponibilidade:** Somente no aplicativo desktop Windows. A interface, rota e conexões da IA não são incluídas no build web/PWA nem no WebView Android
- **Desktop Windows instalado:** O MSIX contém o runtime llama.cpp e os pesos GGUF. Ao iniciar, uma janela de progresso aparece antes da janela principal; o app abre quando o modelo estiver pronto, ou imediatamente se a pessoa escolher "Continuar sem IA". O usuário não precisa instalar programas adicionais nem baixar o modelo
- **Empacotamento desktop:** Os arquivos locais em `runtime-ai` e os avisos/licenças em `workspace-ai-models/claude2-alpaca-7B-GGUF` são preparados em `build/ai-runtime` por `npm run desktop:ai:prepare`. Os comandos de build desktop executam essa preparação automaticamente e falham se faltar algum recurso; não há download durante o build. O pacote final cresce em aproximadamente 5,6 GB
- **Desenvolvimento Electron:** `npm run desktop:dev` usa diretamente `runtime-ai/bin/llama-server.exe` e o GGUF local
- **Logs para diagnóstico da IA:** aparecem no terminal que executa `desktop:dev` com o prefixo `[LOCAL-AI]`, no console do DevTools com `[LOCAL-AI][renderer]` e são gravados em `logs/local-ai.log` dentro da pasta de dados do app (o caminho completo aparece no evento `application.start`). Os logs registram inicialização, saída/erros do llama.cpp e duração/resultado técnico das perguntas; não registram o texto das perguntas nem das respostas
- **Respostas da IA:** são transmitidas para a tela conforme o modelo as gera. O limite é de 256 tokens por resposta para manter respostas concisas e reduzir o tempo de processamento
- **Teste rápido:** abra a tela "Perguntando para IA", envie uma pergunta simples e procure `ui.submit_received` e `ui.generate_started` no console do DevTools. No terminal/arquivo, procure `chat.request_started`, seguido de `chat.request_succeeded` ou `chat.request_failed`. `ui.submit_blocked` indica o motivo pelo qual a interface não enviou a pergunta. Se a inicialização não completar, procure `startup.failed`, `runtime.spawn_error`, `runtime.exit` ou as linhas `runtime.stderr`
- **Requisitos de memória:** a documentação do modelo estima cerca de 8 GB de RAM para Q6_K; 16 GB são recomendados para o Windows e o app funcionarem com folga. O carregamento inicial pode levar alguns minutos
- **Licenças:** as licenças e a política de uso do Llama 2, além da licença MIT do llama.cpp, acompanham o runtime em `resources/ai-runtime/licenses`
- **Arquivos necessários para desenvolver/empacotar IA:** `runtime-ai/bin/llama-server.exe`, as DLLs fornecidas ao lado dele e `runtime-ai/models/claude2-alpaca-7b.Q6_K.gguf`; as licenças e a documentação do modelo devem estar em `workspace-ai-models/claude2-alpaca-7B-GGUF`. Essas pastas são locais e estão no `.gitignore`; forneça os recursos separadamente em qualquer máquina de build
- **Testar no desktop:** `npm run desktop:dev` (Windows x64; inicia o runtime e carrega o modelo local automaticamente)
- **Privacidade:** O app não mantém histórico de conversas; os dados financeiros continuam sincronizados com o Firebase conforme o restante do app
- **Erro comum:** Descrições inconsistentes resultam em análises imprecisas (volte ao tip acima!)

### ⚠️ Importante
- IA analisa base nos dados reais → dados incompletos = análise incompleta
- Sempre revise os números apresentados manualmente
- Use para insights, não como aconselhamento financeiro profissional

---

## 📥 Importar Extratos Bancários (OFX)

### Como Importar?

1. **Baixe seu extrato em OFX** do site/app do seu banco
   - Geralmente em: "Extrato" → "Baixar" → "Formato OFX"
   - Válido também para extratos de investimento

2. **No app:** Navegue até o mês correspondente
3. **Clique em "Importar Extrato"** (card de lançamentos)
4. **Selecione o arquivo OFX**
5. **Revise** as transações importadas antes de confirmar

### ✅ Bancos Testados e Funcionando

- ✅ **Nubank** - Funciona perfeitamente
- ✅ **Caixa Econômica** - Funciona
- ✅ **Banco do Brasil** - Funciona
- ✅ **Bradesco, Itaú** - Muito provável que funcione (não testado)
- ⚠️ **Outros bancos** - Podem funcionar, depende do formato OFX

### ⚠️ Limitações

- 📱 **Não disponível em:** Android/iOS nativos (limitação técnica)
- 🖥️ **Disponível em:** Navegador web no desktop
- 📄 **Formato:** Apenas OFX (não suporta CSV, PDF)
- 🚨 **Valide:** Sempre revise os lançamentos importados (verificar valores e datas)

### 💡 Dica de Ouro
Após importar, as transações aparecem com datas e descrições exatas do banco. Revise se as descrições estão consistentes com suas adições manuais (regra de descrições iguais!).

---

## 🏗️ Arquitetura Técnica

### Stack Principal

| Componente | Tecnologia | Versão | Motivo |
|-----------|-----------|--------|--------|
| **Framework** | React | 19.2.0 | UI moderna com hooks |
| **Roteamento** | React Router | 7.9.6 | Compatibilidade com WebView Android |
| **Build** | Vite | 7.2.4 | Performance otimizada |
| **Backend** | Firebase | Latest | Autenticação + Realtime DB |
| **Banco de Dados** | Firebase Realtime DB | - | Sincronização em tempo real |
| **Autenticação** | Firebase Auth | - | Email/Senha + verificação |
| **IA desktop Windows** | llama.cpp + Claude2 Alpaca 7B Q6_K (GGUF) | Local | Runtime e modelo incluídos no MSIX e carregados ao iniciar o app |
| **Gráficos** | Recharts | 3.5.1 | Visualizações interativas |
| **Exportação** | jsPDF + ExcelJS | Latest | PDF + Excel |
| **HTTP Client** | Fetch API | Native | Requisições simples e rápidas |

### Estrutura de Dados (Firebase Realtime Database)

```
users/
  └── {uid}/
      ├── {year}/
      │   ├── january/
      │   │   ├── initialBalance: "1000.00"
      │   │   ├── transactions: { 
      │   │   │   "{uuid}": { 
      │   │   │       date: "2025-01-15",
      │   │   │       description: "Salário",
      │   │   │       credit: "3000.00",
      │   │   │       debit: "0",
      │   │   │       tithe: false,
      │   │   │       balance: "4000.00"
      │   │   │   }
      │   │   │ }
      │   │   ├── totalCredit: "5000.00"
      │   │   ├── totalDebit: "2000.00"
      │   │   ├── finalBalance: "4000.00"
      │   │   ├── percentage: "80.00"
      │   │   ├── creditCardBalance: "0.00"
      │   │   ├── investmentBalance: "0.00"
      │   │   └── tithe: "500.00"
      │   ├── february/, ... (outros meses)
      │   └── creditCardBalances/
      │       ├── januaryCreditCardBalance: "250.00"
      │       └── ...
      │
      ├── creditCardData/{year}/{cardId}/
      │   ├── description: "iPhone 15"
      │   ├── totalValue: "5000.00"
      │   ├── installments: 12
      │   ├── month: "January"
      │   └── purchaseDate: "2025-01-10"
      │
      └── investmentsData/{year}/{investmentId}/
          ├── description: "Fundo Imobiliário"
          ├── debitValue: "1000.00" (aporte)
          ├── creditValue: "50.00" (resgate)
          ├── month: "Janeiro 2025"
          ├── recurrence: 1 (recorrência em meses)
          └── rate: "1.5" (taxa anual %)
```

**Chaves de mês:** Sempre lowercase e em inglês: `january`, `february`, `march`, ... `december`

### Estado Global (React Context API)

| Context | Localização | Responsabilidades |
|---------|------------|------------------|
| **AuthContext** | `src/contexts/AuthContext.jsx` | Usuário autenticado, loading, email verificado |
| **YearContext** | `src/contexts/YearContext.jsx` | Ano selecionado (persistido em localStorage) |
| **MonthlyContext** | `src/contexts/MonthlyContext.jsx` | Dados do mês (transações, cartão, investimentos) |

### Roteamento

- **Router:** `HashRouter` (não BrowserRouter) - Compatibilidade WebView Android
- **Rotas públicas:** `/login`, `/signup`, `/privacy`, `/email-verification`
- **Rotas protegidas:** Requerem `useAuth()` + `emailVerified = true`
- **Code-Splitting:** Lazy-loaded com `React.lazy()` + `Suspense`

---

## 🔐 Segurança, Verificação de Email e Regras do Banco de Dados

### Autenticação com Email Verification (Cloud Functions)

**O app implementa verificação obrigatória de email via Firebase Cloud Functions + Nodemailer + Gmail.**

#### 🔄 Fluxo para Novo Usuário

```
1. Usuário preenche Signup (email + senha)
   ↓
2. Firebase cria conta: createUserWithEmailAndPassword()
   ↓
3. Cloud Function "sendVerificationEmail" dispara automaticamente
   ↓
4. Email enviado via Gmail (domínio confiável) → Inbox ✓
   ↓
5. Página de sucesso → Redireciona para /email-verification após 3s
   ↓
6. App começa polling (a cada 1s): user.emailVerified?
   ↓
7. Usuário abre email em outra aba e clica link
   ↓
8. Firebase marca emailVerified = true
   ↓
9. App detecta (dentro de 1s) → Redireciona para /login
```

#### 👤 Usuário Sem Verificação (Login)

```
1. Tenta fazer login → signInWithEmailAndPassword()
   ↓
2. App checa: user.emailVerified === false?
   ↓
3. Redireciona para /email-verification
   ↓
4. Link original do email ainda válido (24h)
   ↓
5. Clica link → Polling detecta mudança → Redireciona para /login
```

#### 📧 Email Enviado

- **De:** seu@gmail.com (customizado, não noreply@firebase.com)
- **Assunto:** ✓ Verifique seu email - SaldoFácil
- **Conteúdo:** Template HTML profissional com branding
- **Tempo:** 1-2 minutos para Inbox
- **Validade:** 24 horas

#### ⚙️ Setup das Cloud Functions (Primeira Vez)

```bash
# 1. Ativar Autenticação em Duas Etapas no Gmail
#    https://myaccount.google.com/security

# 2. Gerar Senha de Aplicativo
#    https://myaccount.google.com/apppasswords
#    → Selecione: Mail + seu OS

# 3. Configurar Firebase Functions (ambiente)
firebase functions:config:set gmail.email="seu@gmail.com" gmail.password="SENHA_AQUI"

# 4. Deploy das funções
firebase deploy --only functions

# 5. Monitorar logs (se necessário)
firebase functions:log --limit 50
```

**Arquivos envolvidos:**
- `functions/index.js` → Cloud Functions para envio de email
- `functions/package.json` → Dependências (firebase-admin, nodemailer)
- `src/pages/Signup.jsx` → Cria conta, CF envia email
- `src/pages/EmailVerification.jsx` → Polling + redirecionamento
- `src/pages/Login.jsx` → Detecta usuários não verificados
- `src/contexts/AuthContext.jsx` → Fornece estado `emailVerified`

### Princípios de Segurança

✅ **Autenticação obrigatória** - Todos os dados requerem login  
✅ **Isolamento por usuário** - Cada um vê apenas seus dados (`auth.uid`)  
✅ **Email verificado** - Requisito para qualquer funcionalidade financeira  
✅ **Validação servidor** - Tipos, ranges e estruturas verificados no Firebase  
✅ **HTTPS** - Todos os dados criptografados em trânsito  
✅ **Sem logs** - Dados não são armazenados após análise de IA  

### Regras de Validação (Firebase)

```
Transações:
  • Valores não-negativos
  • Descrição obrigatória
  • Data válida (não no futuro)

Cartão de Crédito:
  • Parcelas > 0
  • Valor total > 0
  • Mês válido

Investimentos:
  • Débito/crédito >= 0
  • Descrição obrigatória
  • Taxa de rendimento >= 0

Dízimos:
  • Valores não-negativos
```

---

## 🚀 Setup para Desenvolvimento

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Firebase com:
  - Realtime Database ativado
  - Authentication com Email/Senha ativado
  - Cloud Functions ativo (para email verification)

### 1️⃣ Instalação do Frontend

```bash
# Clone o repositório
git clone <repo-url>
cd saldofacil-react

# Instale dependências
npm install

# Configure variáveis de ambiente (.env)
cp .env.example .env

# Preencha no .env:
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://xxxxx.firebaseio.com
VITE_FIREBASE_PROJECT_ID=xxxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=xxxxx
VITE_FIREBASE_APP_CHECK_SITE_KEY=xxxxx  # Site key pública do reCAPTCHA Enterprise
✅ **Sem histórico de chat** - O app não persiste perguntas nem respostas; no desktop, a pergunta e o contexto são processados localmente pelo llama.cpp

# Desenvolvimento local
npm run dev
# Abre http://localhost:5173 (HashRouter usa #/)

# Build produção
npm run build
# Output: dist/

# Verificar linting
npm run lint
```

### 2️⃣ Instalação das Cloud Functions (Email Verification)

```bash
# Instale Firebase CLI (se não tiver)
npm install -g firebase-tools

# Faça login no Firebase
firebase login

# Gere senha de aplicativo no Gmail
# Acesse: https://myaccount.google.com/apppasswords
# 1. Ative Two-Factor Authentication primeiro
# 2. Selecione: Mail + seu Sistema Operacional
# 3. Copie a senha gerada

# Configure as credenciais no Firebase
firebase functions:config:set \
  gmail.email="seu@gmail.com" \
  gmail.password="sua_senha_16_caracteres"

# Instale dependências das functions
cd functions
npm install
cd ..

# Deploy das Cloud Functions
firebase deploy --only functions

# Acompanhe os logs (se necessário)
firebase functions:log --limit 50

# (Opcional) Emule localmente
firebase emulators:start --only functions
```

### Estrutura de Pastas

```
src/
├── components/           # Componentes reutilizáveis
│   ├── Card.jsx
│   ├── Navigation.jsx
│   ├── ProtectedRoute.jsx
│   ├── SwipeableLayout.jsx
│   └── ...
├── contexts/             # Context API (gerência de estado)
│   ├── AuthContext.jsx
│   ├── YearContext.jsx
│   └── MonthlyContext.jsx
├── pages/                # Páginas da aplicação
│   ├── Dashboard.jsx
│   ├── MonthlyPage.jsx
│   ├── CreditCard.jsx
│   ├── Investments.jsx
│   ├── AIReports.jsx
│   ├── Charts.jsx
│   └── ...
├── styles/               # CSS global
│   ├── style.css
│   └── dashboard.css
├── utils/                # Funções utilitárias
│   ├── helpers.js        # Formatação, parsing OFX, etc.
│   ├── export.js         # Exportação PDF/Excel
│   └── emailVerification.js
├── config/               # Configurações
│   └── firebase.js       # Setup Firebase
├── App.jsx               # Componente raiz + Rotas
└── main.jsx              # Entry point

functions/               # Cloud Functions (Node.js)
├── index.js            # Trigger de email verification
└── package.json
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
| **Roteamento** | BrowserRouter | HashRouter (Android WebView) |
| **Descrições** | "Salário" e " Salário" | "Salário" sempre igual |
| **Mês anterior** | Hardcodar "january" | Usar `monthsLowercase[index]` |
| **Email** | Ignorar verificação | Implementar obrigatoriamente |
| **Firestore** | Usar Firestore | Usar Realtime Database apenas |

---

## 📊 Funcionalidades Especiais

### 💚 Dízimo Automático

- Marque transações de crédito como "dízimo"
- Calcula automaticamente 10% do total de receitas marcadas
- Relatório consolidado de dízimos acumulados (mensal e anual)
- Perfeito para controle de contribuições religiosas

### 📈 Investimentos com Recorrência

- **Aportes:** Débitos para aplicações mensais
- **Resgates:** Créditos para saques
- **Recorrência:** Automático mensal (ex: aporte todo mês)
- **Simulador:** Projeção com taxa anual configurável
- **Integração:** Saldo agregado ao final do mês

### 💼 Calculadora de Salário

- Calcula salário líquido a partir do bruto
- Simula descontos automáticos (INSS, IR)
- Tabelas atualizadas periodicamente
- Ferramenta auxiliar para planejamento

---

## 🐛 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|--------|
| **Dados não sincronizam** | Conexão Firebase | Verificar internet, UID do usuário, Firebase rules |
| **Relatório não agrupa** | Descrições inconsistentes | Usar EXATAMENTE a mesma descrição todos os meses |
| **Email não chega** | Spam folder | Verificar pasta de spam, reenviar link |
| **Importar OFX não funciona** | Formato incompatível | Verificar banco, tentar outro formato |
| **Gráficos em branco** | Sem dados no mês | Adicionar transações, verificar console |
| **App congela** | Muitos dados/listeners | Fechar abas extras, limpar cache |
| **Cloud Functions erro** | Config não aplicada | Rodar `firebase functions:config:get` |

---

## 🎯 Recursos & Documentação

- **Firebase Console:** https://console.firebase.google.com
- **llama.cpp:** https://github.com/ggml-org/llama.cpp
- **Vercel Deploy:** https://vercel.com
- **GitHub:** https://github.com/marcosnunes/saldofacil-react
- **Copilot Instructions:** `.github/copilot-instructions.md` (para IA builders)

---

## 📞 Suporte & Contribuição

- 🐛 **Reportar bug:** Abra uma [Issue](https://github.com/marcosnunes/saldofacil-react/issues)
- 💡 **Sugestão:** Descreva sua ideia na aba Discussions
- 🤝 **Contribuir:** Pull requests bem-vindas! (Veja main branch)
- 📧 **Contato:** marcos.lindolpho@gmail.com

---

## 📄 Licença

Projeto privado. Código disponível para fins educacionais e pessoais.

---

## 🚀 Principais Diferenciais

| Feature | Status |
|---------|--------|
| ✅ Sem anúncios | Experiência limpa |
| ✅ Dados em nuvem | Multi-dispositivo |
| ✅ IA local no desktop Windows | Runtime llama.cpp e modelo GGUF incluídos no MSIX |
| ✅ Exportação Universal | PDF + Excel |
| ✅ Código limpo | Context API, Hooks |
| ✅ Mobile First | Android + iOS/Web |
| ✅ PWA Ready | Instalável no desktop |
| ✅ Open Source | Código no GitHub |

---

## ⚡ Requisitos de Conectividade

**O Saldo Fácil REQUER INTERNET para operar:**

```
🌐 Autenticação     → Login/logout, criação de conta
💾 Sincronização   → Todos os lançamentos (Firebase)
📊 IA desktop      → llama.cpp e modelo locais; indisponível no web e Android
💱 Taxas           → Conversão de moedas em tempo real
🔄 Atualizações    → Sincronizar dados entre dispositivos
```

**Recomendações:**
- Use WiFi ou 4G/5G quando possível
- Evite modo avião durante uso
- Para internet instável, acesse em horários de melhor sinal
- PWA permite acesso rápido se já carregou antes (sem dados)

**Nota Futura:** Versão offline com sincronização será adicionada em atualizações futuras.

---

## 📊 Estatísticas do Projeto

- **Stack:** React 19 + Vite 7 + Firebase
- **Tamanho (gzipped):** ~150KB (com lazy-loading)
- **Bundle chunks:** Firebase (150KB), Recharts (80KB), Vendor (React)
- **Performance:** Lighthouse 90+ em desktop
- **Browser Support:** Chrome, Firefox, Safari 12+
- **Usuários ativos:** Disponível em Play Store desde 2024

---

**Desenvolvido com ❤️ por [Marcos Nunes](https://github.com/marcosnunes)**

**Versão:** 4.0  
**Última atualização:** Janeiro 2026  
**Status:** ✅ Produção | ✅ Testado | ✅ Suportado Regularmente
