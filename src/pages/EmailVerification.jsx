import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkEmailVerified, sendVerificationEmail } from '../utils/emailVerification';
import { Card } from '../components';

export default function EmailVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Se já está verificado, redirecionar
    if (user.emailVerified) {
      navigate('/');
      return;
    }

    setLoading(false);

    // Polling a cada 2 segundos para verificar se email foi confirmado
    const interval = setInterval(async () => {
      const verified = await checkEmailVerified(user);
      if (verified) {
        clearInterval(interval);
        navigate('/');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  const handleResendEmail = async () => {
    if (resendCountdown > 0) return;

    const success = await sendVerificationEmail(user);
    if (success) {
      setResendCountdown(60);
      const countdown = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <Card className="auth-card">
          <p>Carregando...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <span className="card-title">📧 Verificar Email</span>

        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Um email de confirmação foi enviado para:
          </p>
          <p style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '2rem' }}>
            {user?.email}
          </p>

          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Clique no link no email para verificar sua conta.
          </p>
          <p style={{ marginBottom: '2rem', color: '#999', fontSize: '0.9rem' }}>
            Verificando automaticamente...
          </p>

          <button
            onClick={handleResendEmail}
            className="btn"
            disabled={resendCountdown > 0}
            style={{
              opacity: resendCountdown > 0 ? 0.6 : 1,
              cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {resendCountdown > 0
              ? `Reenviar em ${resendCountdown}s`
              : 'Reenviar Email'}
          </button>
        </div>
      </Card>
    </div>
  );
}
