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
import { styled, Theme } from "@mui/material/styles";
import { TooltipPlacement } from "./types";

const arrowSize = "6px";
const translateX0Y_50 = "translateX(0) translateY(-50%)";
const translateX_50 = "translateX(-50%)";
const tooltipDistance = "calc(100% + 12px)";

export const StyledTooltipContainer = styled("div")(() => ({
  position: "relative"
}));

export const StyledTooltipContentList = styled("div")<{
  placement: TooltipPlacement;
}>(({ theme, placement }) => ({
  position: "absolute",
  left: "50%",
  backgroundColor: theme.palette.secondary[700],
  borderRadius: "4px",
  padding: "10px",
  paddingTop: "5px",
  whiteSpace: "nowrap",
  transform: "translateX(-50%)",
  zIndex: 100,
  ...getTooltipPositionStyles(placement)
}));

export const StyledTooltipContent = styled("div")(({ theme }) => ({
  color: theme.palette.primary[50]
}));

export const StyledTooltipArrow = styled("span")<{
  placement: TooltipPlacement;
}>(({ theme, placement }) => ({
  content: "''",
  position: "absolute",
  border: "solid transparent",
  height: 0,
  width: 0,
  pointerEvents: "none",
  borderWidth: "10px",
  ...getTooltipArrowStyles(placement, theme)
}));

const getTooltipPositionStyles = (placement: TooltipPlacement) => {
  switch (placement) {
    case "top":
      return {
        bottom: tooltipDistance
      };
    case "right":
      return {
        left: tooltipDistance,
        top: "50%",
        transform: translateX0Y_50
      };
    case "bottom":
      return {
        top: tooltipDistance
      };
    case "left":
      return {
        left: "auto",
        right: tooltipDistance,
        top: "50%",
        transform: translateX0Y_50
      };
    default:
      return {};
  }
};

const getTooltipArrowStyles = (
  placement: TooltipPlacement,
  theme: Theme
): React.CSSProperties => {
  const backgroundColor = theme.palette.secondary[700];

  switch (placement) {
    case "top":
      return {
        top: "100%",
        left: "50%",
        transform: translateX_50,
        borderTopColor: backgroundColor,
        borderTopWidth: arrowSize
      };
    case "right":
      return {
        right: `100%`,
        top: "50%",
        transform: translateX0Y_50,
        borderRightColor: backgroundColor,
        borderRightWidth: arrowSize
      };
    case "bottom":
      return {
        bottom: "100%",
        left: "50%",
        transform: translateX_50,
        borderBottomColor: backgroundColor,
        borderBottomWidth: arrowSize
      };
    case "left":
      return {
        left: `100%`,
        top: "50%",
        transform: translateX0Y_50,
        borderLeftColor: backgroundColor,
        borderLeftWidth: arrowSize
      };
    default:
      return {};
  }
};
