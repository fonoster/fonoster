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

import { styled, Theme } from "@mui/material/styles"
import { TooltipPlacement } from './types'

export const StyledTooltipContainer = styled("div")(() => ({
    position: 'relative',
}))

export const StyledTooltipContentList = styled("div")(({ theme }) => ({
    position: 'absolute',
    // width: '124px',
    left: "50%",
    backgroundColor: theme.palette.secondary[700],
    borderRadius: '4px',
    padding: '5px',
    paddingLeft: '10px',
    whiteSpace: "nowrap",
    paddingRight: '10px',
    transform: "translateX(-50%)",
    zIndex: 100,
    ...getTooltipPositionStyles('top'),

}))

export const StyledTooltipContent = styled("div")(({ theme }) => ({
    color: theme.palette.primary[50],
}))

export const StyledTooltipArrow = styled("span")<{ placement: TooltipPlacement }>(({ theme, placement }) => ({
    content: "''",
    position: "absolute",
    border: "solid transparent",
    height: 0,
    width: 0,
    pointerEvents: "none",
    borderWidth: '6px',
    ...getTooltipArrowStyles(placement, theme),

}))

const getTooltipPositionStyles = (placement: TooltipPlacement) => {
    const margin = "30px";
    switch (placement) {
        case "top":
            return { top: `calc(-1 * ${margin})` };
        case "right":
            return {
                left: `calc(100% + ${margin})`,
                top: "50%",
                transform: "translateX(0) translateY(-50%)",
            };
        case "bottom":
            return { bottom: `calc(-1 * ${margin})` };
        case "left":
            return {
                left: "auto",
                right: `calc(100% + ${margin})`,
                top: "50%",
                transform: "translateX(0) translateY(-50%)",
            };
        default:
            return {};
    }
};

const getTooltipArrowStyles = (placement: TooltipPlacement, theme: Theme) => {
    const arrowSize = "6px";
    const backgroundColor = theme.palette.secondary[700];
    switch (placement) {
        case "top":
            return { top: "100%", borderTopColor: backgroundColor };
        case "right":
            return {
                left: `calc(-1 * ${arrowSize})`,
                top: "50%",
                transform: "translateX(0) translateY(-50%)",
                borderRightColor: backgroundColor,
            };
        case "bottom":
            return {
                bottom: "100%",
                borderBottomColor: backgroundColor,
            };
        case "left":
            return {
                left: "auto",
                right: `calc(-2 * ${arrowSize})`,
                top: "50%",
                transform: "translateX(0) translateY(-50%)",
                borderLeftColor: backgroundColor,
            };
        default:
            return {};
    }
};
