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
import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { Splash } from "~/components/status/splash";
import { useAuth } from "~/lib/auth";
import { WorkspaceProvider } from "~/lib/workspace";
import { useWorkspaces } from "~/workspaces/workspaces.service";

/**
 * Resolves the workspace in the URL and points the API client at it. Every
 * call made below this route acts on that workspace.
 */
export function WorkspaceGate() {
  const { workspaceRef } = useParams();
  const { client } = useAuth();
  const { data: workspaces } = useWorkspaces();
  const workspace = workspaces?.find((w) => w.ref === workspaceRef);

  useEffect(() => {
    if (!workspace) return;
    client.setAccessKeyId(workspace.accessKeyId);
  }, [client, workspace]);

  if (!workspaces) return <Splash />;
  if (!workspace) return <Navigate to="/workspaces" replace />;
  if (client.getAccessKeyId() !== workspace.accessKeyId)
    client.setAccessKeyId(workspace.accessKeyId);
  return (
    <WorkspaceProvider value={workspace}>
      <Outlet />
    </WorkspaceProvider>
  );
}
