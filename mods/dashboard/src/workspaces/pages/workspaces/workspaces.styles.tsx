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
  alignItems: "center",
  width: "100%",
  height: "100%",
  padding: "80px 24px",
  margin: "0 auto",
  overflow: "auto",
  maxWidth: "100% !important"
}));

export const ContentWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: "1000px",
  width: "100%",
  margin: "0 auto"
}));

export const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.base["03"],
  textAlign: "center"
}));

export const Subtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.base["03"],
  textAlign: "center",
  marginTop: theme.spacing(2),
  marginBottom: "64px",
  maxWidth: 500
}));

export const WorkspaceGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, 344px)",
  justifyContent: "center",
  gridAutoFlow: "row dense",
  gap: theme.spacing(3),
  width: "100%",
  margin: "0 auto",

  "@media (max-width: 767px)": {
    gridTemplateColumns: "minmax(300px, 344px)",
    justifyContent: "center"
  }
}));
