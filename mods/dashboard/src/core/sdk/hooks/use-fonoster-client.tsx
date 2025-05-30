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
import { useState, useCallback, useMemo, useLayoutEffect } from "react";
import type { Session } from "~/auth/services/sessions/session.interfaces";
import type { FonosterModules } from "../stores/fonoster.interfaces";
import { getClient, SDK } from "../client/fonoster.client";

/**
 * Custom hook that initializes and manages the Fonoster client, SDK modules,
 * authentication state, and session tokens.
 *
 * This hook provides a reusable and centralized way to access the Fonoster client
 * and its modules, and helps ensure that session changes are tracked and
 * modules are correctly updated when the client instance changes.
 *
 * @param initialSession - The initial session object containing access and refresh tokens.
 * @returns An object containing the client, SDK modules, session data,
 *          authentication state, and utility functions to manage the session and client.
 */
export const useClient = (initialSession: Session | null) => {
  /**
   * State that holds the current session, including authentication tokens.
   */
  const [session, setSession] = useState<Session | null>(initialSession);

  /**
   * State that holds the current Fonoster client instance.
   */
  const [client, setClient] = useState<SDK.WebClient | null>(null);

  /**
   * State that holds the initialized SDK modules (e.g., Applications).
   */
  const [sdk, setSdk] = useState<FonosterModules | null>(null);

  /**
   * Updates the session tokens and merges them with the existing session.
   *
   * If the new session is identical to the previous one, no state update occurs.
   *
   * @param tokens - A session object containing new access or refresh tokens.
   */
  const updateSessionTokens = useCallback(
    (tokens: Session) => {
      if (!client) return;

      setSession((prev) => {
        const next = { ...prev, ...tokens };
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    },
    [client]
  );

  /**
   * Replaces the current client instance and reinitializes all SDK modules
   * using the new client. This is useful when a new authenticated client
   * is issued, for example after login or token refresh.
   *
   * @param newClient - A new Fonoster client instance to replace the current one.
   */
  const updateClient = useCallback((newClient: SDK.WebClient) => {
    setClient(newClient);

    // Recreate SDK modules with the new client
    setSdk({
      applications: new SDK.Applications(newClient)
      // Additional modules can be added here
    });
  }, []);

  /**
   * Derived boolean flag indicating whether the user is authenticated,
   * based on the presence of a refresh token in the session object.
   */
  const isAuthenticated = useMemo(
    () => Boolean(session && "refreshToken" in session),
    [session]
  );

  /**
   * Logs the user out by calling the client's logout method
   * and clearing the session from state.
   */
  const logout = useCallback(() => {
    client?.logout();
    setSession(null);
  }, [client]);

  /**
   * Initializes the Fonoster client and SDK modules on component mount.
   * This ensures that the application always has a working client and
   * SDK interfaces as soon as possible.
   */
  useLayoutEffect(() => {
    const instance = getClient(); // Function that returns a configured Fonoster client
    updateClient(instance); // Replace the current client and initialize modules
  }, [updateClient]);

  /**
   * Return all state and utility functions needed to interact with
   * the Fonoster client and SDK in consuming components or contexts.
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
