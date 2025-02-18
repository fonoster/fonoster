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
  inputRef?: React.Ref<HTMLInputElement>;
}

const defaultOptionConfig = {
  labelKey: "label",
  valueKey: "value",
  formatOption: (item: SelectOption) => ({
    value: item.value,
    label: item.label
  })
};

const SelectContext = ({
  name,
  label,
  options = [],
  disabled = false,
  defaultValue = '',
  optionConfig = defaultOptionConfig
}: SelectContextProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <FormControl
      fullWidth
      error={!!errors[name]}
      disabled={disabled}
      margin="normal"
    >
      <InputLabel>{label}</InputLabel>
      <Select
        {...register(name)}
        label={label}
        defaultValue={defaultValue}
      >
        {options.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {errors[name] && (
        <FormHelperText>
          {errors[name]?.message as string}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export { SelectContext }; 