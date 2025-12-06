import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Card } from '../components';

const faqItems = [
  {
    question: 'O que é o app Saldo Fácil?',
    answer: 'O Saldo Fácil é uma ferramenta projetada para ajudar no controle financeiro anual. Ele permite que você registre seus Créditos (receitas) e Débitos (despesas) diariamente em telas separadas para cada mês, proporcionando uma visão clara de sua saúde financeira.',
    icon: 'help_outline'
  },
  {
    question: 'Como eu começo a usar o app?',
    answer: 'Para começar, é fundamental inserir seu saldo atual no campo "Saldo Inicial" na página de Janeiro. Mesmo que você comece a usar o app no meio do ano, este passo é crucial, pois os saldos iniciais dos meses seguintes são calculados automaticamente com base no fechamento do mês anterior.',
    icon: 'play_circle_outline'
  },
  {
    question: 'Como funcionam os lançamentos de Cartão de Crédito?',
    answer: 'Na tela "Cartão de Crédito", você pode registrar compras parceladas. Informe a descrição, o número total de parcelas e o valor total da compra. Selecione o mês em que a compra foi feita, e a primeira parcela será lançada nesse mês. O app calculará e distribuirá as parcelas subsequentes nos meses seguintes do ano corrente.',
    icon: 'credit_card'
  },
  {
    question: 'Como funciona a importação de extratos?',
    answer: 'Você pode importar extratos bancários no formato OFX. Baixe o extrato do seu banco (atualmente compatível com Nubank, Caixa e Banco do Brasil), navegue até o mês correspondente no app e clique em "Importar Extrato". O app adicionará as transações automaticamente.',
    icon: 'import_export'
  },
  {
    question: 'Como contabilizo meus investimentos?',
    answer: 'Utilize a página "Investimentos" para registrar aplicações (envio de dinheiro da conta corrente para o investimento) e resgates. Esses valores são contabilizados no seu saldo mensal. Você também pode simular rendimentos inserindo uma taxa de juros anual para ter uma projeção de crescimento do seu capital.',
    icon: 'trending_up'
  },
  {
    question: 'Posso exportar relatórios para PDF ou Excel?',
    answer: 'Sim! Agora você pode exportar seus relatórios financeiros para os formatos PDF e Excel. A funcionalidade foi otimizada para funcionar perfeitamente tanto em computadores (desktop) quanto em dispositivos móveis, incluindo o aplicativo Android. Seus arquivos serão gerados e salvos diretamente no seu dispositivo.',
    icon: 'picture_as_pdf'
  }
];

export default function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Navigation
        title="Perguntas Frequentes"
        onBack={() => navigate(-1)}
        onNext={() => navigate(-1)}
      />

      <div className="main-content">
        <div className="container">
          {faqItems.map((item, index) => (
            <div key={index} className="collapsible-item">
              <div 
                className="collapsible-header"
                onClick={() => toggleItem(index)}
              >
                <i className="material-icons">{item.icon}</i>
                <span>{item.question}</span>
              </div>
              {openIndex === index && (
                <div className="collapsible-body">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
