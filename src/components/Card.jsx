export default function Card({ children, className = '', id = '' }) {
  return (
    <div className={`card ${className}`} id={id}>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}
