import functions from 'firebase-functions';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

// Inicializar Firebase Admin
admin.initializeApp();

// ⚠️ CONFIGURAÇÃO NECESSÁRIA:
// 1. Gerar "Senha de Aplicativo" do Gmail:
//    - Acesse: https://myaccount.google.com/apppasswords
//    - Selecione "Mail" e "Windows Computer"
//    - Copie a senha de 16 caracteres
//
// 2. Configurar no Firebase:
//    firebase functions:config:set gmail.email="seu@gmail.com" gmail.password="senha_de_16_caracteres"
//    firebase functions:config:get  (verifique se foi salvo)
//
// 3. Deploy:
//    firebase deploy --only functions

const gmailEmail = functions.config().gmail?.email;
const gmailPassword = functions.config().gmail?.password;

let transporter;

// Inicializar transporter do Nodemailer
if (gmailEmail && gmailPassword) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail,
      pass: gmailPassword,
    },
  });
  console.log('✓ Nodemailer configurado com sucesso para:', gmailEmail);
} else {
  console.warn('⚠️ Credenciais do Gmail não configuradas. Emails não serão enviados.');
}

/**
 * Cloud Function para enviar email de verificação
 * Acionada quando um usuário novo é criado
 */
export const sendVerificationEmail = functions.auth.user().onCreate(async (user) => {
  console.log('[CLOUD FUNCTION] Novo usuário criado:', user.email);

  if (!transporter) {
    console.error('[CLOUD FUNCTION] ❌ Transporter não configurado');
    return;
  }

  try {
    // Gerar link de verificação usando Firebase Auth
    const verificationLink = await admin.auth().generateEmailVerificationLink(user.email);
    
    console.log('[CLOUD FUNCTION] Link de verificação gerado para:', user.email);

    const mailOptions = {
      from: `"SaldoFacil" <${gmailEmail}>`,
      to: user.email,
      subject: '📧 Confirme seu email - SaldoFacil',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💰 SaldoFacil</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Seu Gerenciador de Finanças Pessoais</p>
          </div>
          
          <div style="background: white; padding: 40px; text-align: center;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Bem-vindo ao SaldoFacil! 🎉</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              Obrigado por se cadastrar. Para começar a controlar suas finanças e acompanhar seus gastos, 
              confirme seu email clicando no botão abaixo.
            </p>
            
            <a href="${verificationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
                      padding: 14px 40px; text-decoration: none; border-radius: 6px; 
                      margin: 25px 0; font-weight: bold; font-size: 16px; transition: transform 0.2s;">
              ✓ Confirmar Email
            </a>
            
            <p style="color: #999; font-size: 13px; margin: 25px 0 0 0; line-height: 1.6;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <code style="background: #f5f5f5; padding: 8px 12px; border-radius: 4px; display: block; margin-top: 10px; word-break: break-all; font-size: 12px;">${verificationLink}</code>
            </p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Este email foi enviado automaticamente pela SaldoFacil. Não responda diretamente.
            </p>
            <p style="color: #999; font-size: 12px; margin: 8px 0 0 0;">
              © 2026 SaldoFacil. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('[CLOUD FUNCTION] ✓ Email enviado com sucesso:', result.messageId);
    return result;
  } catch (error) {
    console.error('[CLOUD FUNCTION] ❌ Erro ao enviar email:', {
      code: error.code,
      message: error.message,
      email: user.email
    });
    throw new functions.https.HttpsError(
      'internal',
      'Falha ao enviar email de verificação'
    );
  }
});

/**
 * Cloud Function para reenviar email de verificação
 * Pode ser chamada pelo cliente se necessário
 */
export const resendVerificationEmail = functions.https.onCall(async (data, context) => {
  console.log('[CLOUD FUNCTION] Resend solicitado');

  // Verificar se usuário está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar autenticado para reenviar o email.'
    );
  }

  if (!transporter) {
    throw new functions.https.HttpsError(
      'internal',
      'Sistema de email não está configurado.'
    );
  }

  try {
    const user = await admin.auth().getUser(context.auth.uid);
    console.log('[CLOUD FUNCTION] Reenviando para:', user.email);

    const verificationLink = await admin.auth().generateEmailVerificationLink(user.email);

    const mailOptions = {
      from: `"SaldoFacil" <${gmailEmail}>`,
      to: user.email,
      subject: '📧 Confirme seu email - SaldoFacil',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">💰 SaldoFacil</h1>
          </div>
          
          <div style="background: white; padding: 40px; text-align: center;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Reenvio de Email de Verificação</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Clique no botão abaixo para confirmar seu email e acessar sua conta.
            </p>
            
            <a href="${verificationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
                      padding: 14px 40px; text-decoration: none; border-radius: 6px; 
                      margin: 20px 0; font-weight: bold;">
              Confirmar Email
            </a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('[CLOUD FUNCTION] ✓ Email reenviado com sucesso para:', user.email);
    
    return { success: true, message: 'Email de verificação reenviado com sucesso!' };
  } catch (error) {
    console.error('[CLOUD FUNCTION] ❌ Erro ao reenviar email:', error.message);
    throw new functions.https.HttpsError(
      'internal',
      'Falha ao reenviar email de verificação'
    );
  }
});
