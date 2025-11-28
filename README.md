# SaldoFacil - Seu Gerenciador Financeiro Pessoal

SaldoFacil é uma aplicação web moderna construída com React, projetada para ajudar você a ter um controle claro e eficiente de suas finanças pessoais. Com uma interface intuitiva e funcionalidades poderosas, gerenciar seu dinheiro nunca foi tão simples.

## ✨ Funcionalidades Principais

- **Dashboard Intuitivo:** Tenha uma visão geral de suas finanças assim que fizer o login.
- **Lançamentos Mensais:** Adicione, edite e remova transações de débito e crédito para cada mês.
- **Cálculo de Dízimo:** Calcule automaticamente o dízimo com base em suas entradas.
- **Gerenciamento de Cartão de Crédito:** Acompanhe os gastos do seu cartão de crédito.
- **Controle de Investimentos:** Monitore o desempenho de seus investimentos.
- **Relatórios e Gráficos:** Visualize seus dados financeiros através de gráficos para uma melhor compreensão de seus hábitos de consumo.
- **Calculadora de Salário:** Uma ferramenta útil para cálculos salariais.
- **Autenticação Segura:** Suas informações financeiras estão protegidas com um sistema de login seguro.
- **Importação de Extrato OFX:** Importe transações diretamente do seu extrato bancário no formato OFX.

## 🚀 Tecnologias Utilizadas

- **React:** Biblioteca JavaScript para construir interfaces de usuário.
- **Vite:** Ferramenta de build moderna e rápida para desenvolvimento web.
- **Firebase:** Utilizado para autenticação de usuários e como banco de dados em tempo real.
- **React Router:** Para navegação e roteamento na aplicação.
- **CSS:** Estilização para uma interface limpa e agradável.

## ⚙️ Como Executar o Projeto Localmente

Para começar a usar o SaldoFacil em seu ambiente de desenvolvimento, siga os passos abaixo.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) (geralmente instalado com o Node.js)

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/marcosnunes/saldofacil-react.git
    cd saldofacil-react
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    - Crie um arquivo chamado `.env` na raiz do projeto.
    - Adicione as suas chaves do Firebase a este arquivo, como no exemplo abaixo:

    ```
    VITE_FIREBASE_API_KEY="SUA_API_KEY"
    VITE_FIREBASE_AUTH_DOMAIN="SEU_AUTH_DOMAIN"
    VITE_FIREBASE_DATABASE_URL="SUA_DATABASE_URL"
    VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
    VITE_FIREBASE_STORAGE_BUCKET="SEU_STORAGE_BUCKET"
    VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
    VITE_FIREBASE_APP_ID="SEU_APP_ID"
    ```

### Executando a Aplicação

Após a instalação, inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## 🤝 Contribuições

Contribuições são bem-vindas! Se você tiver ideias para novas funcionalidades ou melhorias, sinta-se à vontade para abrir uma *issue* ou enviar um *pull request*.
