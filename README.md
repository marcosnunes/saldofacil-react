saldofacil
Disponível na Playstore https://play.google.com/store/apps/details?id=com.autossuficiencia

Para computador e iPhone acesse pelo link: https://saldofacil.vercel.app

O que é o app Saldo Fácil? Todos precisamos ter nossa vida financeira organizada. Este app é uma ferramenta que auxilia no controle financeiro anual de qualquer pessoa. Ele possui as telas de cada mês onde podemos fazer os lançamentos diários, dos Créditos (receitas) e Débitos (despesas).

Como eu uso o app? É importante adicionar sempre um saldo inicial que deve ser digitado no mês de Janeiro no campo Saldo Inicial, ainda que os lançamentos das contas e ganhos sejam realizados a partir do meio do ano, por exemplo. Os valores dos saldos iniciais dos meses subsequêntes a janeiro serão preenchidos automaticamente conforme o fechamento do mês anterior.

No campo Fazer lançamentos, você pode adicionar os créditos (o que entra) e os débitos (o que sai). Você pode digitar o dia da operação e adicionar uma descrição para identificação.

A tela Cartão de Crédito se destina aos gastos com cartão de crédito. Você pode inserir as operações de compra adicionando a descrição da compra para identificação, a quantidade de parcelas em que será dividida a compra e o valor total da compra que será realizada. O Mês da Compra deve ser selecionado da seguinte forma:

Selecione o mês em que a compra está sendo realizada. A primeira parcela será lançada para o mês selecionado. É importante resaltar que as parcelas serão lançadas apenas até dezembro. As parcelas que corresponderem ao ano seguinte não apareceram nos lançamentos nem serão computadas.

A página Relatório mostra cada lançamento dos meses do ano e soma os valores de cada lançamento agrupando segundo a descrição do lançamento. É importante prestar atenção na digitação da descrição do lançamento para que o app reconheça cada lançamento, os agrupe e exiba na página Relatório. Por exemplo: se você digitar Salário no mês de Janeiro e no mês de Fevereiro digitar a palavra Salário com um espaço na frente, o app não vai reconhecer como sendo a mesma palavra. Para que reconheça todos os caracteres no campo descrição devem ser iguais.

Uma dica para você ter uma perspectiva da sua situação financeira anual é lançar todos os recebimentos fixos e gastos fixos do ano. Com isso você vai conseguir ter uma visão de quanto vai sobrar ou faltar de dinheiro a cada mês e vai poder fazer planos com relação aos seus gastos. Para contas variáveis, como por exemplo contas de energia e água, você pode estimar um valor "por alto". Observe o seu consumo dos anos anteriores e faça o lançamento para o ano corrente de um valor estimado baseado no seu maior consumo. Quando sua conta chegar, cheque se você está tendo um consumo maior ou menor do que o provisionado, edite o lançamento que você havia feito clicando em Editar e insira o valor real da sua conta. Assim você vai conseguir ter um real controle dos seus gastos e vai planejar práticas de economia que vão refletir no seu estilo de vida.

Importando extratos bancários Agora você também conta com a funcionalidade de Importar Extratos bancários. Você precisa baixar diretamente do seu banco, o seu extrato em formato OFX. Navegue até o mês correspondente ao mês do seu extrato e importe ele clicando no botão que fica no card Fazer Lançamento. Esta funcionalidade está disponível apenas para a versão web do site que você acessa de qualquer navegador pelo computador e foi testada apenas com extratos do banco Nubank. Possivelmente não funcionará com extratos de outros bancos, mas você pode testar.

Posso exportar para PDF ou Excel? Sim. A funcionalidade de exportação foi aprimorada e agora funciona tanto em computadores quanto em dispositivos móveis (incluindo o aplicativo Android). O sistema gera um arquivo PDF ou Excel diretamente no seu dispositivo, permitindo que você salve ou compartilhe seus relatórios financeiros de forma fácil e rápida, independentemente de onde você esteja acessando.

Perguntando para IA Obtenha insights sobre seus lançamentos perguntando para a IA Gemini. Você pode perguntar o que desejar sobre seus lançamentos financeiros, ajudando a identificar padrões, sugerir economias e responder dúvidas sobre sua situação financeira. Por exemplo, você pode perguntar "Quanto gastei em alimentação este mês?" ou "Qual foi meu maior gasto no último trimestre?".

