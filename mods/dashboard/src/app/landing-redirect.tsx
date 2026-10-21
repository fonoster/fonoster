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
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { clearInvite, inviteInFlight } from "~/auth/invite";
import { Alert } from "~/components/ui/alert";
import { Splash } from "~/components/status/splash";
import { errorMessage } from "~/lib/errors";
import { landingTarget } from "~/workspaces/workspace-session";
import { WORKSPACES_KEY, useWorkspaces } from "~/workspaces/workspaces.service";

/** "/" sends a signed-in user to the workspaces list, or to Create workspace when there is none. */
export function LandingRedirect() {
  const queryClient = useQueryClient();
  const { data, error } = useWorkspaces();

  // Back from accepting an invite while signed in: the new workspace must show.
  useEffect(() => {
    if (!inviteInFlight()) return;
    clearInvite();
    void queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
  }, [queryClient]);

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Alert variant="error">{errorMessage(error)}</Alert>
      </div>
    );
  }
  if (!data) return <Splash />;
  return <Navigate to={landingTarget(data)} replace />;
}
