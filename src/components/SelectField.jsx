
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Icon from '@mui/material/Icon';

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
    <FormControl fullWidth margin="normal" variant="outlined">
      {icon && <Icon sx={{ mr: 1 }}>{icon}</Icon>}
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        onChange={onChange}
        label={label}
        displayEmpty
      >
        {placeholder && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
