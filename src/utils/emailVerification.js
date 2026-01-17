import { reload, sendEmailVerification } from 'firebase/auth';

/**
 * Verifica se o email do usuário foi confirmado
 * @param {User} user - Objeto de usuário do Firebase
 * @returns {Promise<boolean>} - True se email foi confirmado, false caso contrário
 */
export const isEmailVerified = async (user) => {
  if (!user) return false;
  
  try {
    await reload(user);
    return user.emailVerified;
  } catch (error) {
    console.error('Erro ao verificar status do email:', error);
    return false;
  }
};

/**
 * Reenvia o email de verificação para o usuário
 * @param {User} user - Objeto de usuário do Firebase
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const resendVerificationEmail = async (user) => {
  if (!user) {
    return {
      success: false,
      message: 'Usuário não fornecido',
    };
  }
  
  try {
    await sendEmailVerification(user);
    return {
      success: true,
      message: 'Email de verificação reenviado com sucesso!',
    };
  } catch (error) {
    console.error('Erro ao reenviar email de verificação:', error);
    
    let message = 'Erro ao reenviar email de verificação.';
    if (error.code === 'auth/too-many-requests') {
      message = 'Muitas tentativas. Tente novamente em alguns minutos.';
    }
    
    return {
      success: false,
      message,
    };
  }
};
