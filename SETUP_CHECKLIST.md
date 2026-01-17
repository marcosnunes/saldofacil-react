# ✅ Checklist - Cloud Functions Setup

## 📋 Antes de Começar
- [ ] Você tem acesso à sua conta Gmail
- [ ] Você tem acesso ao Firebase Console
- [ ] Firebase CLI está instalado (`firebase --version`)

---

## 1️⃣ Gerar Senha de Aplicativo Gmail

**Tempo estimado: 2 minutos**

- [ ] Acesse: https://myaccount.google.com/apppasswords
- [ ] Verifique se tem **Autenticação em Duas Etapas** ativada
  - Se não: https://myaccount.google.com/security → Ativar
- [ ] Selecione: Mail + Windows Computer
- [ ] Clique "Generate"
- [ ] **Copie a senha de 16 caracteres** (ex: `abcd efgh ijkl mnop`)
- [ ] **Salve em um lugar seguro** (você vai usar em seguida)

---

## 2️⃣ Configurar Firebase

**Tempo estimado: 2 minutos**

- [ ] Abra terminal na pasta raiz do projeto
- [ ] Execute:
  ```bash
  firebase functions:config:set gmail.email="seu@gmail.com" gmail.password="abcd efgh ijkl mnop"
  ```
  - Substitua `seu@gmail.com` pelo seu email
  - Substitua `abcd efgh ijkl mnop` pela senha de 16 caracteres
- [ ] Verifique se foi salvo:
  ```bash
  firebase functions:config:get
  ```
- [ ] Procure por `gmail.email` e `gmail.password` na saída

---

## 3️⃣ Instalar Dependências

**Tempo estimado: 1-2 minutos**

- [ ] Na pasta raiz, execute:
  ```bash
  cd functions
  npm install
  cd ..
  ```
- [ ] Aguarde até ver "added X packages"

---

## 4️⃣ Deploy das Cloud Functions

**Tempo estimado: 2-5 minutos**

- [ ] Execute:
  ```bash
  firebase deploy --only functions
  ```
- [ ] Aguarde até ver:
  - ✓ functions[sendVerificationEmail] Deployed successfully
  - ✓ functions[resendVerificationEmail] Deployed successfully

---

## 5️⃣ Testar

**Tempo estimado: 5 minutos**

- [ ] Acesse: https://saldofacil.vercel.app/#/signup
- [ ] Crie uma conta com **seu email real**
- [ ] Aguarde redirect para `/email-verification`
- [ ] Verifique a **caixa de entrada** (não spam!)
- [ ] Procure por remetente **seu@gmail.com**
- [ ] Procure por "SaldoFacil" no título do email
- [ ] Clique no link **"Confirmar Email"**
- [ ] App deve redirecionar para `/login` em ~1s
- [ ] Faça login com suas credenciais
- [ ] 🎉 Sucesso! Email verification funcionando!

---

## 🔍 Verificar Logs

Se algo não funcionar:

```bash
firebase functions:log
```

Procure por:
- `[CLOUD FUNCTION]` → Seu deploy funcionou
- `✓ Email enviado com sucesso` → Email foi enviado
- `❌ ERRO` → Erro ocorreu (procure os detalhes)

---

## ⚠️ Se Algo Der Errado

### Email não chega
- [ ] Verifique spam/lixo eletrônico
- [ ] Espere 2-5 minutos
- [ ] Verifique logs com `firebase functions:log`

### "Credenciais inválidas"
- [ ] Verifique a senha de 16 caracteres (sem espaços)
- [ ] Execute `firebase functions:config:get`
- [ ] Reconfigure se necessário

### Cloud Function não dispara
- [ ] Verifique se o deploy foi bem-sucedido
- [ ] Crie uma **nova conta** após o deploy (não usa contas antigas)
- [ ] Verifique logs com `firebase functions:log`

### "Two-Factor Authentication required"
- [ ] Ative em: https://myaccount.google.com/security

---

## 🎉 Parabéns!

Seus emails de verificação agora:
- ✅ Chegam na caixa de entrada
- ✅ São enviados do seu Gmail
- ✅ Têm layout profissional
- ✅ São entregues em 1-2 minutos

---

**Tempo total: ~15 minutos** ⏱️
