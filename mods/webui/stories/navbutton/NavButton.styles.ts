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
import NotificationsIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { Avatar, Badge, IconButton, styled } from "@mui/material";

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "isOpen"
})<{
  isOpen: boolean;
}>(({ theme, isOpen }) => ({
  backgroundColor: isOpen
    ? theme.palette.primary[800]
    : theme.palette.primary[200],
  width: "33px",
  height: "33px",
  color: isOpen ? theme.palette.common.white : theme.palette.primary[800],
  "&:hover": {
    backgroundColor: isOpen
      ? theme.palette.primary[900]
      : theme.palette.primary[200]
  },
  position: "relative"
}));

const StyledBadge = styled(Badge)<{
  label: number;
}>(({ theme, label }) => ({
  "& .MuiBadge-badge": {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    flexShrink: 0,
    width: "10px",
    height: "10px",
    fontSize: label > 9 ? "6px" : "8px",
    fontWeight: 600,
    fontFamily: "Poppins",
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontStyle: "normal",
    lineHeight: "16px",
    borderRadius: "50%",
    textAlign: "center",
    minWidth: "10px",
    padding: "0px",
    paddingTop: label > 9 ? "2px" : "1px",
    top: "-5px",
    right: "-5px",
    color: theme.palette.common.white,
  }
}));

const StyledNotificationsIcon = styled(NotificationsIcon)(() => ({
  fontSize: 16
}));

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== "isOpen"
})<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  width: "33px",
  height: "33px",
  fontSize: "13px",
  fontWeight: 700,
  fontFamily: "Poppins",
  fontFeatureSettings: "'liga' off, 'clig' off",
  fontStyle: "normal",
  textAlign: "center",
  color: isOpen ? theme.palette.common.white : theme.palette.primary[800],
  backgroundColor: isOpen
    ? theme.palette.primary[800]
    : theme.palette.primary[200]
}));

export { StyledAvatar, StyledBadge, StyledIconButton, StyledNotificationsIcon };
