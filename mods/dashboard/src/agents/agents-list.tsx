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
import { Bot, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
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
  useCatalog
} from "./agents.service";
import {
  EMPTY_CATALOG,
  labelOf,
  providerLabel,
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
  // The session model: catalog ids on the assistant and on the app's speech defaults.
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
    model: model
      ? `${providerLabel(catalog, model)} · ${labelOf(catalog.llm, model)}`
      : "—",
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
      <Plus aria-hidden /> New agent
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
      cell: (app) => {
        const { numbers: text } = agentRow(app, numbers.data, catalog);
        return text === "No numbers" ? (
          <MutedCell>{text}</MutedCell>
        ) : (
          <span className="font-mono text-[12px]">{text}</span>
        );
      }
    },
    {
      header: "Model",
      className: "w-48",
      cell: (app) => (
        <MutedCell>{agentRow(app, numbers.data, catalog).model}</MutedCell>
      )
    },
    {
      header: "Voice · Language",
      className: "w-52",
      cell: (app) => (
        <MutedCell>{agentRow(app, numbers.data, catalog).voice}</MutedCell>
      )
    },
    {
      header: "Updated",
      className: "w-28",
      cell: (app) => (
        <MutedCell>{formatDate(app.updatedAt || app.createdAt)}</MutedCell>
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
        title="Autopilot"
        description="AI agents that answer and place calls."
        actions={!list.isPending && !empty && <>{add}</>}
      />
      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        {empty ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-xl bg-brand-subtle">
              <Bot className="size-6 text-brand-text" aria-hidden />
            </span>
            <h2 className="font-display text-lg font-medium">
              Build your first agent
            </h2>
            <p className="max-w-md font-display text-sm text-muted-foreground">
              Write a prompt, pick a voice, point a number at it. Most teams get
              a first call working in minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {add}
            </div>
            <code className="mt-2 rounded-control bg-muted px-3 py-1 font-mono text-[12px] text-muted-foreground">
              $ {CLI_COMMAND}
            </code>
          </div>
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
                navigate(`/w/${workspace.ref}/autopilot/${app.ref}`)
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
    </>
  );
}
