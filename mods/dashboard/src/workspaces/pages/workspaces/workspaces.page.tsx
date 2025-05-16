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
import type { Route } from "./+types/workspaces.page";
import { WorkspaceCard } from "~/core/components/design-system/ui/workspace-card/workspace-card";
import { AddWorkspaceCard } from "~/core/components/design-system/ui/workspace-card/workspace-card-empty";
import { CreateWorkspaceModal } from "~/workspaces/components/containers/create-workspace/create-workspace.modal";
import { useCallback, useState } from "react";
import {
  ContentWrapper,
  Subtitle,
  Title,
  WorkspaceContainer,
  WorkspaceGrid
} from "./workspaces.styles";
import { useNavigate } from "react-router";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Workspaces | Fonoster" }];
}

export default function Workspaces() {
  const navigate = useNavigate();

  const user = { name: "Efrain Peralta" };
  const workspaces = [
    {
      ref: "workspace1",
      name: "Workspace 1",
      createdAt: new Date("2023-01-01")
    },
    {
      ref: "ref_dKsl2-3",
      name: "Demo Workspace With Wrapping Title. ",
      createdAt: new Date("2023-02-01")
    }
  ];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const onWorkspaceClick = useCallback(
    (workspaceRef: string) => {
      navigate(`/workspaces/${workspaceRef}`, { viewTransition: true });
    },
    [navigate]
  );

  const onSettingsClick = useCallback(
    (workspaceRef: string) => {
      navigate(`/workspaces/${workspaceRef}/settings`, {
        viewTransition: true
      });
    },
    [navigate]
  );

  return (
    <>
      <WorkspaceContainer>
        <ContentWrapper>
          <Title variant="heading-large">
            {`Hey ${user?.name}, welcome to Fonoster! 👋`}
          </Title>

          <Subtitle variant="body-large">
            Create a new workspace to begin managing your SIP Network and
            Programmable Voice Applications.
          </Subtitle>

          <WorkspaceGrid>
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.ref}
                region={"NYC01"}
                description={workspace.name}
                onClick={() => onWorkspaceClick(workspace.ref)}
                onSettingsClick={() => onSettingsClick(workspace.ref)}
                date={
                  workspace.createdAt
                    ? workspace.createdAt.toLocaleDateString()
                    : "N/A"
                }
              />
            ))}
            <AddWorkspaceCard onClick={() => setIsCreateModalOpen(true)} />
          </WorkspaceGrid>
        </ContentWrapper>
      </WorkspaceContainer>

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
