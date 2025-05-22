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
import { SelectRoot } from "./select.styles";
import { MenuItem, InputAdornment, useTheme } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
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
  const theme = useTheme();

  const hasLeadingIcon = !!leadingIcon;
  const hasTrailingIcon = !!trailingIcon;

  const { ...validRestProps } = rest;

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    if (onChange) {
      onChange({ target: { value: event.target.value as any } });
    }
  };

  return (
    <FormControl
      fullWidth
      error={error}
      size={size}
      sx={{
        "& .MuiFormLabel-root.MuiInputLabel-root.Mui-focused": {
          color: theme.palette.base["02"],
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          lineHeight: "normal",
          transform: "translate(16px, -10px) scale(0.66)",
          size: "10px"
        },
        "& .MuiFormLabel-root.MuiInputLabel-root.MuiInputLabel-shrink": {
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          lineHeight: "normal",
          transform: "translate(16px, -10px) scale(0.66)",
          color: theme.palette.base["02"]
        },
        "& .MuiInputBase-inputAdornedStart": {
          paddingLeft: "0"
        },
        "& .MuiInputBase-root.MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          "& .MuiInputAdornment-root": {
            marginRight: 4,
            "&.MuiInputAdornment-positionEnd": {
              marginRight: -8
            }
          }
        },
        "& .MuiInputAdornment-root": {
          color: theme.palette.base["02"]
        },
        "& .MuiOutlinedInput-root": {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.base["05"]
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.brand.main
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.brand.main
          }
        },
        "& .MuiFormHelperText-root": {
          fontFamily: "'Poppins', sans-serif",
          fontSize: "10px",
          fontWeight: 500,
          lineHeight: "normal",
          letterSpacing: "0.12px",
          marginTop: "8px",
          color: theme.palette.base["03"]
        },
        "& .MuiFormLabel-root.MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
          fontFamily: "'Poppins', sans-serif",
          fontSize: "12px",
          fontWeight: 500,
          lineHeight: "normal",
          letterSpacing: "0.12px",
          marginTop: "-2px",
          color: theme.palette.base["02"]
        }
      }}
    >
      <InputLabel shrink>{label}</InputLabel>
      <SelectRoot
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
              lineHeight: "normal",
              transition: "all 0.2s ease",

              "&:hover": {
                backgroundColor: theme.palette.brand["03"],
                color: theme.palette.brand["07"]
              },

              "&.Mui-selected": {
                backgroundColor: theme.palette.brand.main,
                color: theme.palette.brand["07"]
              },

              "&.Mui-selected:hover": {
                backgroundColor: theme.palette.brand.main,
                color: theme.palette.brand["07"]
              }
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </SelectRoot>
      {supportingText && <FormHelperText>{supportingText}</FormHelperText>}
    </FormControl>
  );
};
