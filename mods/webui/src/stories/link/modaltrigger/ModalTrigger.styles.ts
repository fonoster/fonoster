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

export const StyledModalTrigger = styled("button")(({ theme }) => ({
  all: "unset",
  display: "flex",
  alignItems: "center",
  color: theme.palette.mode === "dark" ? theme.palette.primary[800] : "#333333",
  fontFamily: "Poppins",
  fontSize: "10px",
  fontWeight: 400,
  letterSpacing: "0.5px",
  lineHeight: "24px",
  cursor: "pointer",
  textDecoration: "underline",
  wordWrap: "break-word",
  "&:hover": {
    textDecoration: "underline"
  },
  "&:disabled": {
    color: "#8D8D8D",
    cursor: "not-allowed",
    textDecoration: "underline"
  }
}));

export const StyledIcon = styled("div")<{ disabled: boolean }>(
  ({ theme, disabled }) => ({
    "& svg": {
      width: "16px",
      height: "16px"
    },
    marginRight: "8px",
    display: "flex",
    alignItems: "center",
    color: disabled
      ? "#8D8D8D"
      : theme.palette.mode === "dark"
        ? theme.palette.primary[500]
        : "#333333",
    pointerEvents: disabled ? "none" : "auto"
  })
);
