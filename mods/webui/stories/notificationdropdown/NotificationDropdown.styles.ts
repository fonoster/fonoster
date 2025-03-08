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

export const NotificationDropdownContainer = styled("div")(() => ({
  width: "100%",
  maxWidth: "400px",
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
  borderRadius: "8px",
  backgroundColor: "#fff"
}));

export const NotificationDropdownContent = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  padding: "10px 0px"
}));

export const NotificationDropdownHeader = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  height: "42px",
  padding: "0px 16px",
}));

export const NotificationItem = styled("div")<{ isRead: boolean }>(({ theme, isRead }) => ({
  display: "flex",
  padding: "12px 16px",
  cursor: "pointer",
  borderBottom: "1px solid #f0f0f0",
  position: "relative",
  // backgroundColor: isRead ? "transparent" : "rgba(232, 245, 233, 0.3)",
  "&:hover": {
    backgroundColor: theme.palette.action.hover
  }
}));

export const NotificationContent = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  flex: 1
}));

export const NotificationIcon = styled("div")(() => ({
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: "12px",
  marginBottom: "20px",

}));

export const NotificationTimestamp = styled("div")(() => ({
  fontSize: "12px",
  color: "#757575",
  marginLeft: "auto",
  whiteSpace: "nowrap"
}));

export const NotificationReadIndicator = styled("div")(() => ({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  backgroundColor: "#4caf50",
  position: "absolute",
  right: "16px",
  top: "50%",
  transform: "translateY(-50%)"
}));

export const NotificationFooter = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderTop: "1px solid #f0f0f0"
}));

export const VisitSiteLink = styled("a")(() => ({
  display: "flex",
  alignItems: "center",
  color: "#1976d2",
  textDecoration: "none",
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline"
  }
}));

export const LinkIcon = styled("span")(() => ({
  marginLeft: "6px",
  display: "flex",
  alignItems: "center"
}));
