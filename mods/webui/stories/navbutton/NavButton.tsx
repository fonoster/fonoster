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
import { useTheme } from "@mui/material";
import {
  StyledAvatar,
  StyledBadge,
  StyledIconButton,
  StyledNotificationsIcon
} from "./NavButton.styles";
import { NavButtonProps } from "./types";

export const NavButton = (props: NavButtonProps) => {
  const { variant, isOpen, label, onClick } = props;
  const actualLabel = label ?? 0;
  const actualVariant = variant ?? "notifications";
  const theme = useTheme();

  return (
    <StyledIconButton isOpen={isOpen} onClick={onClick}>
      {actualVariant === "notifications" && (
        <StyledBadge
          label={label as number}
          badgeContent={
            (actualLabel as unknown as number) > 9 ? "9+" : actualLabel
          }
          color="warning"
          overlap="circular"
        >
          <StyledNotificationsIcon
            sx={{
              color: isOpen
                ? theme.palette.primary[200]
                : theme.palette.primary[800]
            }}
          />
        </StyledBadge>
      )}

      {actualVariant === "profile" && (
        <StyledAvatar isOpen={isOpen}>{label}</StyledAvatar>
      )}
    </StyledIconButton>
  );
};
