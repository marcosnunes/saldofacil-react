import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components';

export default function EmailVerification() {
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, emailVerified } = useAuth();

  // Verifica se email foi verificado via contexto
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Se já está verificado, redireciona imediatamente para login
    if (emailVerified) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }
  }, [user, emailVerified, navigate]);

  // Polling direto do Firebase para capturar mudança de emailVerified
  // Isso garante que detecte quando o usuário clica no link de verificação
  useEffect(() => {
    if (!user || emailVerified) {
      return; // Não precisa fazer polling se já está verificado
    }

    // Polling a cada 1 segundo para detectar quando email foi verificado
    const interval = setInterval(() => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.emailVerified) {
        // Email foi verificado! Redirecionar para login
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, emailVerified, navigate]);

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
            <p>Redirecionando para login...</p>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#fff3cd',
              color: '#856404',
              padding: '2rem 1rem',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📧</p>
              <p>
                <strong>Verificando email...</strong>
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                Clique no link enviado para <strong>{user?.email}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', margin: '1rem 0 0 0' }}>
                A verificação será detectada automaticamente
              </p>
            </div>
            <div
              style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderRadius: '4px',
                fontSize: '0.85rem',
                textAlign: 'left',
              }}
            >
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                💡 Dicas:
              </p>
              <p style={{ margin: '0.3rem 0' }}>
                • Procure na caixa de entrada por <strong>SaldoFacil</strong>
              </p>
              <p style={{ margin: '0.3rem 0' }}>
                • Se não encontrar, verifique a pasta <strong>Spam</strong>
              </p>
              <p style={{ margin: '0.3rem 0' }}>
                • Aguarde 2-5 minutos se for a primeira tentativa
              </p>
              <p style={{ margin: '0.3rem 0' }}>
                • A verificação será detectada assim que você clicar no link
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
