import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reload } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { resendVerificationEmail } from '../utils/emailVerification';
import { Card } from '../components';

export default function EmailVerification() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const { user, emailVerified } = useAuth();
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Verifica automaticamente a cada 3 segundos se o email foi verificado
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Se já está verificado, redireciona imediatamente
    if (emailVerified) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
      return;
    }

    // Setup do interval para verificação periódica
    const interval = setInterval(async () => {
      try {
        setCheckingEmail(true);
        // Recarregar informações do usuário para pegar emailVerified atualizado
        await reload(user);
        
        // onAuthStateChanged será disparado automaticamente e atualizará o contexto
      } catch (err) {
        console.error('Erro ao verificar email:', err);
      } finally {
        setCheckingEmail(false);
      }
    }, 3000); // Verifica a cada 3 segundos

    return () => clearInterval(interval);
  }, [user, emailVerified, navigate]);

  const handleResendEmail = async () => {
    if (!user) {
      setError('Usuário não encontrado. Por favor, faça login novamente.');
      return;
    }

    setError('');
    setResendLoading(true);

    const result = await resendVerificationEmail(user);
    
    if (result.success) {
      alert(result.message + ' Procure na sua caixa de entrada ou na pasta de spam.');
    } else {
      setError(result.message);
    }
    
    setResendLoading(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
      setError('Erro ao sair. Por favor, tente novamente.');
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <span className="card-title">Verificar Email</span>

        {success ? (
          <div
            style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '1rem',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <p>
              <span style={{ fontSize: '2rem' }}>✓</span>
            </p>
            <p>
              <strong>Email verificado com sucesso!</strong>
            </p>
            <p>Redirecionando para o painel...</p>
          </div>
        ) : (
          <div>
            <div
              style={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}
            >
              <p>
                <strong>Verificação de Email Pendente</strong>
              </p>
              <p>
                Um email de confirmação foi enviado para{' '}
                <strong>{user?.email}</strong>
              </p>
              <p>Clique no link no email para confirmar sua conta.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {checkingEmail ? '⏳ Verificando...' : '✓ Verificação automática ativa (a cada 3s)'}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexDirection: 'column',
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={handleResendEmail}
                disabled={resendLoading}
                style={{ marginBottom: '0.5rem' }}
              >
                {resendLoading ? 'Reenviando...' : 'Reenviar Email de Confirmação'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '0.7rem 1.5rem',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Sair
              </button>
            </div>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
      </Card>
    </div>
  );
}
