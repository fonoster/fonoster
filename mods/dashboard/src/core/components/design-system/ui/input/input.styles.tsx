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
import TextField from "@mui/material/TextField";

export const InputRoot = styled(TextField)(({ theme, size }) => ({
  "& .MuiInputBase-input": {
    padding: size === "small" ? "4px 14px" : "6px 16px",
    height: size === "small" ? "24px" : "28px",
    fontSize: size === "small" ? "11px" : "12px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    lineHeight: "normal",
    letterSpacing: "0.12px",
    backgroundColor: "transparent"
  },
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
}));
