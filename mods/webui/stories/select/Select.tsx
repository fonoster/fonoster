import React from "react";
import { SelectProps } from "./types";
import { StyledSelect } from "./Select.styles";
import { MenuItem, InputAdornment } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import { Select as MuiSelect } from "@mui/material";

export const Select: React.FC<SelectProps> = ({
  onClick,
  disabled,
  label,
  leadingIcon,
  trailingIcon,
  defaultValue,
  supportingText,
  value,
  onChange,
  error,
  options = [],
  inputRef,
  name,
  fullWidth = false,
  ...rest
}) => {
  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      size="small"
      style={{
        minWidth: '120px',
        '& .MuiFormControl-root': {
          margin: 0
        }
      }}
    >
      <InputLabel>{label}</InputLabel>
      <StyledSelect
        {...rest}
        name={name}
        inputRef={inputRef}
        variant="outlined"
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        label={label}
        disabled={disabled}
        startAdornment={
          leadingIcon && (
            <InputAdornment position="start">{leadingIcon}</InputAdornment>
          )
        }
        endAdornment={
          trailingIcon && (
            <InputAdornment position="end">{trailingIcon}</InputAdornment>
          )
        }
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              fontSize: '12px',
              minHeight: '32px'
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </StyledSelect>
      {supportingText && (
        <FormHelperText>{supportingText}</FormHelperText>
      )}
    </FormControl>
  );
}; 