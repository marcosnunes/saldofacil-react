import { sendEmailVerification, reload } from 'firebase/auth';

export const sendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    console.log('Email de verificação enviado para:', user.email);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error.message);
    return false;
  }
};

export const checkEmailVerified = async (user) => {
  try {
    await reload(user);
    return user.emailVerified;
  } catch (error) {
    console.error('Erro ao verificar email:', error.message);
    return false;
  }
};
