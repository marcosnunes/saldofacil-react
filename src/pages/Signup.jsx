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
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate('/');
    } catch (err) {
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
        
        {error && <p className="error" style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        
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
        
        <div className="auth-footer">
          <p>
            Já tem uma conta? <Link to="/login">Faça o login</Link>
          </p>
          <p style={{ marginTop: '1rem' }}>
            <Link to="/privacy">Política de Privacidade</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
