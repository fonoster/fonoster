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
import type { CreateWorkspaceRequest, Workspace } from "@fonoster/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "~/lib/auth";

export const WORKSPACES_KEY = ["workspaces"] as const;

export function useWorkspaces() {
  const { sdk } = useAuth();
  return useQuery({
    queryKey: WORKSPACES_KEY,
    queryFn: async (): Promise<Workspace[]> =>
      (await sdk.workspaces.listWorkspaces()).items
  });
}

export function useCreateWorkspace() {
  const { sdk } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateWorkspaceRequest) =>
      sdk.workspaces.createWorkspace(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
  });
}

export function useCurrentUser() {
  const { sdk, user } = useAuth();
  return useQuery({
    queryKey: ["user", user?.sub],
    queryFn: () => sdk.users.getUser(user!.sub),
    enabled: Boolean(user?.sub)
  });
}
