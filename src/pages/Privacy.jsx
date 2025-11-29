
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <>
      <Navigation
        title="Política de Privacidade"
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <Box sx={{ py: 4, px: { xs: 1, sm: 2 }, bgcolor: 'background.default', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 800, width: '100%' }}>
          <Typography variant="body2" fontWeight={600} gutterBottom><b>Última atualização:</b> 12 de novembro de 2025</Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Introdução</Typography>
          <Typography variant="body1" gutterBottom>Obrigado por usar o Saldo Fácil. Esta Política de Privacidade descreve como coletamos, usamos, compartilhamos e protegemos suas informações pessoais quando você usa nosso serviço.</Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Quais informações coletamos</Typography>
          <Typography variant="body1" gutterBottom>Coletamos informações que você nos fornece diretamente ao usar o app:</Typography>
          <Box component="ul" sx={{ ml: 3, mt: 1 }}>
            <li><b>Informações de Autenticação:</b> Seu endereço de e-mail e senha, gerenciados de forma segura pelo serviço Firebase Authentication, para permitir o acesso à sua conta.</li>
            <li style={{ marginTop: '0.5rem' }}><b>Dados Financeiros:</b> Todos os lançamentos de créditos, débitos, dados de cartão de crédito e investimentos que você insere no aplicativo. Estes dados são armazenados no Firebase Realtime Database e associados exclusivamente ao seu ID de usuário.</li>
          </Box>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Como usamos suas informações</Typography>
          <Typography variant="body1" gutterBottom>Usamos as informações coletadas para:</Typography>
          <Box component="ul" sx={{ ml: 3, mt: 1 }}>
            <li><b>Fornecer o Serviço:</b> Seus dados financeiros são a base do aplicativo, permitindo que você organize e visualize suas finanças. O armazenamento em nuvem permite que você acesse seus dados de múltiplos dispositivos.</li>
            <li style={{ marginTop: '0.5rem' }}><b>Autenticação do Usuário:</b> Seu e-mail é usado exclusivamente para login e recuperação de senha.</li>
            <li style={{ marginTop: '0.5rem' }}><b>Comunicação:</b> Não utilizamos seu e-mail para enviar marketing ou newsletters. Qualquer comunicação será estritamente relacionada a avisos importantes sobre sua conta ou o serviço.</li>
          </Box>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Compartilhamento de suas informações</Typography>
          <Typography variant="body1" gutterBottom>Nós não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto nos seguintes casos:</Typography>
          <Box component="ul" sx={{ ml: 3, mt: 1 }}>
            <li><b>Firebase (Google):</b> Utilizamos os serviços do Firebase para autenticação e armazenamento de banco de dados. Seus dados são armazenados na infraestrutura do Google sob as políticas de privacidade e segurança deles.</li>
            <li style={{ marginTop: '0.5rem' }}><b>Obrigações Legais:</b> Podemos divulgar suas informações se formos obrigados por lei ou em resposta a um processo legal válido.</li>
          </Box>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Segurança de suas informações</Typography>
          <Typography variant="body1" gutterBottom>Levamos a segurança dos seus dados a sério. Utilizamos os mecanismos de segurança fornecidos pelo Firebase, que incluem regras de segurança no banco de dados para garantir que apenas você, como usuário autenticado, possa ler e escrever seus próprios dados.</Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Seus Direitos e Controle</Typography>
          <Typography variant="body1" gutterBottom>Você tem controle total sobre seus dados:</Typography>
          <Box component="ul" sx={{ ml: 3, mt: 1 }}>
            <li><b>Acesso e Edição:</b> Você pode acessar e editar todos os seus lançamentos financeiros a qualquer momento dentro do aplicativo.</li>
            <li style={{ marginTop: '0.5rem' }}><b>Exclusão de Conta:</b> Você pode excluir sua conta a qualquer momento através da opção "Excluir Conta" na página inicial. Esta ação é irreversível e removerá permanentemente seu perfil de autenticação e todos os dados financeiros associados a ele do nosso banco de dados.</li>
          </Box>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Alterações nesta Política</Typography>
          <Typography variant="body1" gutterBottom>Podemos atualizar esta Política de Privacidade ocasionalmente. Notificaremos sobre quaisquer alterações postando a nova política nesta página e atualizando a data da "Última atualização".</Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Contato</Typography>
          <Typography variant="body1">Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco pelo e-mail: marcos.lindolpho@gmail.com</Typography>
        </Paper>
      </Box>
    </>
  );
}
