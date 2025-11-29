
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { InputField } from '../components';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';

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
    <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} align="center" sx={{ mb: 3 }}>
          Criar Conta
        </Typography>
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
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, mb: 1 }}>
            Cadastrar
          </Button>
        </form>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2">
            Já tem uma conta? <Link to="/login">Faça o login</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link to="/privacy">Política de Privacidade</Link>
          </Typography>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
    </Box>
  );
}
