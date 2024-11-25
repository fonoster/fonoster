/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { CSSProperties } from "react";

const commonStyles: CSSProperties = {
  display: "inline-flex",
  padding: "2px 8px",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px",
  fontFamily: "Roboto Mono",
  fontSize: "10px",
  fontStyle: "normal",
  fontWeight: 700,
  lineHeight: "21px",
  letterSpacing: "1.32px",
  textTransform: "uppercase",
  textAlign: "center",
  fontFeatureSettings: "'liga' off, 'clig' off"
};

export const DrawerPageRegionLabel = styled(Box)(({ theme }) => ({
  ...commonStyles, // Spread the styles here
  padding: "0px 4px",
  backgroundColor: theme.palette.grey[300],
  color: theme.palette.grey[900],
  borderRadius: "40px"
}));

export const LandingPageRegionLabel = styled(Box)(({ theme }) => ({
  ...commonStyles,
  padding: "2px 8px",
  backgroundColor: theme.palette.primary[500],
  color: theme.palette.primary[900],
  borderRadius: "20px"
}));
