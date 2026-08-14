import type { Workspace } from "@fonoster/types";
import type { AuthenticatedUser } from "~/auth/stores/authenticated.interfaces";

/** Resolve a visible creator name. listWorkspaces often omits `owner` and only sends ownerRef. */
export function workspaceCreatorName(
  workspace: Workspace,
  user: AuthenticatedUser | null
): string {
  const nestedName = workspace.owner?.name?.trim();
  const nestedEmail = workspace.owner?.email?.trim();
  if (nestedName) return nestedName;
  if (nestedEmail) return nestedEmail;

  if (user && workspace.ownerRef === user.id) {
    return user.name?.trim() || user.email;
  }

  if (user?.name?.trim()) return user.name.trim();
  if (user?.email) return user.email;

  return "Unknown creator";
}
