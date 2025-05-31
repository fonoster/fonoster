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
import type { CookieSession } from "../services/sessions/session.interfaces";
import { useEffect } from "react";
import { Logger } from "~/core/logger";

/**
 * Custom hook to authenticate the Fonoster client using a provided session.
 *
 * If an initial session is available and no ID token is present in the client,
 * the hook attempts to authenticate the client using the session.
 *
 * @param {CookieSession} [initialSession] - Optional session containing authentication credentials.
 * @returns {FonosterClient} - The authenticated Fonoster client instance.
 */
export const useAuthenticatedClient = (initialSession?: CookieSession) => {
  /** Retrieves the Fonoster client and the authenticate method from the hook. */
  const { client, authenticate } = useFonoster();

  /**
   * Attempts to authenticate the client using the initial session if no ID token is present.
   *
   * This runs only when the initial session or client changes, ensuring that
   * the client is authenticated when a valid session is provided.
   */
  useEffect(() => {
    if (initialSession && !client.getIdToken()) {
      authenticate(initialSession)
        .then(() => {
          Logger.debug(
            "[useAuthenticatedClient()] Client authenticated successfully with initial session."
          );
        })
        .catch((error) => {
          Logger.error(
            "[useAuthenticatedClient()] Failed to authenticate client with initial session:",
            error
          );
        });
    }
  }, [client, initialSession, authenticate]);

  /** Returns the authenticated (or unauthenticated) Fonoster client instance. */
  return client;
};
