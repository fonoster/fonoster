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
import { styled, Theme } from "@mui/material/styles";

export const StyledModalTerms = (theme: Theme) => ({
  backgroundColor: theme.palette.common.white,
  boxShadow: "0px 4px 32px 0px rgba(0, 0, 0, 0.15)",
  padding: "24px",
  outline: "none",
  border: "none",
  maxWidth: "100%",
  margin: "auto",
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)"
});

export const StyledTitleContainer = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
}));

export const StyledTitle = {
  fontFamily: (theme: Theme) => theme.typography.fontFamily,
  marginBottom: (theme: Theme) => theme.spacing(3)
};

export const StyledCloseButtonContainer = styled("div")(() => ({
  width: "auto",
  height: "auto",
  cursor: "pointer"
}));
