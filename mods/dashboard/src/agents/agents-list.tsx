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
import type { Application, INumber } from "@fonoster/types";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import {
  DataTable,
  MutedCell,
  NameCell,
  NumbersCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { SmartToy } from "~/components/icons/material";
import { RowActions } from "~/components/data/row-actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PageHeader } from "~/app/shell/page";
import { formatDate } from "~/lib/format";
import { useWorkspace } from "~/lib/workspace";
import {
  formatNumber,
  numbersFor,
  useAgents,
  useAllNumbers,
  useCatalog,
  useDeleteAgent
} from "./agents.service";
import {
  EMPTY_CATALOG,
  labelOf,
  summaryOf,
  type AgentCatalog
} from "./catalog";
import { CreateAgentDialog } from "./create-agent-dialog";
import { CLI_COMMAND, CliHint } from "./parts";

type Config = Record<string, unknown> | undefined;
const field = (config: Config, key: string) => {
  const value = config?.[key];
  return typeof value === "string" ? value : "";
};

/** One list row's columns, derived from the agent, the workspace's numbers and the catalog. */
export function agentRow(
  app: Application,
  numbers: INumber[] | undefined,
  catalog: AgentCatalog = EMPTY_CATALOG
) {
  const routed = numbersFor(numbers, app.ref);
  const languageModel = (app.intelligence?.config as Config)?.languageModel as
    | Config
    | undefined;
  // The session model: catalog ids on the agent and on the app's speech defaults.
  const model = field(languageModel, "model");
  const speech = (app as { speech?: Config }).speech;
  const voice = field(speech, "voice");
  const language = field(speech, "language");
  return {
    numbers:
      routed.length === 0
        ? "No numbers"
        : formatNumber(routed[0].telUrl) +
          (routed.length > 1 ? ` +${routed.length - 1}` : ""),
    model: summaryOf(catalog, catalog.llm, model),
    voice:
      [voice && labelOf(catalog.voices, voice), language]
        .filter(Boolean)
        .join(" · ") || "—"
  };
}

export function AgentsList() {
  const list = useAgents();
  const numbers = useAllNumbers();
  const catalog = useCatalog().data;
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Application>();
  const remove = useDeleteAgent();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? list.items.filter(
          (app) =>
            app.name.toLowerCase().includes(q) ||
            app.ref.toLowerCase().includes(q)
        )
      : list.items;
  }, [list.items, query]);

  const add = (
    <Button onClick={() => setCreating(true)}>
      <Plus aria-hidden /> Create agent
    </Button>
  );

  const columns: Column<Application>[] = [
    {
      header: "Agent",
      cell: (app) => <NameCell name={app.name} sub={app.ref} />
    },
    {
      header: "Numbers",
      className: "w-44",
      cell: (app) => (
        <NumbersCell
          telUrls={numbersFor(numbers.data, app.ref).map((n) => n.telUrl)}
        />
      )
    },
    {
      header: "Model",
      className: "w-48",
      cell: (app) => (
        <span className="block truncate text-muted-foreground">
          {agentRow(app, numbers.data, catalog).model}
        </span>
      )
    },
    {
      header: "Voice · Language",
      className: "w-52",
      cell: (app) => (
        <span className="block truncate text-muted-foreground">
          {agentRow(app, numbers.data, catalog).voice}
        </span>
      )
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
      className: "w-12",
      cell: (app) => (
        <RowActions label={app.name} onDelete={() => setDeleting(app)} />
      )
    }
  ];

  const empty =
    !list.isPending &&
    !list.error &&
    !list.hasNextPage &&
    list.items.length === 0;

  return (
    <>
      <PageHeader
        title="Agents"
        description="AI agents that answer and place calls, powered by Autopilot."
        actions={!list.isPending && !empty && <>{add}</>}
      />
      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        {empty ? (
          <EmptyState
            icon={SmartToy}
            title="Build your first agent"
            description="Write a prompt, pick a voice, point a number at it. Most teams get a first call working in minutes."
            action={add}
            footer={
              <code className="mt-2 rounded-control bg-muted px-3 py-1 font-mono text-[12px] text-muted-foreground">
                $ {CLI_COMMAND}
              </code>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-80">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  aria-label="Search agents"
                  placeholder="Search agents"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              {!list.isPending && (
                <span className="font-display text-[13px] text-muted-foreground">
                  {rows.length} {rows.length === 1 ? "agent" : "agents"}
                </span>
              )}
            </div>
            <DataTable
              label="Agents"
              columns={columns}
              rows={rows}
              rowKey={(app) => app.ref}
              onRowClick={(app) =>
                navigate(`/w/${workspace.ref}/agents/${app.ref}`)
              }
              loading={list.isPending}
              error={list.error}
              onRetry={() => void list.refetch()}
              hasMore={list.hasNextPage}
              loadingMore={list.isFetchingNextPage}
              onLoadMore={() => void list.fetchNextPage()}
              empty={
                <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center font-display text-sm text-muted-foreground">
                  No agents match “{query}”.
                </p>
              }
            />
            <CliHint />
          </>
        )}
      </div>
      <CreateAgentDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(undefined);
            remove.reset();
          }
        }}
        title={`Delete ${deleting?.name ?? "agent"}?`}
        description="Numbers pointing to this agent stop answering until you route them elsewhere."
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.ref, {
            onSuccess: () => setDeleting(undefined)
          })
        }
      />
    </>
  );
}
