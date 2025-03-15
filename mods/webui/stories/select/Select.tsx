import React from "react";
import { SelectProps } from "./types";
import { StyledSelect } from "./Select.styles";
import { MenuItem, InputAdornment } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";

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
  size = "medium",
  ...rest
}) => {
  const hasLeadingIcon = !!leadingIcon;
  const hasTrailingIcon = !!trailingIcon;

  const { InputLabelProps, slotProps, ...validRestProps } = rest;

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      size={size}
      sx={{
        '& .MuiInputLabel-root': {
          fontFamily: "'Poppins'",
          fontSize: size === "small" ? '11px' : '12px',
          fontWeight: 500,
          lineHeight: 'normal',
          letterSpacing: '0.12px'
        },
        '& .MuiOutlinedInput-root': {
          height: size === "small" ? '32px' : '42px',
          borderRadius: '4px',
          '& .MuiSelect-select': {
            padding: size === "small" ? '4px 14px' : '6px 16px',
            fontSize: size === "small" ? '11px' : '12px',
            fontFamily: "'Poppins'",
            fontWeight: 400,
            lineHeight: 'normal',
            letterSpacing: '0.12px'
          },
          '& fieldset': {
            borderColor: theme => theme.palette.inputBorder
          },
          '&:hover fieldset': {
            borderColor: theme => theme.palette.primary.main
          },
          '&.Mui-focused fieldset': {
            borderColor: theme => theme.palette.primary.main,
            borderWidth: '2px'
          }
        }
      }}
    >
      <InputLabel shrink>{label}</InputLabel>
      <StyledSelect
        {...validRestProps}
        name={name}
        inputRef={inputRef}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        label={label}
        disabled={disabled}
        variant="outlined"
        displayEmpty
        size={size}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 224,
              mt: 0.5
            }
          }
        }}
        renderValue={(selected) => {
          if (selected === '' || selected === undefined) {
            return <span style={{ opacity: 0 }}></span>;
          }
          const selectedOption = options.find(option => option.value === selected);
          return selectedOption ? selectedOption.label : '';
        }}
        startAdornment={
          hasLeadingIcon && (
            <InputAdornment position="start">{leadingIcon}</InputAdornment>
          )
        }
        endAdornment={
          hasTrailingIcon && (
            <InputAdornment position="end">{trailingIcon}</InputAdornment>
          )
        }
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              fontSize: size === "small" ? '11px' : '12px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              lineHeight: 'normal'
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