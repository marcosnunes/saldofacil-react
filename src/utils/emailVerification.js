import { sendEmailVerification, reload } from 'firebase/auth';

export const sendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    return true;
  } catch {
    console.error('Erro ao enviar email de verificação.');
    return false;
  }
};

export const checkEmailVerified = async (user) => {
  try {
    await reload(user);
    return user.emailVerified;
  } catch {
    console.error('Erro ao verificar email.');
    return false;
  }
};
