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
import { IndicatorLabelProps, ProgressProps } from "./types";

export const StyledProgressContainer = styled("div")(() => ({
  width: "100%",
  maxWidth: "670px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "16px"
}));

export const StyledProgressBar = styled("div")(({ theme }) => ({
  display: "flex",
  height: "4px",
  backgroundColor: theme.palette.primary[200]
}));

export const StyledProgressIndicator = styled("div")<ProgressProps>(
  ({ theme, progress }) => ({
    height: "100%",
    width: progress,
    backgroundColor: theme.palette.primary[500]
  })
);

export const StyledIndicatorLabelList = styled("ol")(() => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  listStyle: "none",
  padding: "0px",
  margin: "0px",
  gap: "10px"
}));

export const StyledIndicatorLabel = styled("li")<IndicatorLabelProps>(
  ({ theme, completed }) => ({
    color: completed
      ? theme.palette.secondary[900]
      : theme.palette.secondary[500]
  })
);
