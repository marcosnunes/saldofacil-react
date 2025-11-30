import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Card, InputField } from '../components';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/login');
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
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <span className="card-title">Criar Conta</span>
        <form onSubmit={handleSignup}>
          <InputField
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="email"
            required
          />
          <InputField
            label="Senha (mínimo 6 caracteres)"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon="lock"
            required
          />
          
          <button type="submit" className="btn">Cadastrar</button>
        </form>
        
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
