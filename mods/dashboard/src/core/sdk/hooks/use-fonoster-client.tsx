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
import { useState, useCallback, useMemo, useEffect } from "react";
import type { Session } from "~/auth/services/sessions/session.interfaces";
import type { FonosterModules } from "../stores/fonoster.interfaces";
import { getClient, SDK } from "../client/fonoster.client";
import { Logger } from "~/core/shared/logger";

/**
 * Custom React hook to initialize and manage the Fonoster client, session state,
 * SDK modules, and related authentication logic.
 *
 * This hook ensures that the client is initialized properly on mount, and
 * allows updates to the session or client in a centralized and controlled way.
 *
 * @returns An object with the client instance, session data, SDK modules, and helper functions.
 */
export const useClient = () => {
  /**
   * State holding the current user session.
   * Includes authentication tokens and user-related metadata.
   */
  const [session, setSession] = useState<Session | null>(null);

  /**
   * State holding the current Fonoster WebClient instance.
   * This client is used to authenticate and interact with the Fonoster API.
   */
  const [client, setClient] = useState<SDK.WebClient | null>(null);

  /**
   * State holding the initialized SDK modules that wrap the Fonoster API.
   * Each module is scoped to the current client and allows domain-specific operations.
   */
  const [sdk, setSdk] = useState<FonosterModules | null>(null);

  /**
   * Updates the session with new tokens while preserving other session properties.
   * Avoids unnecessary updates if the session hasn't changed.
   *
   * @param tokens - The new session tokens (e.g. after token refresh).
   */
  const updateSessionTokens = useCallback((tokens: Session) => {
    Logger.debug("[useClient] Updating session tokens...");

    setSession((prev) => {
      const next = { ...prev, ...tokens };
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
  }, []);

  /**
   * Replaces the current client instance and reinitializes all SDK modules.
   * This is useful when re-authenticating or refreshing the client with new credentials.
   *
   * @param newClient - A new instance of the Fonoster WebClient.
   */
  const updateClient = useCallback((newClient: SDK.WebClient) => {
    Logger.debug("[useClient] Updating Fonoster client instance...");

    setClient(newClient);

    // Recreate all SDK modules with the new client
    setSdk({
      applications: new SDK.Applications(newClient),
      agents: new SDK.Agents(newClient),
      acls: new SDK.Acls(newClient),
      apiKeys: new SDK.ApiKeys(newClient),
      calls: new SDK.Calls(newClient),
      credentials: new SDK.Credentials(newClient),
      domains: new SDK.Domains(newClient),
      numbers: new SDK.Numbers(newClient),
      secrets: new SDK.Secrets(newClient),
      trunks: new SDK.Trunks(newClient),
      users: new SDK.Users(newClient),
      workspaces: new SDK.Workspaces(newClient)
    });
  }, []);

  /**
   * Determines if the current session is authenticated.
   * Returns true if the session contains a `refreshToken`, which is required for maintaining authentication.
   */
  const isAuthenticated = useMemo(
    () => Boolean(session && "refreshToken" in session),
    [session]
  );

  /**
   * Logs the user out by:
   * - Calling the client's `logout()` method (if available).
   * - Clearing the current session state.
   */
  const logout = useCallback(() => {
    Logger.debug("[useClient] Logging out user...");

    client?.logout();
    setSession(null);
  }, [client]);

  /**
   * Initializes the Fonoster client when the component mounts.
   * Ensures that `client` and `sdk` states are populated early in the app lifecycle.
   */
  useEffect(() => {
    Logger.debug("[useClient] Initializing Fonoster client on mount...");
    const instance = getClient(); // Factory function to get a configured WebClient instance
    updateClient(instance);
  }, [updateClient]);

  /**
   * Exposes the current client, SDK modules, session state, and utility functions
   * for use in application components or providers.
   */
  return {
    client,
    sdk,
    session,
    setSession,
    isAuthenticated,
    updateSessionTokens,
    updateClient,
    logout
  };
};
