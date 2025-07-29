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
import { styled, TextareaAutosize, FormControl } from "@mui/material";

export const TextareaRoot = styled("div")<{ size: "small" | "medium" }>(
  ({ theme, size }) => ({
    display: "flex",
    alignItems: "flex-start",
    backgroundColor: "transparent",
    border: `1px solid ${theme.palette.base["05"]}`,
    borderRadius: theme.shape.borderRadius,
    padding: size === "small" ? "4px 14px" : "6px 16px",
    "&:hover": {
      borderColor: theme.palette.brand.main
    },
    "&:focus-within": {
      borderColor: theme.palette.brand.main
    }
  })
);

export const TextareaInput = styled(TextareaAutosize)(({ theme }) => ({
  width: "100%",
  resize: "none",
  border: "none",
  outline: "none",
  backgroundColor: "transparent",
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 400,
  fontSize: "12px",
  lineHeight: "normal",
  letterSpacing: "0.12px",
  padding: 0,
  paddingTop: "8px",
  "&::placeholder": {
    color: theme.palette.base["03"]
  }
}));

export const TextareaFormControl = styled(FormControl)(({ theme }) => ({
  "& .MuiFormLabel-root.MuiInputLabel-root.MuiInputLabel-shrink": {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    lineHeight: "normal",
    transform: "translate(16px, -10px) scale(0.66)",
    color: theme.palette.base["02"],
    backgroundColor: theme.palette.base["07"],
    padding: "0 8px"
  },
  "& .MuiFormLabel-root.MuiInputLabel-root.Mui-focused": {
    color: theme.palette.base["02"],
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    lineHeight: "normal",
    transform: "translate(16px, -10px) scale(0.66)",
    size: "10px",
    backgroundColor: theme.palette.base["07"],
    padding: "0 8px"
  },
  "& .MuiFormHelperText-root": {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "10px",
    fontWeight: 500,
    lineHeight: "normal",
    letterSpacing: "0.12px",
    marginTop: "8px",
    color: theme.palette.base["03"]
  }
}));
