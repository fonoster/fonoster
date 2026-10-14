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
import React, { useMemo } from "react";
import {
  WorkspaceCardRoot,
  StyledDescription,
  StyledDateContainer,
  StyledBottomContainer,
  StyledDate,
  StyledIcon,
  StyledOwnerContainer,
  StyledOwnerIcon,
  StyledOwnerText
} from "./workspace-card.styles";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { RegionBadge } from "../region-badge/region-badge";
import { Box } from "@mui/material";

export interface WorkspaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  region?: string;
  description?: string;
  date?: string;
  owner?: {
    ref: string;
    name: string;
    email: string;
  };
  disabled?: boolean;
  workspaceRef?: React.RefObject<HTMLDivElement>;
  onSettingsClick?: () => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  onClick,
  region,
  description,
  date,
  owner,
  disabled = false,
  workspaceRef,
  onSettingsClick
}) => {
  return (
    <WorkspaceCardRoot
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      workspaceVariant="regular"
      ref={workspaceRef}
    >
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "end"
        }}
      >
        <Box sx={{ width: "100%" }}>
          {region && <RegionBadge type="landing-page">{region}</RegionBadge>}
          {description && <StyledDescription>{description}</StyledDescription>}
          {owner && (
            <StyledOwnerContainer>
              <StyledOwnerIcon>
                <PersonOutlinedIcon />
              </StyledOwnerIcon>
              <StyledOwnerText>Owner: {owner.name}</StyledOwnerText>
            </StyledOwnerContainer>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <StyledBottomContainer>
            <StyledDateContainer>
              <StyledIcon>
                <CalendarTodayOutlinedIcon />
              </StyledIcon>
              {date && <StyledDate>{date}</StyledDate>}
            </StyledDateContainer>
            <StyledIcon
              onClick={onSettingsClick}
              clickable={!disabled && !!onSettingsClick}
            >
              <SettingsOutlinedIcon />
            </StyledIcon>
          </StyledBottomContainer>
        </Box>
      </Box>
    </WorkspaceCardRoot>
  );
};
