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
const STATE_KEY = "fonoster.github.state";

function randomState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function githubCallbackUrl(origin = window.location.origin) {
  return `${origin}/oauth/github/callback`;
}

/** Builds the authorize URL and remembers its state for the callback to check. */
export function startGitHubSignIn(config: {
  clientId: string;
  authorizeUrl: string;
}) {
  const state = randomState();
  try {
    sessionStorage.setItem(STATE_KEY, state);
  } catch {
    // Without sessionStorage the callback can't verify the state and refuses.
  }
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", githubCallbackUrl());
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  return url.toString();
}

/** True once per sign-in: the stored state is removed whatever the result. */
export function consumeGitHubState(state: string | null): boolean {
  let expected: string | null = null;
  try {
    expected = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);
  } catch {
    return false;
  }
  return Boolean(state && expected && state === expected);
}
