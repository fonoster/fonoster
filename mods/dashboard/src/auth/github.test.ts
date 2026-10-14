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
import { consumeGitHubState, startGitHubSignIn } from "./github";

describe("GitHub sign-in state", () => {
  beforeEach(() => sessionStorage.clear());

  it("builds the authorize URL with a fresh state", () => {
    const url = new URL(
      startGitHubSignIn({
        clientId: "Iv1.abc",
        authorizeUrl: "https://github.com/login/oauth/authorize"
      })
    );
    expect(url.origin + url.pathname).toBe(
      "https://github.com/login/oauth/authorize"
    );
    expect(url.searchParams.get("client_id")).toBe("Iv1.abc");
    expect(url.searchParams.get("redirect_uri")).toBe(
      `${window.location.origin}/oauth/github/callback`
    );
    expect(url.searchParams.get("state")).toMatch(/^[0-9a-f]{32}$/);
  });

  it("accepts the matching state once", () => {
    const state = new URL(
      startGitHubSignIn({
        clientId: "x",
        authorizeUrl: "https://gh.test/authorize"
      })
    ).searchParams.get("state");
    expect(consumeGitHubState(state)).toBe(true);
    expect(consumeGitHubState(state)).toBe(false);
  });

  it("rejects a state it didn't issue", () => {
    startGitHubSignIn({
      clientId: "x",
      authorizeUrl: "https://gh.test/authorize"
    });
    expect(consumeGitHubState("forged")).toBe(false);
    expect(consumeGitHubState(null)).toBe(false);
  });
});