Qual é o endereço do site do App? O Saldo Fácil é um webapp. Você pode acessá-lo no app instalado no Android baixado da Playstore ou diretamente no navegador em qualquer outro dispositivo através do endereço https://saldofacil.vercel.app

---

## 📊 Documentação Técnica Completa

### 🏗️ Arquitetura e Tecnologias

**Stack Principal:**
- **React 19.2.0** + React Router v7.9.6 - Framework frontend moderno
- **Vite 7.2.4** - Build tool ultra-rápido
- **Firebase** - Backend completo (Authentication, Realtime Database, Firestore)
- **Google Generative AI (Gemini 2.5 Pro)** - Análise financeira com IA
- **Chart.js 4.5.1 + Recharts 3.5.1** - Visualizações de dados
- **jsPDF + html2canvas** - Exportação de relatórios PDF
- **xlsx + exceljs** - Exportação para Excel

**Estrutura de Dados:**
- **Autenticação:** Firebase Authentication com email/senha
- **Banco de Dados:** Firebase Realtime Database (estrutura hierárquica: users/{uid}/{year}/{month})
- **Estado Global:** React Context API (AuthContext, YearContext, MonthlyContext)
- **Roteamento:** HashRouter para compatibilidade com WebView Android

### 🎯 Funcionalidades Detalhadas

#### 1. **Controle Mensal de Finanças**
- 12 páginas independentes (Janeiro a Dezembro)
- Lançamentos de créditos (receitas) e débitos (despesas) com dia, descrição e valor
- Cálculo automático de:
  - Saldo inicial (baseado no fechamento do mês anterior)
  - Total de créditos e débitos
  - Saldo final do mês
  - Percentual de gastos (débito/crédito)
  - Dízimo automático (10% das receitas marcadas)
- Saldo parcial acumulado por transação
- Edição e exclusão de lançamentos
- Importação de extratos bancários OFX (Nubank, Caixa, Banco do Brasil)
- Navegação por swipe entre meses

#### 2. **Gestão de Cartão de Crédito**
- Registro de compras parceladas
- Distribuição automática de parcelas pelos meses subsequentes
- Importação de faturas no formato OFX
- Agrupamento de compras por descrição
- Cálculo automático de faturas mensais
- Sincronização com saldo mensal

#### 3. **Controle de Investimentos**
- Registro de aplicações (saída da conta) e resgates (entrada na conta)
- Lançamentos recorrentes (aplicações mensais automáticas)
- Simulador de rendimentos com taxa anual configurável
- Cálculo de saldo acumulado mensal
- Edição e exclusão de movimentações
- Integração com saldo mensal final

#### 4. **Relatórios e Análises**
- **Relatório Mensal:** Extrato detalhado com todas as transações
- **Relatório Anual:** Consolidação de todos os meses com totalizadores
- **Relatório de Dízimos:** Acumulado mensal e anual de contribuições
- **Gráficos Avançados:**
  - Crédito vs Débito mensal (gráfico de barras)
  - Evolução do saldo final (gráfico de linhas)
  - Linha de tendência quadrática
  - Evolução anual (dezembro de cada ano)
- Conversão de moedas em tempo real (BRL, USD, EUR, GBP)
- Exportação para PDF e Excel (desktop e mobile)

#### 5. **IA Generativa - Análise Financeira**
- Chat conversacional com Google Gemini 2.5 Pro
- Análise inteligente de gastos e receitas
- Identificação de padrões financeiros
- Sugestões de economia personalizadas
- Dados agregados do Firebase salvos no localStorage para processamento
- Contexto completo: transações mensais, cartões, investimentos, dízimos

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
   VITE_GEMINI_API_KEY=
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
✅ **IA integrada** - Análise inteligente com Gemini  
✅ **Offline-first** - Funciona sem internet (PWA)  
✅ **Exportação universal** - PDF e Excel em qualquer dispositivo  
✅ **Gratuito** - Totalmente grátis para uso pessoal  
✅ **Open Source** - Código disponível no GitHub  

---

**Desenvolvido com ❤️ por Marcos Nunes**  
📧 marcos.lindolpho@gmail.com  
🔗 https://github.com/marcosnunes/saldofacil-react
