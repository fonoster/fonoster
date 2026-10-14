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
import { screen } from "@testing-library/react";
import { GrpcCode } from "~/lib/errors";
import { fakeAuth, grpcError, renderScreen } from "~/test/render";
import GitHubCallbackPage from "./github-callback.page";

function signInFailing(message: string) {
  sessionStorage.setItem("fonoster.github.state", "s1");
  const auth = fakeAuth({
    signInWithGitHub: vi
      .fn()
      .mockRejectedValue(grpcError(GrpcCode.PERMISSION_DENIED, message))
  });
  renderScreen(<GitHubCallbackPage />, {
    path: "/oauth/github/callback",
    route: "/oauth/github/callback?code=c1&state=s1",
    auth
  });
}

describe("GitHubCallbackPage", () => {
  it("says the account needs an invite when there's no account", async () => {
    signInFailing("Invalid credentials");
    expect(
      await screen.findByText(/Ask your workspace admin for an invite/)
    ).toBeInTheDocument();
  });

  it("explains a GitHub account without a verified primary email", async () => {
    signInFailing("Your GitHub account has no verified primary email");
    expect(
      await screen.findByText(/Verify an email on GitHub/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/invite/)).not.toBeInTheDocument();
  });

  it("passes other refusals through", async () => {
    signInFailing("GitHub sign-in is disabled");
    expect(
      await screen.findByText("GitHub sign-in is disabled")
    ).toBeInTheDocument();
  });

  it("says when sign-in was cancelled on GitHub", async () => {
    renderScreen(<GitHubCallbackPage />, {
      path: "/oauth/github/callback",
      route: "/oauth/github/callback?error=access_denied&state=s1"
    });
    expect(
      await screen.findByText("GitHub sign-in was cancelled.")
    ).toBeInTheDocument();
  });
});
