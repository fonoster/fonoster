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
import type { Workspace } from "@fonoster/types";
import React from "react";

/**
 * Represents an authenticated user in the application.
 */
export interface AuthenticatedUser {
  /**
   * Unique identifier for the user.
   */
  id: string;

  /**
   * Full name of the user.
   */
  name: string;

  /**
   * Email address of the user.
   */
  email: string;
}

/**
 * Props for the `AuthenticatedProvider` component.
 *
 * This component is responsible for providing user and workspace context
 * throughout the application after authentication has occurred.
 */
export interface AuthenticatedProviderProps {
  /**
   * React children to render within the provider.
   */
  children: React.ReactNode;
}

/**
 * Value exposed by the `AuthenticatedContext`, giving access to user and
 * workspace-related state and utilities.
 */
export interface AuthenticatedContextValue {
  /**
   * The currently authenticated user.
   */
  user: AuthenticatedUser | null;

  /**
   * Function to update the authenticated user in the context.
   *
   * @param user - The new user object to set.
   */
  setUser: (user: AuthenticatedUser) => void;

  /**
   * List of workspaces available to the user.
   */
  workspaces: Workspace[];

  /**
   * The currently selected workspace in the application context.
   */
  currentWorkspace: Workspace | null;

  /**
   * Function to change the currently selected workspace.
   *
   * @param workspace - The workspace to set as current.
   */
  setCurrentWorkspace: (workspace: Workspace) => void;

  /**
   * Callback function to handle changes in the current workspace.
   *
   * This is typically used to trigger side effects or updates when the
   * workspace changes, such as re-fetching data or updating UI components.
   *
   * @param workspaceId - The ID of the workspace that has changed.
   */
  onWorkspaceChange: (workspaceId: string) => void;
}
