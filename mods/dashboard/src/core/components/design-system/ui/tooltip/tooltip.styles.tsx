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
import { Tooltip as MuiTooltip, tooltipClasses, styled } from "@mui/material";

export const TooltipRoot = styled(MuiTooltip)(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.base["03"],
    color: theme.palette.base["08"],
    fontSize: 10,
    padding: "10px",
    borderRadius: 4,
    boxShadow: "none",
    maxWidth: 300,
    fontStyle: "normal",
    fontWeight: 500,
    lineHeight: "normal"
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.base["03"]
  }
}));
