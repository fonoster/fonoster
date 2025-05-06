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
import { Box, Paper, styled } from "@mui/material";

export const WorkspaceTrigger = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  paddingLeft: "40px",
  cursor: "pointer",
  width: "100%",
  borderBottom: "1px solid transparent",
  borderBottomColor: theme.palette.base["06"],
  fontSize: "10px",
  fontFamily: "Poppins",
  fontWeight: 500,
  color: theme.palette.base["03"],
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}));

export const WorkspaceOption = styled(Box)(({ theme }) => ({
  padding: "10px 16px",
  paddingLeft: "40px",
  borderBottom: `0.5px solid ${theme.palette.base["06"]}`,
  color: theme.palette.base["03"],
  fontSize: "11px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background-color 0.2s ease-in-out",
  position: "relative",

  "&:last-child": {
    borderBottom: "none"
  },

  "&:hover": {
    backgroundColor: theme.palette.base["06"]
  },

  "&[data-selected='true']:before": {
    content: '""',
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: theme.palette.brand["04"]
  }
}));

export const WorkspaceUnifiedDropdown = styled(Paper)(({ theme }) => ({
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  zIndex: 1300,
  borderRadius: "0px",
  borderBottom: `1px solid ${theme.palette.base["06"]}`,
  boxShadow: "0px 5px 10px 0px rgba(0, 0, 0, 0.10)",
  backgroundColor: theme.palette.background.paper,
  overflow: "hidden",
  width: "100%"
}));
