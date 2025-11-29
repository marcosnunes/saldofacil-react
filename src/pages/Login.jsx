
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { InputField } from '../components';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
    <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} align="center" sx={{ mb: 3 }}>
          Login
        </Typography>
        <form onSubmit={handleLogin}>
          <InputField
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="person_outline"
            required
          />
          <InputField
            label="Senha"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon="lock_outline"
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, mb: 1 }}>
            Entrar
          </Button>
        </form>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button variant="text" onClick={handleForgotPassword} sx={{ mb: 1 }}>
            Esqueci minha senha
          </Button>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Não tem uma conta? <Link to="/signup">Cadastre-se</Link>
          </Typography>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
    </Box>
  );
}
