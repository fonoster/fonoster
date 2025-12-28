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
import {
  WorkspaceCardRoot,
  StyledCardContentContainer,
  StyledNewWorkSpaceDescription,
  StyledAddIconContainer
} from "./workspace-card.styles";
import AddIcon from "@mui/icons-material/Add";
import { Box } from "@mui/material";

export interface WorkspaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  workspaceRef?: React.RefObject<HTMLDivElement>;
}

export const AddWorkspaceCard: React.FC<WorkspaceCardProps> = ({
  onClick,
  workspaceRef,
  disabled = false
}) => {
  return (
    <WorkspaceCardRoot
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      ref={workspaceRef}
    >
      <StyledCardContentContainer>
        <Box
          sx={{
            height: "100%",
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1
          }}
        >
          <StyledAddIconContainer
            disabled={disabled}
            className="workspace-icon"
          >
            <AddIcon />
          </StyledAddIconContainer>
          <StyledNewWorkSpaceDescription
            disabled={disabled}
            className="workspace-text"
          >
            New Workspace
          </StyledNewWorkSpaceDescription>
        </Box>
      </StyledCardContentContainer>
    </WorkspaceCardRoot>
  );
};
