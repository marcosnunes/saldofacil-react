import * as functions from 'firebase-functions/v1';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

// Inicializar Firebase Admin
admin.initializeApp();
const dbAuth = admin.auth();

// Configurar transporte de email via Gmail
const getEmailTransporter = () => {
  // Usar environment variables em vez de functions.config() (deprecated)
  const gmailEmail = process.env.GMAIL_EMAIL;
  const gmailPassword = process.env.GMAIL_PASSWORD;

  if (!gmailEmail || !gmailPassword) {
    throw new Error(
      'Gmail credentials not configured. Set GMAIL_EMAIL and GMAIL_PASSWORD environment variables.'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail,
      pass: gmailPassword,
    },
  });
};

// Função Cloud Function - Trigger automático quando novo usuário é criado
// Usando sintaxe Firebase Functions v6
export const sendVerificationEmail = functions.auth.user().onCreate(async (user) => {
  try {
    const { email } = user;

    if (!email) {
      console.log('[sendVerificationEmail] ❌ Usuário sem email, pulando...');
      return;
    }

    console.log('[sendVerificationEmail] 📧 Gerando link de verificação para:', email);

    // Gerar link de verificação do Firebase
    const verificationLink = await dbAuth.generateEmailVerificationLink(email);
    console.log('[sendVerificationEmail] ✓ Link gerado:', verificationLink.substring(0, 50) + '...');

    // Configurar transportador de email
    const transporter = getEmailTransporter();
    const gmailEmail = process.env.GMAIL_EMAIL;

    // Template de email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              background-color: white;
              padding: 30px 20px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: 600;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              color: #666;
              font-size: 12px;
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .code-block {
              background-color: #f4f4f4;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              word-break: break-all;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>💰 SaldoFácil</h1>
              <p>Bem-vindo ao seu controle financeiro pessoal!</p>
            </div>
            
            <div class="content">
              <p>Olá! 👋</p>
              
              <p>Obrigado por se cadastrar no <strong>SaldoFácil</strong>. Para ativar sua conta e começar a gerenciar suas finanças, clique no botão abaixo para verificar seu email:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">✓ Verificar Email</a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px;">Ou copie e cole este link no seu navegador:</p>
              <div class="code-block">${verificationLink}</div>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                <strong>⏰ Este link expira em 24 horas.</strong>
              </p>
              
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Se você não criou esta conta, ignore este email.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2025 SaldoFácil - Seu gestor financeiro pessoal</p>
              <p>Este é um email automático. Por favor, não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email
    const mailOptions = {
      from: `SaldoFácil <${gmailEmail}>`,
      to: email,
      subject: '✓ Verifique seu email - SaldoFácil',
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log('[sendVerificationEmail] ✓ Email enviado com sucesso para:', email);

    return { success: true, message: 'Email de verificação enviado' };
  } catch (error) {
    console.error('[sendVerificationEmail] ❌ Erro ao enviar email:', {
      message: error.message,
      stack: error.stack,
    });
    // Não lança erro para não falhar o usuário
    return { success: false, message: error.message };
  }
});
