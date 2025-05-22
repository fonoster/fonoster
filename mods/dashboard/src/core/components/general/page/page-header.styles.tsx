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
import { Box } from "@mui/material";
import { Typography } from "../../design-system/ui/typography/typography";

export const PageHeaderRoot = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5)
}));

export const PageHeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  width: "100%",
  gap: theme.spacing(4)
}));

export const PageHeaderTitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1)
}));

export const PageHeaderTitleText = styled(Typography)({
  overflow: "hidden",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 1
});

export const PageHeaderDescriptionText = styled(Typography)({
  maxWidth: 400,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2
});
