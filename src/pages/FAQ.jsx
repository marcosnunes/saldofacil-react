import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components';
import { useState } from 'react';
import { Box, Paper, Typography, Grid, IconButton } from '@mui/material';
import Icon from '@mui/material/Icon';
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
    question: 'Posso exportar relatórios para PDF?',
    answer: 'Sim, a função de exportar para PDF está disponível e funciona melhor em computadores ou tablets. Em smartphones, a formatação pode não ser ideal. Acesse o site de um dispositivo com tela maior para usar esta funcionalidade.',
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

      <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: 2 }}>
          <Typography variant="h4" fontWeight={700} align="center" sx={{ mb: 4 }}>
            Perguntas Frequentes
          </Typography>
          <Grid container spacing={3}>
            {faqItems.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleItem(index)}>
                    <Icon sx={{ mr: 2, fontSize: 28, color: 'primary.main' }}>{item.icon}</Icon>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>{item.question}</Typography>
                    <IconButton>
                      <Icon>{openIndex === index ? 'expand_less' : 'expand_more'}</Icon>
                    </IconButton>
                  </Box>
                  {openIndex === index && (
                    <Box sx={{ mt: 2, pl: 5 }}>
                      <Typography variant="body1" color="text.secondary">{item.answer}</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
}
