import { useNavigate } from 'react-router-dom';

export default function Navigation({ title, showBackButton = true, showNextButton = true, onBack, onNext }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="navigation">
      <div className="nav-wrapper">
        {showBackButton && (
          <button className="btn btn-nav" onClick={handleBack}>
            Voltar
          </button>
        )}
        <span className="brand-logo">{title}</span>
        {showNextButton && (
          <button className="btn btn-nav" onClick={handleNext}>
            Próximo
          </button>
        )}
      </div>
    </div>
  );
}
