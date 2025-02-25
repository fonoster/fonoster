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
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

export const StyledCard = styled(Card)<{
  disabled: boolean;
  workspaceVariant?: string;
}>(({ theme, disabled, workspaceVariant }) => ({
  height: "325px",
  backgroundColor: workspaceVariant === "regular" 
    ? theme.palette.background.default
    : theme.palette.background.paper,
  cursor: disabled ? "not-allowed" : "pointer",
  borderRadius: "10px",
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3.75, 3.75, 2, 3.75),
  boxShadow: 'none',
  transition: theme.transitions.create(['border-color', 'transform', 'box-shadow'], {
    duration: theme.transitions.duration.shorter
  }),
  
  ...(!disabled && {
    '&:hover': {
      border: `1px solid ${theme.palette.primary.main}`,
      transform: 'translateY(-2px)',
      boxShadow: theme.palette.mode === 'light'
        ? '0px 4px 20px rgba(0, 0, 0, 0.1)'
        : '0px 4px 20px rgba(0, 0, 0, 0.3)',
    }
  })
}));

export const StyledCardContentContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100%"
}));

export const StyledNewWorkSpaceDescription = styled(Typography)<{
  disabled: boolean;
}>(({ theme, disabled }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.h6.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  lineHeight: 1.5,
  letterSpacing: "0.5px",
  textAlign: "center",
  color: disabled 
    ? theme.palette.text.disabled 
    : theme.palette.text.secondary,
  transition: theme.transitions.create('color', {
    duration: theme.transitions.duration.shorter
  }),
  '.MuiCard-root:hover &': {
    color: disabled 
      ? theme.palette.text.disabled 
      : theme.palette.primary.main,
  }
}));

export const StyledAddIconContainer = styled("div")<{
  disabled: boolean;
}>(({ theme, disabled }) => ({
  color: disabled 
    ? theme.palette.text.disabled 
    : theme.palette.text.secondary,
  transition: theme.transitions.create('color', {
    duration: theme.transitions.duration.shorter
  }),
  '.MuiCard-root:hover &': {
    color: disabled 
      ? theme.palette.text.disabled 
      : theme.palette.primary.main,
  },
  "& svg": {
    width: 40,
    height: 40
  }
}));

export const StyledDescription = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.h6.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  lineHeight: 1.5,
  letterSpacing: "0.5px",
  textAlign: "left",
  color: theme.palette.text.primary
}));

export const StyledBottomContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: theme.spacing(3)
}));

export const StyledDateContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1)
}));

export const StyledDate = styled(Typography)(({ theme }) => ({
  fontFamily: "Roboto Mono",
  color: theme.palette.text.secondary,
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  lineHeight: 1.5,
  letterSpacing: "0.5px",
  textAlign: "left"
}));

export const StyledIcon = styled("div")(({ theme }) => ({
  color: theme.palette.text.primary,
  display: "flex",
  alignItems: "center",
  "& svg": {
    width: 16,
    height: 16
  }
}));
