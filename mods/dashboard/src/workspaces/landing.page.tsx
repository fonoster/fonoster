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
import type { Workspace } from "@fonoster/types";
import { ChevronRight, Mail, Plus } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useAuth } from "~/lib/auth";
import { errorMessage } from "~/lib/errors";
import { UserBar } from "./user-bar";
import { rememberWorkspace, workspacePath } from "./workspace-session";
import { useWorkspaces } from "./workspaces.service";

const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function workspaceInitials(name: string) {
  const words = name.trim().split(/\s+/);
  return (
    words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2)
  ).toUpperCase();
}

/** Select a workspace, or start the first one. */
export default function WorkspacesPage() {
  const { data: workspaces, isPending, error, refetch } = useWorkspaces();

  if (workspaces && workspaces.length === 0)
    return <Navigate to="/workspaces/new" replace />;

  return (
    <div className="flex min-h-full flex-col bg-background">
      <UserBar />
      <main className="flex flex-1 justify-center px-4 pb-20 pt-10">
        <div className="flex w-full max-w-[640px] flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-semibold">Choose a workspace</h1>
            <p className="font-display text-sm text-muted-foreground">
              Pick up where you left off, or start a new one for another team or
              client.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-[13px] font-medium">
              Your workspaces
              {workspaces && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {workspaces.length}
                </span>
              )}
            </div>
            <Button asChild className="font-display">
              <Link to="/workspaces/new">
                <Plus className="size-4" aria-hidden /> New workspace
              </Link>
            </Button>
          </div>
          {error ? (
            <Alert variant="error">
              {errorMessage(error)}{" "}
              <button
                type="button"
                className="cursor-pointer underline"
                onClick={() => void refetch()}
              >
                Try again
              </button>
            </Alert>
          ) : isPending ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[74px]" />
              ))}
            </div>
          ) : (
            <WorkspaceList workspaces={workspaces} />
          )}
          <p className="flex items-center gap-2 font-display text-[13px] text-muted-foreground">
            <Mail className="size-[15px]" aria-hidden />
            Invited somewhere else? Open the link in the invite email and it
            shows up here.
          </p>
        </div>
      </main>
    </div>
  );
}

function WorkspaceList({ workspaces }: { workspaces: Workspace[] }) {
  const { user } = useAuth();
  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-card">
      {workspaces.map((workspace) => {
        const mine = workspace.ownerRef === user?.sub;
        const owner = mine
          ? "you"
          : workspace.owner?.name || workspace.owner?.email;
        const created = workspace.createdAt
          ? DATE.format(new Date(workspace.createdAt))
          : null;
        return (
          <li
            key={workspace.ref}
            className="border-b border-border last:border-b-0"
          >
            <Link
              to={workspacePath(workspace.ref)}
              onClick={() => rememberWorkspace(workspace.ref)}
              className="flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-muted font-display text-sm font-semibold"
                aria-hidden
              >
                {workspaceInitials(workspace.name)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-display text-[15px] font-medium">
                  {workspace.name}
                </span>
                <span className="truncate font-display text-xs text-muted-foreground">
                  {[
                    owner && `Owned by ${owner}`,
                    created && `Created ${created}`
                  ]
                    .filter(Boolean)
                    .join("  ·  ")}
                </span>
              </span>
              {mine && (
                <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 font-display text-xs text-(--fn-fonoster-06) dark:text-brand-text">
                  Owner
                </span>
              )}
              <ChevronRight
                className="size-[18px] text-muted-foreground"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
