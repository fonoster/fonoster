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
import { CreateWorkspaceModal } from "~/workspaces/components/containers/create-workspace/create-workspace.modal";
import {
  CompactWorkspace,
  CreateWorkspaceRow,
  FeaturedWorkspace
} from "~/workspaces/components/studio-picker/studio-picker";
import { useCallback, useState } from "react";
import {
  ContentWrapper,
  SideStack,
  StudioBento,
  Subtitle,
  Title,
  WorkspaceContainer
} from "./workspaces.styles";
import { useNavigate } from "react-router";
import { useAuth } from "~/auth/hooks/use-auth";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "~/core/brand/product";
import { workspaceCreatorName } from "~/workspaces/helpers/workspace-creator";

/**
 * Metadata function for this route.
 * Sets the page title for SEO and display.
 *
 * @param {Route.MetaArgs} _
 * @returns {Array} An array containing the page title.
 */
export function meta(_: Route.MetaArgs) {
  return [{ title: `Workspaces | ${PRODUCT_NAME}` }];
}

/**
 * Workspaces page component
 *
 * Renders a list of the user's workspaces as cards,
 * with options to view, configure, and create new workspaces.
 */
export default function Workspaces() {
  /** React Router hook to handle navigation. */
  const navigate = useNavigate();

  /** Get the current user and their workspaces from the auth context. */
  const { user, workspaces } = useAuth();

  /** Local state to control the visibility of the Create Workspace modal. */
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  /**
   * Handles click on a workspace card.
   * Navigates the user to the workspace overview page.
   *
   * @param {string} workspaceRef - The reference ID of the selected workspace.
   */
  const onWorkspaceClick = useCallback(
    (workspaceRef: string) => {
      navigate(`/workspaces/${workspaceRef}`, { viewTransition: true });
    },
    [navigate]
  );

  /**
   * Handles click on a workspace card's settings.
   * Navigates the user to the workspace settings page.
   *
   * @param {string} workspaceRef - The reference ID of the selected workspace.
   */
  const onSettingsClick = useCallback(
    (workspaceRef: string) => {
      navigate(`/workspaces/${workspaceRef}/settings`, {
        viewTransition: true
      });
    },
    [navigate]
  );

  /**
   * Renders the workspace cards grid, the Add Workspace button, and the modal.
   */
  const [featured, ...rest] = workspaces;
  const formatDate = (createdAt?: Date) =>
    createdAt ? createdAt.toLocaleDateString() : "N/A";

  return (
    <>
      <WorkspaceContainer>
        <ContentWrapper>
          <Title variant="heading-large">{`Hey ${user.name}`}</Title>
          <Subtitle variant="body-large">{PRODUCT_TAGLINE}</Subtitle>

          <StudioBento>
            {featured ? (
              <FeaturedWorkspace
                name={featured.name}
                date={formatDate(featured.createdAt)}
                ownerLabel={workspaceCreatorName(featured, user)}
                onOpen={() => onWorkspaceClick(featured.ref)}
                onSettings={() => onSettingsClick(featured.ref)}
              />
            ) : (
              <CreateWorkspaceRow onClick={() => setIsCreateModalOpen(true)} />
            )}

            <SideStack>
              {rest.map((workspace) => (
                <CompactWorkspace
                  key={workspace.ref}
                  name={workspace.name}
                  date={formatDate(workspace.createdAt)}
                  ownerLabel={workspaceCreatorName(workspace, user)}
                  onOpen={() => onWorkspaceClick(workspace.ref)}
                  onSettings={() => onSettingsClick(workspace.ref)}
                />
              ))}
              <CreateWorkspaceRow onClick={() => setIsCreateModalOpen(true)} />
            </SideStack>
          </StudioBento>
        </ContentWrapper>
      </WorkspaceContainer>

      {/* Modal to create a new workspace */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
