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
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import type {
  AuthenticatedContextValue,
  AuthenticatedProviderProps
} from "./authenticated.interfaces";
import type { Workspace } from "@fonoster/types";
import { useParams } from "react-router";
import { useCurrentUser } from "../hooks/use-current-user";
import { Splash } from "~/core/components/general/splash/splash";
import { useWorkspaces } from "~/workspaces/services/workspaces.service";
import { Logger } from "~/core/logger";
import { useAuthenticatedClient } from "../hooks/use-authenticated-client";

/**
 * Context to provide authenticated user and workspace data
 * to the entire application.
 */
export const AuthenticatedContext =
  createContext<AuthenticatedContextValue | null>(null);

/**
 * Provider component that manages the authenticated user,
 * current workspace, and relevant state for the authenticated context.
 *
 * @param {AuthenticatedProviderProps} props - The props containing children to render.
 * @returns {JSX.Element} The provider wrapping its children.
 */
export const AuthenticatedProvider = ({
  children,
  initialSession
}: AuthenticatedProviderProps) => {
  /** Retrieve the Fonoster client instance */
  const client = useAuthenticatedClient(initialSession);

  /** Extract the workspaceId from the URL parameters */
  const { workspaceId } = useParams<{ workspaceId: string }>();

  /** Custom hook to retrieve the current authenticated user */
  const { user, setUser, isLoading: isUserLoading } = useCurrentUser();

  /** Fetch all workspaces the user has access to */
  const { data: workspaces = [], isLoading: isWorkspacesLoading } =
    useWorkspaces();

  /** State to track the currently selected workspace */
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );

  /**
   * Callback to handle workspace changes by updating the current workspace
   * and setting the corresponding access key ID in the Fonoster client.
   *
   * @param {string} workspaceId - The ID of the workspace to switch to.
   */
  const onWorkspaceChange = useCallback(
    (workspaceId: string) => {
      const workspace = workspaces.find((w) => w.ref === workspaceId);

      if (workspace) {
        setCurrentWorkspace(workspace);

        if (workspace.accessKeyId) {
          client.setAccessKeyId(workspace.accessKeyId);
        }
      } else {
        Logger.debug(
          `[<AuthenticatedProvider />] Workspace with ID ${workspaceId} not found.`
        );
      }
    },
    [workspaces, client]
  );

  /**
   * Memoized object representing the authenticated session state.
   * This prevents unnecessary re-renders of consumers when values haven't changed.
   */
  const session = useMemo<AuthenticatedContextValue>(
    () => ({
      user,
      setUser,
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      onWorkspaceChange
    }),
    [
      user,
      setUser,
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      onWorkspaceChange
    ]
  );

  /**
   * Effect to automatically update the current workspace
   * whenever the workspaceId param changes.
   */
  useEffect(() => {
    if (workspaceId) {
      onWorkspaceChange(workspaceId);
    }
  }, [workspaceId, onWorkspaceChange]);

  /**
   * Display a loading splash while user or workspace data is loading
   * or if the user is not yet authenticated.
   */
  if (isUserLoading || isWorkspacesLoading || !user) {
    return <Splash message="Who are you? Please wait..." />;
  }

  /**
   * Provide the authenticated session context to children components.
   */
  return (
    <AuthenticatedContext.Provider value={session}>
      {children}
    </AuthenticatedContext.Provider>
  );
};
