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
import { useState } from "react";
import { Typography } from "../typography/Typography";
import {
  StyledTooltipArrow,
  StyledTooltipContainer,
  StyledTooltipContent,
  StyledTooltipContentList
} from "./Tooltip.styles";
import { TooltipProps } from "./types";

export const Tooltip = (props: TooltipProps) => {
  const { content, placement = "top", children } = props;
  const [show, setShow] = useState(false);

  const showTip = () => setShow(true);
  const hideTip = () => setShow(false);

  return (
    <StyledTooltipContainer onMouseEnter={showTip} onMouseLeave={hideTip}>
      {children}
      {show && (
        <StyledTooltipContentList placement={placement}>
          {typeof content === "string" ? (
            <StyledTooltipContent>
              <Typography variant="body-micro">{content}</Typography>{" "}
            </StyledTooltipContent>
          ) : (
            content.map((value, i) => (
              <StyledTooltipContent key={i}>
                <Typography variant="body-micro">{value}</Typography>{" "}
              </StyledTooltipContent>
            ))
          )}
          <StyledTooltipArrow placement={placement} />
        </StyledTooltipContentList>
      )}
    </StyledTooltipContainer>
  );
};
