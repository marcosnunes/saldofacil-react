import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { Card, InputField } from '../components';

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
    <div className="auth-container">
      <Card className="auth-card">
        <span className="card-title">Excluir Conta</span>
        <p className="center-align" style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
          Esta ação é irreversível e apagará todos os seus dados. Para confirmar, por favor, digite seu e-mail e clique no botão de exclusão.
        </p>
        
        <InputField
          label="Confirme seu Email"
          id="deleteEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon="email"
          required
        />
        
        <button onClick={handleDeleteAccount} className="btn red">
          Excluir Minha Conta Permanentemente
        </button>
        
        <button 
          onClick={() => navigate('/')} 
          className="btn" 
          style={{ 
            background: 'transparent', 
            color: 'var(--color-text-muted)', 
            boxShadow: 'none', 
            marginTop: '0.5rem' 
          }}
        >
          Cancelar e Voltar
        </button>
        
        {error && <p className="error-message">{error}</p>}
      </Card>
    </div>
  );
}
