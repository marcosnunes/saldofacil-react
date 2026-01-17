# ⚙️ Cloud Functions - Guia de Configuração

## Objetivo
Usar suas próprias credenciais do Gmail para enviar emails de verificação. Assim, os emails chegam na caixa de entrada normalmente, sem ir para spam.

---

## 📋 Passo 1: Gerar "Senha de Aplicativo" do Gmail

1. Acesse sua conta Google: https://myaccount.google.com/apppasswords
2. Você pode precisar confirmar sua identidade
3. Selecione:
   - **App**: "Mail"
   - **Device**: "Windows Computer" (ou seu dispositivo)
4. Clique em "Generate"
5. **Copie a senha de 16 caracteres** que aparecer (ex: `abcd efgh ijkl mnop`)

⚠️ **IMPORTANTE**: Você precisa ter Autenticação em Duas Etapas ativada. Se não tiver, vá em https://myaccount.google.com/security

---

## 🔧 Passo 2: Configurar as Credenciais no Firebase

Abra o terminal na pasta raiz do projeto e execute:

```bash
firebase functions:config:set gmail.email="seu@gmail.com" gmail.password="abcd efgh ijkl mnop"
```

**Substitua:**
- `seu@gmail.com` - Seu email do Gmail
- `abcd efgh ijkl mnop` - A senha de 16 caracteres que você copiou

Para **verificar** se foi salvo corretamente:
```bash
firebase functions:config:get
```

Você deve ver algo como:
```json
{
  "gmail": {
    "email": "seu@gmail.com",
    "password": "abcd efgh ijkl mnop"
  }
}
```

---

## 🚀 Passo 3: Instalar Dependências e Deploy

Na pasta `functions/`, instale as dependências:

```bash
cd functions
npm install
cd ..
```

Deploy das Cloud Functions:

```bash
firebase deploy --only functions
```

Aguarde até ver: ✓ functions[...] Deployed successfully

---

## ✅ Passo 4: Testar

1. Acesse seu app: https://saldofacil.vercel.app
2. Crie uma nova conta com seu email
3. Verifique a caixa de entrada (NÃO spam!)
4. Você deve receber um email com layout profissional
5. Clique no link para confirmar

---

## 📝 Logs e Debugging

Para ver os logs das Cloud Functions:

```bash
firebase functions:log
```

Procure por mensagens `[CLOUD FUNCTION]` para debug.

---

## ⚠️ Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Credenciais inválidas" | Verifique se a senha de 16 caracteres está correta (sem espaços extras) |
| Email ainda vai para spam | Espere 24h após primeira configuração |
| "Two-Factor Authentication required" | Ative Autenticação em Duas Etapas em https://myaccount.google.com/security |
| Functions não encontram as credenciais | Execute `firebase functions:config:get` para verificar |

---

## 🔐 Segurança

- Nunca commit as credenciais no git
- A senha de aplicativo é específica para este app
- Você pode revogar em qualquer momento em https://myaccount.google.com/apppasswords

---

## 📖 Documentação

- Firebase Functions: https://firebase.google.com/docs/functions
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
