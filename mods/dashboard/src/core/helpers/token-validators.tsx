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
import type { Client } from "../sdk/client/fonoster.client";

export function isTokenExpired(token: string): boolean {
  if (!token) return true;

  const decodedToken = jwtDecode(token) as { exp: number };
  const currentTime = Date.now() / 1000;

  return decodedToken.exp < currentTime;
}

export async function refreshSession(session: Session, client: Client) {
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

export async function refreshClientSession(
  session: Session,
  client: Client
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
