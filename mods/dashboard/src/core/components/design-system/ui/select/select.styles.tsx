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
import { styled } from "@mui/material/styles";
import { Select } from "@mui/material";

export const StyledSelect = styled(Select)(({ theme }) => ({
  "&.MuiInputBase-root, &.MuiOutlinedInput-root, &.MuiSelect-root": {
    backgroundColor: "transparent"
  },
  "& .MuiInputBase-root": {
    minHeight: "42px",
    height: "auto",
    backgroundColor: "transparent"
  },
  "& .MuiOutlinedInput-input": {
    backgroundColor: "transparent",
    padding: "16.5px 14px"
  },
  "& .MuiSelect-select": {
    backgroundColor: "transparent",
    minHeight: "auto",
    fontSize: "12px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    lineHeight: "normal",
    letterSpacing: "0.12px",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "4px",
    padding: "8px 14px",
    "& .MuiChip-root": {
      margin: "2px",
      pointerEvents: "auto",
      "& .MuiChip-deleteIcon": {
        pointerEvents: "auto",
        cursor: "pointer",
        "&:hover": {
          color: theme.palette.error.main
        }
      }
    }
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.grey[300],
    borderWidth: "1px",
    borderRadius: "4px"
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.brand.main
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.brand.main,
    borderWidth: "2px"
  },
  "& .MuiInputLabel-root": {
    transform: "translate(14px, 16px) scale(1)",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    color: theme.palette.brand.main,
    "&.MuiInputLabel-shrink": {
      transform: "translate(14px, -9px) scale(0.75)"
    }
  },
  "&.Mui-focused .MuiInputLabel-root": {
    color: theme.palette.brand.main
  },
  "& + .MuiMenu-paper": {
    marginTop: "4px",
    "& .MuiMenuItem-root": {
      fontSize: "12px",
      fontFamily: "'Poppins', sans-serif",
      padding: "6px 14px",
      minHeight: "32px"
    }
  },
  "& .MuiFormHelperText-root": {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "10px",
    fontWeight: 500,
    lineHeight: "normal",
    letterSpacing: "0.12px",
    marginTop: "4px",
    marginLeft: "3px",
    color: theme.palette.brand.main
  },
  "& .MuiInputAdornment-root": {
    color: theme.palette.brand.main,
    marginRight: "8px",
    "& .MuiSvgIcon-root": {
      fontSize: "20px"
    }
  }
}));
