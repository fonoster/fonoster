/**
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
import React from "react";
import { Avatar, IconButton } from "@mui/material";

export interface UserAvatarButtonProps {
  initials: string;
  avatar?: string;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export const HeaderIconButton: React.FC<UserAvatarButtonProps> = ({
  initials,
  avatar,
  onClick
}) => (
  <IconButton
    onClick={onClick}
    sx={{
      width: 32,
      height: 32,
      p: 0,
      borderRadius: "50%",
      transition: "all 0.2s ease-in-out",

      "&:hover .MuiAvatar-root": {
        bgcolor: "brand.07",
        color: "brand.03"
      }
    }}
  >
    <Avatar
      sx={{
        width: 32,
        height: 32,
        fontSize: 13,
        fontWeight: 700,
        bgcolor: "brand.03",
        color: "brand.07",
        transition: "all 0.2s ease-in-out"
      }}
      src={avatar ? avatar : undefined}
    >
      {initials}
    </Avatar>
  </IconButton>
);
