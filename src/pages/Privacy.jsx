import { useNavigate } from 'react-router-dom';
import { Navigation, Card } from '../components';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <>
      <Navigation
        title="Política de Privacidade"
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <div className="main-content">
        <div className="container">
          <Card>
            <p><b>Última atualização:</b> 12 de novembro de 2025</p>

            <h5 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Introdução</h5>
            <p>Obrigado por usar o Saldo Fácil. Esta Política de Privacidade descreve como coletamos, usamos, compartilhamos e protegemos suas informações pessoais quando você usa nosso serviço.</p>

            <h5 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Quais informações coletamos</h5>
            <p>Coletamos informações que você nos fornece diretamente ao usar o app:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><b>Informações de Autenticação:</b> Seu endereço de e-mail e senha, gerenciados de forma segura pelo serviço Firebase Authentication, para permitir o acesso à sua conta.</li>
              <li style={{ marginTop: '0.5rem' }}><b>Dados Financeiros:</b> Todos os lançamentos de créditos, débitos, dados de cartão de crédito e investimentos que você insere no aplicativo. Estes dados são armazenados no Firebase Realtime Database e associados exclusivamente ao seu ID de usuário.</li>
            </ul>

            <h5 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Como usamos suas informações</h5>
            <p>Usamos as informações coletadas para:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><b>Fornecer o Serviço:</b> Seus dados financeiros são a base do aplicativo, permitindo que você organize e visualize suas finanças. O armazenamento em nuvem permite que você acesse seus dados de múltiplos dispositivos.</li>
              <li style={{ marginTop: '0.5rem' }}><b>Autenticação do Usuário:</b> Seu e-mail é usado exclusivamente para login e recuperação de senha.</li>
              <li style={{ marginTop: '0.5rem' }}><b>Comunicação:</b> Não utilizamos seu e-mail para enviar marketing ou newsletters. Qualquer comunicação será estritamente relacionada a avisos importantes sobre sua conta ou o serviço.</li>
            </ul>

            <h5 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Compartilhamento de suas informações</h5>
            <p>Nós não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto nos seguintes casos:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><b>Firebase (Google):</b> Utilizamos os serviços do Firebase para autenticação e armazenamento de banco de dados. Seus dados são armazenados na infraestrutura do Google sob as políticas de privacidade e segurança deles.</li>
              <li style={{ marginTop: '0.5rem' }}><b>Obrigações Legais:</b> Podemos divulgar suas informações se formos obrigados por lei ou em resposta a um processo legal válido.</li>
            </ul>

            <h5 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Segurança de suas informações</h5>
            <p>Levamos a segurança dos seus dados a sério. Utilizamos os mecanismos de segurança fornecidos pelo Firebase, que incluem regras de segurança no banco de dados para garantir que apenas você, como usuário autenticado, possa ler e escrever seus próprios dados.</p>

            <h5 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Seus Direitos e Controle</h5>
            <p>Você tem controle total sobre seus dados:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><b>Acesso e Edição:</b> Você pode acessar e editar todos os seus lançamentos financeiros a qualquer momento dentro do aplicativo.</li>
              <li style={{ marginTop: '0.5rem' }}><b>Exclusão de Conta:</b> Você pode excluir sua conta a qualquer momento através da opção "Excluir Conta" na página inicial. Esta ação é irreversível e removerá permanentemente seu perfil de autenticação e todos os dados financeiros associados a ele do nosso banco de dados.</li>
            </ul>

            <h5 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Alterações nesta Política</h5>
            <p>Podemos atualizar esta Política de Privacidade ocasionalmente. Notificaremos sobre quaisquer alterações postando a nova política nesta página e atualizando a data da "Última atualização".</p>

            <h5 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Contato</h5>
            <p>Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco pelo e-mail: marcos.lindolpho@gmail.com</p>
          </Card>
        </div>
      </div>
    </>
  );
}
