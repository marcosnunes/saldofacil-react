import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Card, InputField } from '../components';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[SIGNUP] ✓ Conta criada com sucesso:', userCredential.user.email);
      
      // Cloud Function "sendVerificationEmail" vai enviar email automaticamente
      // quando o usuário é criado (trigger: auth.user().onCreate)
      console.log('[SIGNUP] 📧 Cloud Function enviará email de verificação automaticamente...');
      
      setVerificationSent(true);
      // Redireciona para email verification após 3 segundos
      setTimeout(() => {
        navigate('/email-verification');
      }, 3000);
    } catch (err) {
      console.error('[SIGNUP] ❌ ERRO ao criar conta:', {
        code: err.code,
        message: err.message
      });
      let errorMessage = "Erro desconhecido.";
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "Este e-mail já está em uso. Tente outro.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "E-mail inválido. Verifique o e-mail e tente novamente.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <span className="card-title">Criar Conta</span>
        
        {verificationSent && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <p><strong>✓ Conta criada com sucesso!</strong></p>
            <p>Um email de confirmação foi enviado para <strong>{email}</strong></p>
            <p>Verifique sua caixa de entrada e clique no link de confirmação.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Redirecionando para login em 3 segundos...</p>
          </div>
        )}
        
        {!verificationSent && (
          <form onSubmit={handleSignup}>
            <InputField
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon="email"
              required
              disabled={loading}
            />
            <InputField
              label="Senha (mínimo 6 caracteres)"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon="lock"
              required
              disabled={loading}
            />
            
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
        )}
        
        <div className="auth-footer">
          <p>
            Já tem uma conta? <Link to="/login">Faça o login</Link>
          </p>
          <p style={{ marginTop: '1rem' }}>
            <Link to="/privacy">Política de Privacidade</Link>
          </p>
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </Card>
    </div>
  );
}
