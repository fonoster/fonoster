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
import type { Application } from "@fonoster/types";
import { Braces, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { RowActions } from "~/components/data/row-actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PageHeader } from "~/app/shell/page";
import { formatDate } from "~/lib/format";
import { CreateVoiceAppDialog } from "./create-voice-app-dialog";
import { DeleteVoiceAppDialog } from "./delete-voice-app-dialog";
import { speechSummary } from "./speech";
import { SDK_DOCS_URL } from "./templates";
import {
  formatNumber,
  numbersFor,
  useAllNumbers,
  useVoiceApps
} from "./voice-apps.service";

function matches(app: Application, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [app.name, app.ref, app.endpoint ?? ""].some((v) =>
    v.toLowerCase().includes(q)
  );
}

export function VoiceAppsList() {
  const list = useVoiceApps();
  const numbers = useAllNumbers();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Application | undefined>();
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => list.items.filter((app) => matches(app, query)),
    [list.items, query]
  );

  const create = (
    <Button onClick={() => setCreating(true)}>
      <Plus aria-hidden /> New voice app
    </Button>
  );

  const columns: Column<Application>[] = [
    {
      header: "Voice app",
      cell: (app) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-muted">
            <Braces className="size-4 text-muted-foreground" aria-hidden />
          </span>
          <NameCell name={app.name} sub={app.ref} />
        </div>
      )
    },
    {
      header: "Endpoint",
      cell: (app) => (
        <span className="font-mono text-xs text-foreground">
          {app.endpoint || "—"}
        </span>
      )
    },
    {
      header: "Numbers",
      className: "w-44",
      cell: (app) => {
        const routed = numbersFor(numbers.data, app.ref);
        if (numbers.isPending) return <MutedCell>…</MutedCell>;
        if (routed.length === 0) return <MutedCell>—</MutedCell>;
        return (
          <span className="flex flex-col">
            <span>{formatNumber(routed[0].telUrl)}</span>
            {routed.length > 1 && (
              <span className="text-[11px] text-muted-foreground">
                +{routed.length - 1} more
              </span>
            )}
          </span>
        );
      }
    },
    {
      header: "Voice · Transcriber",
      className: "w-52",
      cell: (app) => <MutedCell>{speechSummary(app) ?? "—"}</MutedCell>
    },
    {
      header: "Updated",
      className: "w-28",
      cell: (app) => (
        <MutedCell>{formatDate(app.updatedAt || app.createdAt)}</MutedCell>
      )
    },
    {
      header: "",
      className: "w-14",
      cell: (app) => (
        <RowActions
          label={app.name}
          onEdit={() => navigate(app.ref)}
          onDelete={() => setDeleting(app)}
        />
      )
    }
  ];

  const hasApps = list.items.length > 0;

  return (
    <>
      <PageHeader
        title="Voice apps"
        description="Your own code controls the call: IVR menus, audio streams, custom logic."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href={SDK_DOCS_URL} target="_blank" rel="noreferrer">
                SDK docs
              </a>
            </Button>
            {hasApps && create}
          </>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        {hasApps && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                aria-label="Search voice apps"
                placeholder="Search voice apps"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <span className="font-display text-[13px] text-muted-foreground">
              {rows.length} {rows.length === 1 ? "voice app" : "voice apps"}
            </span>
          </div>
        )}
        <DataTable
          label="Voice apps"
          columns={columns}
          rows={rows}
          rowKey={(app) => app.ref}
          onRowClick={(app) => navigate(app.ref)}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            hasApps ? (
              <EmptyState
                icon={Search}
                title="No matches"
                description={`No voice app matches “${query.trim()}”.`}
              />
            ) : (
              <EmptyState
                icon={Braces}
                title="No voice apps yet"
                description="Write the call logic in your own code with the Fonoster SDK, then point a number at it."
                action={create}
              />
            )
          }
        />
      </div>
      <CreateVoiceAppDialog open={creating} onOpenChange={setCreating} />
      <DeleteVoiceAppDialog
        app={deleting}
        onClose={() => setDeleting(undefined)}
      />
    </>
  );
}
