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

export const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-input": {
    padding: "6px 16px",
    height: "28px",
    fontSize: "12px",
    fontFamily: theme.typography.fontFamily,
    fontWeight: 400,
    lineHeight: "normal",
    letterSpacing: "0.12px"
  },
  "& .MuiFormLabel-root.MuiInputLabel-root.Mui-focused": {
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    lineHeight: "normal",
    transform: "translate(16px, -11px) scale(0.66)",
    color: theme.palette.text.primary
  },
  "& .MuiFormLabel-root.MuiInputLabel-root.MuiInputLabel-shrink": {
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    lineHeight: "normal",
    transform: "translate(16px, -11px) scale(0.66)",
    color: theme.palette.text.primary
  },
  "& .MuiInputBase-inputAdornedStart": {
    paddingLeft: "0"
  },
  "& .MuiInputBase-root.MuiOutlinedInput-root": {
    "& .MuiInputAdornment-root": {
      marginRight: 4,
      "&.MuiInputAdornment-positionEnd": {
        marginRight: -8
      }
    }
  },
  "& .MuiInputAdornment-root": {
    color: theme.palette.text.primary
  },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: `1px solid ${theme.palette.primary.main}`
  },
  "& .MuiFormHelperText-root": {
    fontFamily: theme.typography.fontFamily,
    fontSize: "10px",
    fontWeight: 500,
    lineHeight: "normal",
    letterSpacing: "0.12px",
    marginTop: "8px",
    color: theme.palette.text.primary
  }
}));
