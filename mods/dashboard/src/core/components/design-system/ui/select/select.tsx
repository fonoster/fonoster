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
import React, { useCallback } from "react";
import { SelectRoot } from "./select.styles";
import { MenuItem, InputAdornment, useTheme, Chip, Box } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import { type SelectChangeEvent } from "@mui/material/Select";
import type { SelectProps } from "./select.interfaces";
import { Icon } from "../../icons/icons";
import { useFormField } from "../../forms";

/**
 * Interface defining the shape of options for the Select component.
 */
export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Select component.
 *
 * Renders a dropdown with support for:
 * - Single or multiple selection
 * - Leading/trailing icons
 * - Custom styling via the design system
 *
 * @param {SelectProps} props - The props for the Select component.
 * @returns {JSX.Element} The rendered Select component.
 */
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
  options = [],
  inputRef,
  name,
  size = "medium",
  multiple = false,
  ...rest
}) => {
  const { error } = useFormField();
  const theme = useTheme();

  const hasLeadingIcon = !!leadingIcon;
  const hasTrailingIcon = !!trailingIcon;

  const message = error ? error.message : supportingText;

  /**
   * Handles changes to the select value.
   *
   * @param event - The SelectChangeEvent from MUI Select.
   */
  const handleChange = useCallback(
    (event: SelectChangeEvent<any>) => {
      const newValue = event.target.value;
      if (onChange) {
        onChange({ target: { value: newValue } });
      }
    },
    [onChange]
  );

  /**
   * Handles rendering the selected value in the input field.
   *
   * @param selected - The selected value(s).
   * @returns {ReactNode} The rendered value(s).
   */
  const renderValue = useCallback(
    (selected: any, placeholder: string) => {
      if (!multiple || !Array.isArray(selected)) {
        const selectedOption = options.find((o) => o.value === selected);
        return selectedOption ? (
          selectedOption.label
        ) : (
          <span style={{ color: theme.palette.base["04"] }}>{placeholder}</span>
        );
      }

      if (selected.length === 0 && placeholder) {
        return (
          <span style={{ color: theme.palette.base["04"] }}>{placeholder}</span>
        );
      }

      return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {selected.map((val) => {
            const option = options.find((o) => o.value === val);
            return (
              <Chip
                key={val}
                label={option?.label ?? val}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "10px",
                  borderRadius: "8px",
                  maxHeight: "24px",
                  backgroundColor: theme.palette.brand["03"],
                  color: theme.palette.base["02"],
                  fontWeight: 500,
                  padding: "4px 8px",
                  margin: "0px !important",
                  "& .MuiChip-deleteIcon": {
                    color: theme.palette.brand["07"],
                    "&:hover": {
                      color: theme.palette.base["02"]
                    }
                  },

                  "& .MuiChip-label": {
                    padding: "0",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "10px",
                    fontWeight: 500,
                    lineHeight: "normal",
                    letterSpacing: "0.12px"
                  }
                }}
                onDelete={(event) => handleDeleteSelected(event, val)}
                deleteIcon={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "16px",
                      height: "16px",
                      color: `${theme.palette.base["02"]} !important`,
                      cursor: "pointer",
                      fontSize: "16px !important",
                      margin: "0 !important"
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                    }}
                  >
                    <Icon name="Close" fontSize="inherit" />
                  </Box>
                }
              />
            );
          })}
        </Box>
      );
    },
    [multiple, options, theme.palette.brand, value, onChange]
  );

  /**
   * Handles deleting a selected item in multiple mode.
   *
   * @param event - The mouse event.
   * @param val - The value to remove.
   */
  const handleDeleteSelected = useCallback(
    (event: React.MouseEvent, val: string | number) => {
      event.stopPropagation();
      event.preventDefault();

      const newValue = (value as any[]).filter((item) => item !== val);
      if (onChange) {
        onChange({ target: { value: newValue } });
      }
    },
    [value, onChange]
  );

  return (
    <FormControl
      fullWidth
      error={Boolean(error)}
      size={size}
      sx={{
        "& .MuiFormLabel-root.MuiInputLabel-root.Mui-focused": {
          color: theme.palette.base["02"],
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          lineHeight: "normal",
          transform: "translate(16px, -10px) scale(0.66)"
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
            borderColor: Boolean(error)
              ? theme.palette.error.main
              : theme.palette.base["05"]
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
          color: Boolean(error)
            ? theme.palette.error.main
            : theme.palette.base["03"]
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
        {...rest}
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
        renderValue={(selected) =>
          renderValue(selected, rest.placeholder || "")
        }
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
      {message && (
        <FormHelperText error={Boolean(error)}>{message}</FormHelperText>
      )}
    </FormControl>
  );
};
