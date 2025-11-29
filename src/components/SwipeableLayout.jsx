import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

// Define a ordem de navegação para as páginas principais
const navigationMap = [
  '/',
  '/credit-card',
  '/investments',
  '/tithe',
  '/report',
  '/charts',
  '/tools',
  '/salary',
  '/ai-reports',
  '/faq',
  '/delete-account'
];

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
        // Navegação geral entre páginas
        const currentIndex = navigationMap.indexOf(location.pathname);
        if (currentIndex < navigationMap.length - 1) {
          navigate(navigationMap[currentIndex + 1]);
        }
      }
    },
    onSwipedRight: () => {
      // Lógica especial para as páginas de mês
      if (location.pathname.startsWith('/month/')) {
        const currentMonth = parseInt(monthId, 10);
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        navigate(`/month/${prevMonth}`);
      } else {
        // Navegação geral entre páginas
        const currentIndex = navigationMap.indexOf(location.pathname);
        if (currentIndex > 0) {
          navigate(navigationMap[currentIndex - 1]);
        }
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
