export default function InputField({ 
  label, 
  id, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  icon = null,
  min,
  max,
  step
}) {
  return (
    <div className={`input-field ${icon ? 'with-prefix' : ''}`}>
      {icon && <i className="material-icons prefix">{icon}</i>}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
