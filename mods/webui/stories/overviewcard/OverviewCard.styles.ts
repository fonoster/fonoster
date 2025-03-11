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
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

export const StyledMuiBox = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  height: "76px",
  alignItems: "center",
  justifyContent: "space-between",
  paddingTop: "24px",
  paddingRight: "16px",
  paddingBottom: "24px",
  paddingLeft: "16px",
  borderRadius: "8px",
  border: "1px",
  borderStyle: "solid",
  borderColor: theme.palette.secondary[100],
  gap: "10px",
  cursor: "pointer",
  backgroundColor: theme.palette.secondary[50],
  "&:hover": {
    borderColor: theme.palette.primary[500]
  }
}));

export const StyledIconBox = styled(Box)(({ theme }) => ({
  display: "flex",
  backgroundColor: theme.palette.primary[200],
  padding: "4px",
  borderRadius: "4px",
  color: theme.palette.primary[700]
}));

export const StyledLabelBox = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: "0px"
}));
