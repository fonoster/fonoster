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

import { Icon } from "../icon/Icon";
import { Typography } from "../typography/Typography";
import { StyledBox } from "./LinkBackTo.styles";

export interface LinkBackToProps {
  /**
   * The text to display in the link
   */
  label: string;
  /**
   * Callback fired when the link is clicked
   */
  onClick?: () => void;
  /**
   * If true, the link will be disabled
   */
  disabled?: boolean;
}

export const LinkBackTo = ({
  onClick,
  label,
  disabled = false
}: LinkBackToProps) => {
  return (
    <StyledBox
      onClick={disabled ? undefined : onClick}
      className={disabled ? "disabled" : ""}
      role="button"
      aria-disabled={disabled}
    >
      <Icon name="ChevronLeft" />
      <Typography variant="body-small">{label}</Typography>
    </StyledBox>
  );
};
