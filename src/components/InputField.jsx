
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Icon from '@mui/material/Icon';

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
    <TextField
      label={label}
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      InputProps={
        icon
          ? {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon>{icon}</Icon>
                </InputAdornment>
              ),
              inputProps: { min, max, step }
            }
          : { inputProps: { min, max, step } }
      }
      fullWidth
      variant="outlined"
      margin="normal"
    />
  );
}
