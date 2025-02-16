import { useFormContext } from "react-hook-form";
import { Select, MenuItem } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";


interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectContextProps {
  name: string;
  label: string;
  options: SelectOption[];
  disabled?: boolean;
  defaultValue?: string | number;
  optionConfig?: {
    labelKey: string;
    valueKey: string;
    formatOption: (item:SelectOption) => SelectOption;
  };
  formatOption?: (item:SelectOption) => SelectOption;
}



const defaultOptionConfig = {
  labelKey: "label",
  valueKey: "value",
  formatOption: (item: SelectOption) => ({
    value: item.id,
    label: item.name || item.label
  })
};

const SelectContext = ({
  name,
  label,
  options = [],
  disabled = false,
  defaultValue = '',
  optionConfig = defaultOptionConfig,
  formatOption
}: SelectContextProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const formatOptionFn = formatOption || optionConfig.formatOption;

  const formattedOptions = options.map((option) => 
    typeof option === 'object' ? formatOptionFn(option) : option
  );

  const getOptionLabel = (option) => {
    return typeof option === 'object' ? option[optionConfig.labelKey] : option;
  };

  const getOptionValue = (option) => {
    return typeof option === 'object' ? option[optionConfig.valueKey] : option;
  };

  return (
    <FormControl
      fullWidth
      error={!!errors[name]}
      disabled={disabled}
      margin="normal"
    >
      <InputLabel>{label}</InputLabel>
      <Select
        {...register(name, { required: `${label} is required` })}
        label={label}
        defaultValue={defaultValue}
      >
        {formattedOptions.map((option) => (
          <MenuItem 
            key={getOptionValue(option)} 
            value={getOptionValue(option)}
          >
            {getOptionLabel(option)}
          </MenuItem>
        ))}
      </Select>
      {errors[name] && (
        <FormHelperText>{errors[name].message}</FormHelperText>
      )}
    </FormControl>
  );
};

export { SelectContext }; 