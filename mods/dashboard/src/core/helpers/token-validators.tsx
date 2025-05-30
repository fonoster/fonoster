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
import { jwtDecode } from "jwt-decode";
import type { Session } from "~/auth/services/sessions/session.interfaces";
import type { SDK } from "../sdk/client/fonoster.client";

/**
 * Checks whether a given JWT token has expired.
 *
 * @param token - A JWT string (access or refresh token).
 * @returns `true` if the token is expired or invalid; otherwise `false`.
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true;

  const decodedToken = jwtDecode(token) as { exp: number };
  const currentTime = Date.now() / 1000;

  return decodedToken.exp < currentTime;
}

/**
 * Attempts to refresh the session using the provided tokens.
 *
 * If the access token is expired but the refresh token is still valid,
 * it performs a refresh using the Fonoster client and returns an updated session.
 * If the refresh token is expired, an error is thrown.
 *
 * @param session - The current user session containing access and refresh tokens.
 * @param client - The Fonoster client instance used to refresh the tokens.
 * @returns A new `Session` object with updated tokens if the access token was expired.
 *          Otherwise, returns the original session.
 * @throws An error if the refresh token is expired.
 */
export async function refreshSession(session: Session, client: SDK.Client) {
  const { refreshToken, accessToken } = session;

  if (isTokenExpired(refreshToken)) {
    console.warn(
      "[Fonoster Refresh Session] Refresh token expired. Refreshing..."
    );
    throw new Error("Oops! Your session has expired.");
  }

  if (isTokenExpired(accessToken)) {
    console.info(
      "[Fonoster Refresh Session] Access token expired. Refreshing..."
    );

    await client.loginWithRefreshToken(refreshToken);

    return {
      accessToken: client.getAccessToken(),
      refreshToken: client.getRefreshToken(),
      idToken: client.getIdToken()
    };
  }

  return session;
}

/**
 * Forces a session refresh using the refresh token, regardless of access token status.
 *
 * This function assumes the access token needs to be renewed and attempts to refresh it
 * using the provided refresh token. If the refresh token is expired, an error is thrown.
 *
 * @param session - The current session containing a refresh token.
 * @param client - The Fonoster client instance used for the token refresh.
 * @returns A new `Session` object containing updated access, refresh, and ID tokens.
 * @throws An error if the refresh token is expired.
 */
export async function refreshClientSession(
  session: Session,
  client: SDK.WebClient
): Promise<Session> {
  const { refreshToken } = session;

  if (isTokenExpired(refreshToken)) {
    console.warn(
      "[Fonoster Refresh Client Session] Refresh token expired. Refreshing..."
    );
    throw new Error("Oops! Your session has expired.");
  }

  await client.loginWithRefreshToken(refreshToken);

  return {
    accessToken: client.getAccessToken(),
    refreshToken: client.getRefreshToken(),
    idToken: client.getIdToken()
  };
}
