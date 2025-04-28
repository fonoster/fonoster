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
import { type CSSProperties } from "react";

const commonStyles: CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px",
  fontFamily: "Roboto Mono",
  fontSize: "10px",
  fontStyle: "normal",
  fontWeight: 700,
  lineHeight: "21px",
  textTransform: "uppercase",
  textAlign: "center",
  fontFeatureSettings: "'liga' off, 'clig' off"
};

export const DrawerRegionBadge = styled(Box)(({ theme }) => ({
  ...commonStyles,
  padding: "0px 4px",
  backgroundColor: theme.palette.grey[300],
  color: theme.palette.grey[700],
  borderRadius: "20px"
}));

export const LandingPageRegionBadge = styled(Box)(({ theme }) => ({
  ...commonStyles,
  padding: "2px 8px",
  backgroundColor: theme.palette.brand.main,
  color: theme.palette.brand["06"],
  borderRadius: "40px"
}));
