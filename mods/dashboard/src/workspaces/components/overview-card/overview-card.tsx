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

import type { ReactNode } from "react";
import {
  OverviewCardRootIcon,
  OverviewCardRootLabel,
  OverviewCardRoot
} from "./overview.styles";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Icon } from "~/core/components/design-system/icons/icons";

export interface OverviewCardProps {
  icon: ReactNode;
  label: string;
  onClick: VoidFunction;
}

export const OverviewCard = (props: OverviewCardProps) => {
  const { label, icon, onClick } = props;

  return (
    <OverviewCardRoot onClick={onClick}>
      <OverviewCardRootIcon>{icon}</OverviewCardRootIcon>

      <OverviewCardRootLabel>
        <Typography
          variant="body-medium"
          sx={{
            color: "base.03",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 1
          }}
        >
          {label}
        </Typography>
      </OverviewCardRootLabel>

      <Icon name="ChevronRight" sx={{ color: "base.02", fontSize: "20px" }} />
    </OverviewCardRoot>
  );
};
