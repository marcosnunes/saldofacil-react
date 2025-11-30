export default function SelectField({ 
  label, 
  id, 
  value, 
  onChange, 
  options = [],
  placeholder = '',
  icon = null
}) {
  return (
    <div className={`input-field ${icon ? 'with-prefix' : ''}`}>
      {icon && <i className="material-icons prefix">{icon}</i>}
      <div className="select-wrapper">
        <select id={id} value={value} onChange={onChange}>
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
