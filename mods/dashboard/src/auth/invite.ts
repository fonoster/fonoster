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
/*
 * Invite emails link to <appUrl>/invites?token=…. The dashboard forwards the
 * token to the API's accept-invite bridge, which marks the membership accepted
 * and redirects back to the app (or to /invites/failed). A session flag lets
 * sign-in show the "You're invited" variant on the way back.
 */
const INVITE_KEY = "fonoster.invite";

export function acceptInviteUrl(apiUrl: string, token: string) {
  return `${apiUrl}/api/identity/accept-invite?token=${encodeURIComponent(token)}`;
}

export function markInviteInFlight() {
  try {
    sessionStorage.setItem(INVITE_KEY, "1");
  } catch {
    // The banner is a nicety; the invite works without it.
  }
}

export function inviteInFlight(): boolean {
  try {
    return sessionStorage.getItem(INVITE_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearInvite() {
  try {
    sessionStorage.removeItem(INVITE_KEY);
  } catch {
    // Ignored.
  }
}
