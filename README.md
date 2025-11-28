# Saldo Fácil - React

Uma aplicação React moderna para controle financeiro pessoal.

## Sobre o Projeto

O Saldo Fácil é uma ferramenta que auxilia no controle financeiro anual. Permite registrar créditos (receitas) e débitos (despesas) diariamente, com telas separadas para cada mês.

## Tecnologias

- **React 19** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool rápido para desenvolvimento
- **Firebase** - Backend para autenticação e banco de dados
- **React Router** - Navegação entre páginas
- **Chart.js** - Gráficos interativos

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Copie o arquivo `.env.example` para `.env`
3. Preencha as variáveis de ambiente com suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_DATABASE_URL=your_database_url_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

## Deploy na Vercel

O projeto está otimizado para deploy "zero-config" na Vercel:

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente do Firebase no painel da Vercel
3. A Vercel detectará automaticamente que é um projeto Vite e fará o build

## Funcionalidades

- **Controle Mensal**: Registre receitas e despesas para cada mês do ano
- **Cartão de Crédito**: Gerencie compras parceladas
- **Investimentos**: Acompanhe seus investimentos e simule rendimentos
- **Dízimos**: Controle de doações e contribuições
- **Relatórios**: Visualize seus gastos anuais
- **Gráficos**: Análise visual de créditos vs débitos
- **Ferramentas**: Calculadora de juros compostos e conversor de moedas
- **Calculadora de Salário**: Simule seu salário líquido
- **Importação OFX**: Importe extratos bancários
- **Exportar PDF**: Exporte relatórios para PDF

## Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── config/         # Configuração do Firebase
├── contexts/       # Contextos React (Auth, Year)
├── pages/          # Páginas da aplicação
├── styles/         # Arquivos CSS
└── utils/          # Funções utilitárias
```

## Licença

Este projeto está sob a licença MIT.
