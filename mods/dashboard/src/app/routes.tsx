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
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Splash } from "~/components/status/splash";
import { InviteFailedPage, InvitesPage } from "~/auth/invites.page";
import { PublicOnly, RequireAuth } from "./guards";
import { LandingRedirect } from "./landing-redirect";
import { WorkspaceGate } from "./workspace-gate";
import { AppShell } from "./shell/app-shell";
import { NAVIGATION } from "./shell/nav";
import { PendingScreen } from "./shell/page";
import { SCREENS } from "./screens";

const SignIn = lazy(() => import("~/auth/sign-in.page"));
const CheckEmail = lazy(() => import("~/auth/check-email.page"));
const SignUp = lazy(() => import("~/auth/sign-up.page"));
const ForgotPassword = lazy(() => import("~/auth/forgot-password.page"));
const ResetPassword = lazy(() => import("~/auth/reset-password.page"));
const GitHubCallback = lazy(() => import("~/auth/github-callback.page"));
const SetPassword = lazy(() => import("~/auth/set-password.page"));
const Workspaces = lazy(() => import("~/workspaces/landing.page"));
const CreateWorkspace = lazy(
  () => import("~/workspaces/create-workspace.page")
);

// Not linked from the navigation: the session-protocol preview (mock data).
const SessionPreview = lazy(() => import("~/session-preview"));

function screen(path: string, title: string) {
  const Screen = SCREENS[path];
  return Screen ? <Screen /> : <PendingScreen title={title} />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-in/code" element={<CheckEmail />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/oauth/github/callback" element={<GitHubCallback />} />
        </Route>
        {/* Reachable signed in or out: these links come from emails. */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/invites" element={<InvitesPage />} />
        <Route path="/invites/failed" element={<InviteFailedPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<LandingRedirect />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/workspaces/new" element={<CreateWorkspace />} />
          <Route path="/w/:workspaceRef" element={<WorkspaceGate />}>
            <Route element={<AppShell />}>
              {NAVIGATION.flatMap((section) => section.items).map((item) =>
                item.path ? (
                  <Route
                    key={item.path}
                    path={`${item.path}/*`}
                    element={screen(item.path, item.label)}
                  />
                ) : (
                  <Route
                    key="overview"
                    index
                    element={screen("", item.label)}
                  />
                )
              )}
              <Route path="preview/*" element={<SessionPreview />} />
              <Route path="*" element={<Navigate to="." replace />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
