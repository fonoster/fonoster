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
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Box, Container, styled } from "@mui/material";

export const WorkspaceContainer = styled(Container)(() => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "1fr",
  justifyContent: "center",
  alignItems: "flex-start",
  width: "100%",
  height: "100%",
  padding: "48px 24px 80px",
  margin: "0 auto",
  overflow: "auto",
  maxWidth: "100% !important"
}));

export const ContentWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  maxWidth: "1080px",
  width: "100%",
  margin: "0 auto"
}));

export const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.base["02"],
  textAlign: "left"
}));

export const Subtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.base["05"],
  textAlign: "left",
  marginTop: theme.spacing(1),
  marginBottom: "32px",
  maxWidth: 640
}));

export const StudioBento = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
  gap: "20px",
  width: "100%",
  alignItems: "stretch",
  minHeight: 420,

  "@media (max-width: 899px)": {
    gridTemplateColumns: "1fr"
  }
}));

export const SideStack = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  minHeight: 420
}));
