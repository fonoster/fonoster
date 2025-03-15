import React from "react";
import { SelectProps } from "./types";
import { StyledSelect } from "./Select.styles";
import { MenuItem, InputAdornment, Box } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import { Chip } from "@stories/chip/Chip";

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
  multiple = false,
  ...rest
}) => {
  const hasLeadingIcon = !!leadingIcon;
  const hasTrailingIcon = !!trailingIcon;

  const { InputLabelProps, slotProps, ...validRestProps } = rest;

  const handleDelete = (valueToDelete: string | number) => (event: React.MouseEvent) => {
    event.stopPropagation();
    if (Array.isArray(value)) {
      const newValue = value.filter((val) => val !== valueToDelete);
      onChange?.({ target: { value: newValue } } as any);
    }
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      size="small"
      sx={{
        '& .MuiInputLabel-root': {
          fontFamily: "'Poppins', sans-serif",
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: 'normal',
          letterSpacing: '0.12px'
        },
        '& .MuiOutlinedInput-root': {
          height: '42px',
          borderRadius: '4px',
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
                      onRemove={handleDelete(value)}
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
              fontSize: '12px',
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