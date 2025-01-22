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

import React from "react";
import { WorkspaceProps } from "./types";
import {
  StyledCard,
  StyledCardContentContainer,
  StyledNewWorkSpaceDescription,
  StyledDescription,
  StyledDateContainer,
  StyledBottomConatiner,
  StyledDate,
  StyledIcon,
  StyledAddIconContainer
} from "./Workspace.styles";
import AddIcon from "@mui/icons-material/Add";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { RegionLabel } from "../../regionlabel/RegionLabel";
import { CardContent } from "@mui/material";

export const WorkspaceCard: React.FC<WorkspaceProps> = ({
  onClick,
  region,
  description,
  date,
  variant,
  disabled = false,
  workspaceRef,
  onSettingsClick
}) => {
  if (variant === "empty") {
    return (
      <StyledCard
        onClick={!disabled ? onClick : undefined}
        disabled={disabled}
        ref={workspaceRef}
      >
        <StyledCardContentContainer>
          <CardContent
            sx={{
              height: "100%",
              alignContent: "center",
              justifyItems: "center"
            }}
          >
            <StyledAddIconContainer disabled={disabled}>
              <AddIcon />
            </StyledAddIconContainer>
            <StyledNewWorkSpaceDescription disabled={disabled}>
              New Workspace
            </StyledNewWorkSpaceDescription>
          </CardContent>
        </StyledCardContentContainer>
      </StyledCard>
    );
  }

  return (
    <StyledCard
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      workspaceVariant={variant}
    >
      <StyledCardContentContainer>
        <CardContent sx={{ flexGrow: 1, alignContent: "end" }}>
          {region && <RegionLabel children={region} type="landing-page" />}
          {description && <StyledDescription>{description}</StyledDescription>}
          <StyledBottomConatiner>
            <StyledDateContainer>
              <StyledIcon>
                <CalendarTodayOutlinedIcon />
              </StyledIcon>
              {date && <StyledDate>{date}</StyledDate>}
            </StyledDateContainer>
            <StyledIcon onClick={onSettingsClick}>
              <SettingsOutlinedIcon />
            </StyledIcon>
          </StyledBottomConatiner>
        </CardContent>
      </StyledCardContentContainer>
    </StyledCard>
  );
};
