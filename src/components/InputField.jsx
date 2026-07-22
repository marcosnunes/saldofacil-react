export default function InputField({ 
  label, 
  id, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  icon = null,
  disabled = false,
  min,
  max,
  step,
  showPasswordToggle = false,
  passwordVisible = false,
  onTogglePasswordVisibility
}) {
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPasswordToggle ? (passwordVisible ? 'text' : 'password') : type;

  return (
    <div className={`input-field ${icon ? 'with-prefix' : ''}`}>
      {icon && <i className="material-icons prefix">{icon}</i>}
      <input
        type={inputType}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
      />
      {isPasswordField && showPasswordToggle && (
        <button
          type="button"
          className="input-password-toggle"
          onClick={onTogglePasswordVisibility}
          disabled={disabled}
          aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          title={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <i className="material-icons">{passwordVisible ? 'visibility_off' : 'visibility'}</i>
        </button>
      )}
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
