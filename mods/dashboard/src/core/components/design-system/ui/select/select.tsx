/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { type ReactNode } from "react";
import { StyledSelect } from "./select.styles";
import { MenuItem, InputAdornment, Box } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
// import { Chip } from "@stories/chip/Chip";
import { type SelectChangeEvent } from "@mui/material/Select";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps {
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  defaultValue?: string | number | Array<string | number>;
  supportingText?: string;
  value?: string | number | Array<string | number>;
  onChange?: (event: {
    target: { value: string | number | Array<string | number> };
  }) => void;
  error?: boolean;
  options?: SelectOption[];
  inputRef?: any;
  name?: string;
  fullWidth?: boolean;
  multiple?: boolean;
  size?: "small" | "medium";
}

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
        "& .MuiInputLabel-root": {
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          lineHeight: "normal",
          transform: "translate(16px, -11px) scale(0.66)"
        },
        "& .MuiOutlinedInput-root": {
          minHeight: size === "small" ? "32px" : "42px",
          height: "auto",
          borderRadius: "4px",
          "& .MuiSelect-select": {
            padding: size === "small" ? "4px 14px" : "6px 16px",
            fontSize: size === "small" ? "11px" : "12px",
            fontFamily: "'Poppins'",
            fontWeight: 400,
            lineHeight: "normal",
            letterSpacing: "0.12px"
          },
          "& fieldset": {
            borderColor: (theme) => theme.palette.base["06"]
          },
          "&:hover fieldset": {
            borderColor: (theme) => theme.palette.brand.main
          },
          "&.Mui-focused fieldset": {
            borderColor: (theme) => theme.palette.brand.main,
            borderWidth: "2px"
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
          if (selected === "" || selected === undefined) {
            return <span style={{ opacity: 0 }}></span>;
          }

          if (multiple && Array.isArray(selected)) {
            return (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => {
                  const option = options.find((opt) => opt.value === value);
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

          const selectedOption = options.find(
            (option) => option.value === selected
          );
          return selectedOption ? selectedOption.label : "";
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
              fontSize: size === "small" ? "11px" : "12px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              lineHeight: "normal"
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </StyledSelect>
      {supportingText && <FormHelperText>{supportingText}</FormHelperText>}
    </FormControl>
  );
};
