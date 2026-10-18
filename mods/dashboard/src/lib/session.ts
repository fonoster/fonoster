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
import { GrpcCode } from "./errors";

/*
 * The cookie session (security review M4). The apiserver keeps the refresh
 * token in an httpOnly, SameSite=Strict cookie scoped to /api/session on the
 * dashboard's own origin (Envoy routes /api there), so no script on the page
 * can read it. The dashboard holds only the access and id tokens, in memory.
 */

export type SessionTokens = { accessToken: string; idToken: string };

/**
 * A refused or failed session request. `code` uses the gRPC codes the rest of
 * the dashboard already reacts to: UNAUTHENTICATED means there is no valid
 * session, UNAVAILABLE that the API couldn't be reached.
 */
export class SessionError extends Error {
  constructor(
    readonly status: number,
    readonly code: number
  ) {
    super(
      code === GrpcCode.UNAUTHENTICATED
        ? "Your session has ended. Sign in again."
        : "Can't reach the Fonoster API. Check your connection and try again."
    );
  }
}

export type SessionApi = {
  /** Hands a fresh sign-in's refresh token to the cookie; it is rotated at once. */
  adopt(refreshToken: string): Promise<SessionTokens>;
  /** New tokens from the cookie (which rotates). */
  refresh(): Promise<SessionTokens>;
  /** Revokes the cookie's token family and clears the cookie. */
  logout(): Promise<void>;
};

const PATH = "/api/session";
const LOCK = "fonoster.session";

/**
 * Tabs share the cookie and each refresh rotates it; a token presented twice
 * revokes the whole sign-in. So refreshes run one at a time across tabs (Web
 * Locks), each sending the cookie the previous one set.
 */
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  return locks ? (locks.request(LOCK, fn) as Promise<T>) : fn();
}

export function createSessionApi(
  origin: string = window.location.origin,
  fetchImpl: typeof fetch = (...args) => fetch(...args)
): SessionApi {
  const post = (path: string, body?: object) =>
    exclusive(async () => {
      let response: Response;
      try {
        response = await fetchImpl(`${origin}${PATH}${path}`, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            // CSRF: a cross-site form can't send it, and Envoy's CORS doesn't allow it.
            "X-Requested-With": "fonoster-dashboard",
            ...(body ? { "Content-Type": "application/json" } : {})
          },
          body: body ? JSON.stringify(body) : undefined
        });
      } catch {
        throw new SessionError(0, GrpcCode.UNAVAILABLE);
      }
      if (!response.ok) {
        const refused = [400, 401, 403].includes(response.status);
        throw new SessionError(
          response.status,
          refused ? GrpcCode.UNAUTHENTICATED : GrpcCode.UNAVAILABLE
        );
      }
      return response;
    });

  const tokens = async (response: Response): Promise<SessionTokens> => {
    const json = (await response.json().catch(() => null)) as {
      accessToken?: unknown;
      idToken?: unknown;
    } | null;
    if (typeof json?.accessToken !== "string")
      throw new SessionError(response.status, GrpcCode.UNAVAILABLE);
    return {
      accessToken: json.accessToken,
      idToken: typeof json.idToken === "string" ? json.idToken : ""
    };
  };

  return {
    adopt: async (refreshToken) => tokens(await post("", { refreshToken })),
    refresh: async () => tokens(await post("/refresh")),
    logout: async () => {
      await post("/logout");
    }
  };
}
