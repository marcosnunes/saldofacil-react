import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

// Define a ordem de navegação para as páginas principais
export default function SwipeableLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { monthId } = useParams();

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Lógica especial para as páginas de mês
      if (location.pathname.startsWith('/month/')) {
        const currentMonth = parseInt(monthId, 10);
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        navigate(`/month/${nextMonth}`);
      } else {
        // Para qualquer outra página, o swipe leva para o início
        navigate('/');
      }
    },
    onSwipedRight: () => {
      // Lógica especial para as páginas de mês
      if (location.pathname.startsWith('/month/')) {
        const currentMonth = parseInt(monthId, 10);
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        navigate(`/month/${prevMonth}`);
      } else {
        // Para qualquer outra página, o swipe leva para o início
        navigate('/');
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
    // Melhorias na detecção de swipe
    delta: 60, // Distância mínima em pixels para registrar swipe (padrão: 10)
    swipeDuration: 250, // Duração máxima do swipe em ms (padrão: infinito)
    trackTouch: true,
    // Aumenta sensibilidade apenas para swipes laterais
    onSwiping: ({ absX, absY }) => {
      // Ignora swipes verticais muito fortes (quando movimento vertical > horizontal)
      if (absY > absX * 1.2) {
        return false;
      }
    },
  });

  return (
    <div {...handlers} style={{ height: '100%', width: '100%' }}>
      {children}
    </div>
  );
}
