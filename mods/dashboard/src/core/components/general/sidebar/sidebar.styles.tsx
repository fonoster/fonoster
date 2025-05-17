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
import { Box, styled } from "@mui/material";
import { Typography } from "../../design-system/ui/typography/typography";

export const SidebarContainer = styled(Box)(({ theme }) => ({
  height: "100%",

  "& .MuiDrawer-paper": {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.base["03"],
    borderRight: `solid 1px ${theme.palette.base["06"]}`,
    width: "250px",
    height: "100%",
    boxSizing: "border-box"
  }
}));

export const SidebarWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  height: "100%",
  backgroundColor: theme.palette.background.paper,
  gap: "16px",
  flexGrow: 1
}));

export const SidebarContent = styled("nav")(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "8px"
}));

export const SidebarNavigation = styled("ul")(() => ({
  display: "flex",
  flexDirection: "column",
  listStyle: "none",
  padding: 0,
  margin: 0
}));

export const SidebarFooter = styled(Box)(({ theme }) => ({
  marginTop: "auto",
  padding: "10px 40px",
  fontSize: "0.75rem",
  color: theme.palette.base["04"]
}));

export const SidebarNavItemRoot = styled("li")(() => ({
  display: "flex",
  flexDirection: "column",
  listStyle: "none",
  cursor: "pointer",
  margin: 0,
  padding: 0
}));

export const SidebarNavItemContent = styled(Box)(({ theme }) => ({
  color: theme.palette.base["03"],
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  position: "relative",
  padding: "8px 16px",
  paddingLeft: "40px",

  "&[data-selected='true']": {
    color: theme.palette.base["01"]
  }
}));

export const SidebarNavItemText = styled(Typography)(({ theme }) => ({
  position: "relative",

  "&[data-selected='true']:before": {
    content: '""',
    position: "absolute",
    right: "-12px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: theme.palette.brand["04"]
  }
}));

export const SidebarNavItemSubMenu = styled("ul")(() => ({
  display: "flex",
  flexDirection: "column",
  listStyle: "none",
  padding: 0,
  margin: 0
}));
