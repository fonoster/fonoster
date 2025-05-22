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

import { Icon } from "../../icons/icons";
import { Typography } from "../typography/typography";
import { GoBackRoot } from "./go-back.styles";

export interface LinkBackToProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const GoBackButton = ({
  onClick,
  label,
  disabled = false
}: LinkBackToProps) => {
  return (
    <GoBackRoot
      onClick={disabled ? undefined : onClick}
      className={disabled ? "disabled" : ""}
      role="button"
      aria-disabled={disabled}
    >
      <Icon
        name="ChevronLeft"
        sx={{
          fontSize: "18px !important",
          color: "inherit"
        }}
      />
      <Typography variant="body-small">{label}</Typography>
    </GoBackRoot>
  );
};
