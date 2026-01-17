import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Card, InputField } from '../components';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Se email NÃO foi verificado, redirecionar para página de verificação
      // NÃO enviar outro email aqui - o primeiro ainda é válido
      if (!userCredential.user.emailVerified) {
        setLoading(false);
        navigate('/email-verification');
        return;
      }
      
      setLoading(false);
      navigate('/');
    } catch (err) {
      let errorMessage = "Senha inválida";
      if (err.code === 'auth/user-not-found') {
        errorMessage = "Usuário não encontrado. Verifique o e-mail e tente novamente.";
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Senha incorreta. Verifique a senha e tente novamente.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "E-mail inválido. Verifique o e-mail e tente novamente.";
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = "Credenciais inválidas. Verifique seu e-mail e senha.";
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Por favor, insira seu email para recuperar a senha.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Um email para redefinir sua senha foi enviado!');
    } catch (err) {
      let errorMessage = "Erro ao enviar email de recuperação.";
      if (err.code === 'auth/user-not-found') {
        errorMessage = "Usuário não encontrado. Verifique o e-mail e tente novamente.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "E-mail inválido. Verifique o e-mail e tente novamente.";
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <span className="card-title">Login</span>
        <form onSubmit={handleLogin}>
          <InputField
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="person_outline"
            required
            disabled={loading}
          />
          <InputField
            label="Senha"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon="lock_outline"
            required
            disabled={loading}
          />
          
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="auth-footer">
          <a href="#" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }}>
            Esqueci minha senha
          </a>
          <p style={{ marginTop: '1rem' }}>
            Não tem uma conta? <Link to="/signup">Cadastre-se</Link>
          </p>
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </Card>
    </div>
  );
}
