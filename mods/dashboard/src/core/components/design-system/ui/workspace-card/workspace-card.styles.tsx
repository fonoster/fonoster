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
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";

export const WorkspaceCardRoot = styled(Box, {
  shouldForwardProp(propName) {
    return propName !== "disabled" && propName !== "workspaceVariant";
  }
})<{
  disabled: boolean;
  workspaceVariant?: string;
}>(({ disabled, workspaceVariant, theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "stretch",
  alignItems: "stretch",
  minHeight: "188px",
  height: "100%",
  backgroundColor:
    workspaceVariant === "regular"
      ? theme.palette.bg.muted
      : "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
  borderRadius: "16px",
  border:
    workspaceVariant === "regular"
      ? `solid 1px ${theme.palette.base["07"]}`
      : `1px dashed ${theme.palette.base["06"]}`,
  padding: "20px 20px 16px",
  transition:
    "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
  boxShadow: "none",
  "&:hover": {
    border: `1px solid ${theme.palette.brand.main}`,
    transform: "translateY(-2px)",
    backgroundColor: theme.palette.bg.muted,
    boxShadow: "0 12px 32px rgba(76, 111, 255, 0.12)",
    "& .workspace-icon": {
      color: disabled ? "rgba(194, 194, 194, 1)" : theme.palette.brand["05"]
    },
    "& .workspace-text": {
      color: disabled ? "rgba(194, 194, 194, 1)" : theme.palette.brand["05"]
    }
  }
}));

export const StyledCardContentContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%"
}));

export const StyledNewWorkSpaceDescription = styled(Typography)<{
  disabled: boolean;
}>(({ disabled, theme }) => ({
  transition: "all 0.3s ease-in-out",
  fontFamily: "Poppins",
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: "24px",
  letterSpacing: "0.5px",
  textAlign: "center",
  textUnderlinePosition: "from-font",
  textDecorationSkipInk: "none",
  color: disabled ? "rgba(194, 194, 194, 1)" : theme.palette.base["05"]
}));

export const StyledAddIconContainer = styled("div")<{
  disabled: boolean;
}>(({ disabled, theme }) => ({
  transition: "all 0.3s ease-in-out",
  color: disabled ? "rgba(194, 194, 194, 1)" : theme.palette.base["05"],
  display: "flex",
  justifyContent: "center",
  marginBottom: "16px",
  "& svg": {
    width: "28px",
    height: "28px"
  }
}));

export const StyledDescription = styled(Typography)(({ theme }) => ({
  fontFamily: "Poppins",
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "26px",
  letterSpacing: "-0.02em",
  textAlign: "left",
  color: theme.palette.base["02"],
  marginTop: "14px"
}));

export const StyledBottomContainer = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "auto",
  paddingTop: "20px"
}));

export const StyledDateContainer = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  gap: "7.5px"
}));

export const StyledDate = styled(Typography)(({ theme }) => ({
  fontFamily: "Roboto Mono",
  color: theme.palette.base["05"],
  fontSize: "11px",
  fontWeight: 500,
  lineHeight: "16px",
  letterSpacing: "0.02em",
  textAlign: "left"
}));

export const StyledIcon = styled("div")<{ clickable?: boolean }>(
  ({ clickable = false, theme }) => ({
    color: theme.palette.base["03"],
    display: "flex",
    alignItems: "center",
    cursor: clickable ? "pointer" : "default",
    transition: "color 0.2s ease",
    "&:hover": {
      color: clickable ? theme.palette.brand.main : theme.palette.base["03"]
    },
    "& svg": {
      width: "16px",
      height: "16px"
    }
  })
);

export const StyledOwnerContainer = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  marginTop: "10px",
  backgroundColor: theme.palette.base["07"],
  padding: "6px 12px",
  borderRadius: "20px",
  border: `1px solid ${theme.palette.base["07"]}`,
  transition: "all 0.2s ease-in-out"
}));

export const StyledOwnerIcon = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: theme.palette.brand["02"],
  color: theme.palette.brand["04"],
  "& svg": {
    width: "14px",
    height: "14px"
  }
}));

export const StyledOwnerText = styled(Typography)(({ theme }) => ({
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: theme.palette.base["04"],
  fontSize: "11px",
  fontWeight: 500,
  lineHeight: "16px",
  letterSpacing: "0.01em",
  textAlign: "left",
  textUnderlinePosition: "from-font",
  textDecorationSkipInk: "none"
}));
