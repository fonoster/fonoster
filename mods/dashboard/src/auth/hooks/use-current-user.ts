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
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { jwtDecode } from "jwt-decode";
import type { IDTokenPayload } from "../services/sessions/auth.interfaces";
import { useEffect, useState, useMemo } from "react";
import type { AuthenticatedUser } from "../stores/authenticated.interfaces";
import { useUser } from "../services/auth.service";
import { Logger } from "~/core/logger";

/**
 * Custom hook to fetch and manage the current authenticated user data.
 * It retrieves the ID token from Fonoster, decodes it to extract the user ID,
 * then fetches the user data from the backend service.
 *
 * @returns {Object} An object containing:
 *   - user: The authenticated user data (id, name, email).
 *   - setUser: Function to manually set the user state.
 *   - isLoading: Boolean indicating whether the user data is being loaded.
 */
export const useCurrentUser = () => {
  /**
   * State for storing the decoded user ID from the ID token.
   * @type {[string, Function]}
   */
  const [userId, setUserId] = useState<string>("");

  /**
   * State for storing the authenticated user object.
   * @type {[AuthenticatedUser | null, Function]}
   */
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  /**
   * Get the Fonoster client to retrieve the ID token.
   */
  const { client, session } = useFonoster();

  /**
   * Fetch user data using the userId from the decoded token.
   * The hook returns 'data' (the fetched user) and 'isLoading' (loading status).
   */
  const { data, isLoading } = useUser(userId);

  /**
   * Extract the user ID from the ID token once on mount or when the client changes.
   * It decodes the token to get the 'sub' claim, representing the user ID.
   */
  useEffect(() => {
    const token = session?.idToken || client.getIdToken();

    if (!token) {
      Logger.debug(
        "[useCurrentUser()]: Oops! No ID token found. User ID cannot be set."
      );
      return;
    }

    try {
      const { sub } = jwtDecode<IDTokenPayload>(token);
      setUserId(sub);
      Logger.debug("[useCurrentUser()]: User ID extracted from ID token:", sub);
    } catch (error) {
      Logger.error(
        "[useCurrentUser()]: Oops! Failed to decode ID token.",
        error
      );
    }
  }, [client, session]);

  /**
   * Update the local user state whenever 'data' changes.
   * This prevents unnecessary re-renders by creating a memoized user object.
   */
  useEffect(() => {
    if (data) {
      Logger.debug("[useCurrentUser()]: User data fetched successfully:", data);
      setUser({
        id: data.ref,
        name: data.name,
        email: data.email
      });
    }
  }, [data]);

  /**
   * Return the user object, the setter function, and the loading state.
   * Memoize the return object to avoid unnecessary re-renders of consuming components.
   */
  return useMemo(
    () => ({
      user,
      setUser,
      isLoading
    }),
    [user, isLoading]
  );
};
