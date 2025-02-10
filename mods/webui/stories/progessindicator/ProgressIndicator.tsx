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
import { useEffect, useState } from "react";
import { Typography } from "../typography/Typography";
import {
  StyledIndicatorLabel,
  StyledIndicatorLabelList,
  StyledProgressBar,
  StyledProgressContainer,
  StyledProgressIndicator
} from "./ProgressIndicator.styles";
import { ProgressIndicatorProps } from "./types";

export const ProgressIndicator = (props: ProgressIndicatorProps) => {
  const { steps, current = 0 } = props;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progress = (current / steps.length) * 100;
    setProgress(Math.round(progress));
  }, [steps, current]);

  return (
    <StyledProgressContainer>
      <StyledProgressBar>
        <StyledProgressIndicator progress={`${progress}%`} />
      </StyledProgressBar>
      <StyledIndicatorLabelList>
        {steps.map((step, i) => (
          <StyledIndicatorLabel key={i} completed={current > i}>
            <Typography variant="body-small">{step}</Typography>
          </StyledIndicatorLabel>
        ))}
      </StyledIndicatorLabelList>
    </StyledProgressContainer>
  );
};
