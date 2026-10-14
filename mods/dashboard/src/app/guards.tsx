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
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Splash } from "~/components/status/splash";
import { useAuth } from "~/lib/auth";

/** Screens for signed-in users. Invitees go to Set password first. */
export function RequireAuth() {
  const { status, user, endedBy } = useAuth();
  const location = useLocation();

  if (status === "restoring") return <Splash />;
  if (status === "signedOut") {
    const next = location.pathname + location.search;
    const query =
      next === "/" || endedBy === "user"
        ? ""
        : `?next=${encodeURIComponent(next)}`;
    return <Navigate to={`/sign-in${query}`} replace />;
  }
  if (user?.mustChangePassword && location.pathname !== "/set-password") {
    return <Navigate to="/set-password" replace />;
  }
  if (!user?.mustChangePassword && location.pathname === "/set-password") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/** Sign-in screens; a signed-in user goes straight to the app. */
export function PublicOnly() {
  const { status } = useAuth();
  if (status === "restoring") return <Splash />;
  if (status === "signedIn") return <Navigate to="/" replace />;
  return <Outlet />;
}
