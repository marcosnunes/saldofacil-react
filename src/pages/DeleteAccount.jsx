
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { InputField } from '../components';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

export default function DeleteAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    if (!email) {
      setError('Por favor, insira seu email.');
      return;
    }
    if (!user) {
      setError('Você precisa estar logado para excluir sua conta.');
      return;
    }
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      setError('O email informado não é válido. Verifique e tente novamente.');
      return;
    }
    try {
      await deleteUser(user);
      alert('Conta deletada com sucesso. Você será redirecionado para a página de login.');
      navigate('/login');
    } catch (err) {
      console.error('Erro ao deletar conta:', err);
      setError('Erro ao deletar conta. Tente novamente.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Excluir Conta</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Esta ação é irreversível e apagará todos os seus dados. Para confirmar, por favor, digite seu e-mail e clique no botão de exclusão.
        </Typography>
        <Box sx={{ mb: 2 }}>
          <InputField
            label="Confirme seu Email"
            id="deleteEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="email"
            required
          />
        </Box>
        <Button
          variant="contained"
          color="error"
          fullWidth
          sx={{ mb: 1 }}
          onClick={handleDeleteAccount}
        >
          Excluir Minha Conta Permanentemente
        </Button>
        <Button
          variant="text"
          color="primary"
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => navigate('/')}
        >
          Cancelar e Voltar
        </Button>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        )}
      </Paper>
    </Box>
  );
}
