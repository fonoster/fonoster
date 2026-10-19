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
import type {
  InviteUserToWorkspaceRequest,
  ListWorkspaceMembersResponse,
  UpdateWorkspaceRequest
} from "@fonoster/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "~/components/ui/sonner";
import { useSdk } from "~/lib/auth";
import { useResourceList, useResourceMutation } from "~/lib/resource";
import { WORKSPACES_KEY } from "~/workspaces/workspaces.service";

/** @fonoster/types doesn't export the item type itself. */
export type Member = ListWorkspaceMembersResponse["items"][number];

const MEMBERS = "members";

/** Renames the workspace; the switcher and this screen read the workspaces list. */
export function useUpdateWorkspace() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateWorkspaceRequest) =>
      sdk.workspaces.updateWorkspace(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      toast.success("Workspace saved");
    }
  });
}

export function useDeleteWorkspace() {
  const sdk = useSdk();
  return useMutation({
    mutationFn: (ref: string) => sdk.workspaces.deleteWorkspace(ref)
  });
}

export function useMembers() {
  const sdk = useSdk();
  return useResourceList<Member>(MEMBERS, (request) =>
    sdk.workspaces.listWorkspaceMembers(request)
  );
}

export type InviteValues = Omit<InviteUserToWorkspaceRequest, "password">;

export function useInviteMember() {
  const sdk = useSdk();
  return useResourceMutation(
    MEMBERS,
    // The type still asks for a password, but the wire request has none: the
    // server makes up the invitee's one-time password when it needs one.
    (request: InviteValues) =>
      sdk.workspaces.inviteUserToWorkspace({ ...request, password: "" }),
    { success: "Invite sent" }
  );
}

export function useResendInvite() {
  const sdk = useSdk();
  return useResourceMutation(
    MEMBERS,
    (userRef: string) =>
      sdk.workspaces.resendWorkspaceMembershipInvitation(userRef),
    { success: "Invite sent again", toastErrors: true }
  );
}

export function useRemoveMember() {
  const sdk = useSdk();
  return useResourceMutation(
    MEMBERS,
    (userRef: string) => sdk.workspaces.removeUserFromWorkspace(userRef),
    { success: "Member removed" }
  );
}
