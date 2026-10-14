/**
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
import { Typography } from "~/core/components/design-system/ui/typography/typography";

export const ContentContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(6)
}));

export const SectionContainer = styled(Box)(() => ({
  width: "100%"
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "11px !important",
  fontWeight: 500,
  fontFamily: "Roboto Mono !important",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "8px"
}));

export const CardsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2)
}));
