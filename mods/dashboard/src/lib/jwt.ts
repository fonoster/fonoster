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
/** Reads a JWT's claims without verifying it (the server does that). */
export function decodeJwt<T extends object>(
  token: string | null | undefined
): T | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      Array.from(
        atob(base64),
        (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")
      ).join("")
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export type IdTokenClaims = {
  sub: string;
  email: string;
  emailVerified?: boolean;
  accessKeyId: string;
  mustChangePassword?: boolean;
  exp: number;
};

/** Milliseconds until the token expires (negative when it already has). */
export function msUntilExpiry(token: string, now = Date.now()): number {
  const claims = decodeJwt<{ exp?: number }>(token);
  return claims?.exp ? claims.exp * 1000 - now : -1;
}
