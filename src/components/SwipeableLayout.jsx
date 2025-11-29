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
  });

  return (
    <div {...handlers} style={{ height: '100%', width: '100%' }}>
      {children}
    </div>
  );
}
