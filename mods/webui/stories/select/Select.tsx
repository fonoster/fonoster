import React from "react";
import { SelectProps } from "./types";
import { StyledSelect } from "./Select.styles";
import { MenuItem, InputAdornment, Box } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import { Chip } from "@stories/chip/Chip";
import { SelectChangeEvent } from "@mui/material/Select";
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
  multiple = false,
  ...rest
}) => {
  const hasLeadingIcon = !!leadingIcon;
  const hasTrailingIcon = !!trailingIcon;

  const { InputLabelProps, slotProps, ...validRestProps } = rest;

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    if (onChange) {
      onChange({ target: { value: event.target.value as any } });
    }
  };

  const handleChipRemove = (valueToDelete: string | number) => () => {
    if (Array.isArray(value) && onChange) {
      const newValue = value.filter((val) => val !== valueToDelete);
      onChange({ target: { value: newValue } });
    }
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      size={size}
      sx={{
        '& .MuiInputLabel-root': {
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          lineHeight: "normal",
          transform: "translate(16px, -11px) scale(0.66)"
        },
        '& .MuiOutlinedInput-root': {
          minHeight: size === "small" ? '32px' : '42px',
          height: 'auto',
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
        onChange={handleChange}
        label={label}
        disabled={disabled}
        variant="outlined"
        displayEmpty
        size={size}
        multiple={multiple}
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

          if (multiple && Array.isArray(selected)) {
            return (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const option = options.find(opt => opt.value === value);
                  return option ? (
                    <Chip
                      key={value}
                      label={option.label}
                      enabled={true}
                      onRemove={handleChipRemove(value)}
                      size="small"
                    />
                  ) : null;
                })}
              </Box>
            );
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