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
import { ChevronRight, LayoutGrid, Mail, Plus } from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useAuth } from "~/lib/auth";
import { usePrivateRegions } from "~/lib/capabilities";
import { errorMessage } from "~/lib/errors";
import { RegionsSection, useRegions } from "~/regions";
import { UserBar } from "./user-bar";
import { workspacePath } from "./workspace-session";
import { useCurrentUser, useWorkspaces } from "./workspaces.service";

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

  const privateRegions = usePrivateRegions();
  const [params] = useSearchParams();
  const { data: regions } = useRegions();
  const hasRegions = regions?.some((r) => r.kind === "private");

  // Without private regions there is no region drawer: drop a stale ?region= link.
  if (!privateRegions && params.has("region"))
    return <Navigate to="/workspaces" replace />;

  // No workspaces and nothing else to show here (no private regions): invite to start one.
  const regionsKnown = !privateRegions || regions !== undefined;
  if (workspaces && workspaces.length === 0 && regionsKnown && !hasRegions)
    return <FirstWorkspace />;

  return (
    <div className="flex min-h-full flex-col bg-background">
      <UserBar />
      <main className={landingMain}>
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
                <Plus className="size-4" aria-hidden /> Create workspace
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
          <RegionsSection />
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

/** The landing's body: centered over the dotted pattern, as the sign-in screens. */
const landingMain =
  "flex flex-1 items-center justify-center bg-[url(/pattern-center.png)] bg-cover bg-center px-4 pb-20 pt-10";

/** Someone in no workspace yet: one card that starts the first. */
function FirstWorkspace() {
  const { user } = useAuth();
  const { data: profile } = useCurrentUser();
  const firstName = (profile?.name || user?.email || "").split(/[\s@]/)[0];
  return (
    <div className="flex min-h-full flex-col bg-background">
      <UserBar />
      <main className={landingMain}>
        <div className="flex w-full max-w-[640px] flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-semibold">
              {firstName ? `Welcome, ${firstName}` : "Welcome"}
            </h1>
            <p className="text-sm text-muted-foreground">
              You&apos;re not in any workspace yet.
            </p>
          </div>
          <section className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-10 text-center">
            <span className="mb-2 flex size-12 items-center justify-center rounded-xl border border-border bg-background">
              <LayoutGrid className="size-5" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold">
              Create your first workspace
            </h2>
            <p className="max-w-md text-[13px] text-muted-foreground">
              A workspace holds your agents, apps, numbers and calls. You name
              it now and invite your team later from Settings › Members.
            </p>
            <Button asChild className="mt-2">
              <Link to="/workspaces/new">
                <Plus aria-hidden /> Create workspace
              </Link>
            </Button>
          </section>
          <p className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
            <Mail className="size-[15px]" aria-hidden />
            Expecting an invite? Open the link in the email; the workspace shows
            up here.
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
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
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
