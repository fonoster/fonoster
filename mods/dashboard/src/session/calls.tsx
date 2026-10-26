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
/*
 * The Calls page and a call's record (dashboard-call-records), laid out as the Calls frames in
 * designs/dashboard.pen. What a record does not carry yet (per-stage latency, cost) is left out,
 * not faked.
 */
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronRight,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Scissors,
  Timer,
  User,
  Wrench
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "~/app/shell/page";
import { DirectionIcon, TONE_DOT } from "~/calls/parts";
import { RANGES, download, formatStarted, rangeStart } from "~/calls/format";
import {
  clock,
  endedText,
  median,
  recordDirection,
  recordParties,
  recordStatus,
  recordsToCsv,
  answeredByWord,
  callCount,
  responseTimes,
  type Stage,
  stageSegments,
  usageRow
} from "~/calls/records";
import { WaveformPlayer } from "~/calls/waveform-player";
import { DataTable, type Column } from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { Code, SmartToy } from "~/components/icons/material";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Select } from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { useRegion } from "~/regions";
import {
  errorMessage,
  useSessionApi,
  useSessionKey,
  useSessionQuery
} from "./api";
import type {
  CallRecord,
  CallRecordSummary,
  KnowledgeSearch,
  SessionApp,
  SessionMessage,
  ToolCall,
  Turn
} from "./types";

/** One-line description of a session message for the Events tab. */
export function describeMessage(m: SessionMessage["message"]): string {
  const { type, ...rest } = m;
  const text = typeof rest.text === "string" ? rest.text : undefined;
  if (text) return `${type}: ${text}`;
  if (typeof rest.reason === "string") return `${type}: ${rest.reason}`;
  return type;
}

const SOURCE_BADGE = {
  app: "info",
  appbridge: "neutral",
  event: "success"
} as const;

function StatusWord({
  call
}: {
  call: Pick<CallRecordSummary, "status" | "failureReason">;
}) {
  const { label, tone } = recordStatus(call);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])}
        aria-hidden
      />
      {label}
    </span>
  );
}

function AppName({ app }: { app?: SessionApp }) {
  if (!app) return <span className="text-muted-foreground">—</span>;
  const Icon = app.type === "AUTOPILOT" ? SmartToy : Code;
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{app.name}</span>
    </span>
  );
}

const ANY = "any";
const filterClass = "h-8 w-auto gap-2 rounded-control px-3 text-[13px]";
const STATUSES = [
  { value: ANY, label: "Any status" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "incomplete", label: "Incomplete" }
];
const DIRECTIONS = [
  { value: ANY, label: "All directions" },
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
  { value: "internal", label: "Internal" }
];
const PERIODS = [...RANGES, { value: ANY, label: "All time" }];
const mono = "font-mono text-[13px] tabular-nums";
/** Underlined tabs, as the call detail's design has them. */
const tab =
  "-mb-px rounded-none border-b-2 border-transparent px-0 pb-2.5 pt-3 data-[state=active]:border-foreground data-[state=active]:bg-transparent";

/** The next page of a calls query: where the last one ended, and the period's start it used. */
type CallsPageParam = { pageToken: string; after?: string };

export function CallRecordsList() {
  const navigate = useNavigate();
  const api = useSessionApi();
  const [period, setPeriod] = useState("7");
  const [direction, setDirection] = useState(ANY);
  const [appRef, setAppRef] = useState(ANY);
  const [status, setStatus] = useState(ANY);
  const { data: apps = [] } = useSessionQuery(["apps"], (a) => a.listApps());
  const calls = useInfiniteQuery({
    queryKey: [
      ...useSessionKey(),
      "calls",
      "list",
      period,
      direction,
      appRef,
      status
    ],
    initialPageParam: undefined as CallsPageParam | undefined,
    // The period's start is set by the first page and kept by the next ones, so Load more pages
    // through the same calls the first page's total counted.
    queryFn: async ({ pageParam }) => {
      const after = pageParam
        ? pageParam.after
        : period !== ANY
          ? rangeStart(period)
          : undefined;
      const page = await api.listCalls({
        ...(after ? { after } : {}),
        ...(direction !== ANY ? { direction } : {}),
        ...(appRef !== ANY ? { appRef } : {}),
        ...(status !== ANY ? { status } : {}),
        ...(pageParam ? { pageToken: pageParam.pageToken } : {})
      });
      return { ...page, after };
    },
    getNextPageParam: (page): CallsPageParam | undefined =>
      page.nextPageToken
        ? { pageToken: page.nextPageToken, after: page.after }
        : undefined
  });
  const rows = calls.data?.pages.flatMap((page) => page.items) ?? [];
  const filtered =
    status !== ANY || period !== ANY || direction !== ANY || appRef !== ANY;
  const appOf = (ref: string) => apps.find((a) => a.ref === ref);
  const count = callCount(
    rows.length,
    calls.hasNextPage,
    calls.data?.pages[0]?.total
  );

  const columns: Column<CallRecordSummary>[] = [
    {
      header: "Started",
      className: "w-36 whitespace-nowrap",
      cell: (c) => (
        <span className="text-muted-foreground">
          {formatStarted(c.startedAt)}
        </span>
      )
    },
    { header: "Handled by", cell: (c) => <AppName app={appOf(c.appRef)} /> },
    {
      header: "Customer",
      cell: (c) => (
        <span className="inline-flex items-center gap-2">
          <DirectionIcon direction={recordDirection(c.direction)} />
          <span className={mono}>{recordParties(c).customer}</span>
        </span>
      )
    },
    {
      header: "Fonoster number",
      cell: (c) => (
        <span className={cn(mono, "text-muted-foreground")}>
          {recordParties(c).fonosterNumber || "—"}
        </span>
      )
    },
    {
      header: "Duration",
      className: "w-24",
      cell: (c) => (
        <span className={mono}>
          {c.status === "failed" || !c.durationMs ? "—" : clock(c.durationMs)}
        </span>
      )
    },
    {
      header: "Status",
      className: "w-32",
      cell: (c) => <StatusWord call={c} />
    },
    {
      header: "Answered by",
      className: "w-32",
      cell: (c) => (
        <span className="text-muted-foreground">
          {answeredByWord(c.amdStatus) ?? "—"}
        </span>
      )
    },
    {
      header: "",
      className: "w-10",
      cell: () => (
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      )
    }
  ];
  return (
    <>
      <PageHeader
        title="Calls"
        description="Every call in this workspace. Open one to see the transcript, tools and timing."
        actions={
          <Button
            variant="outline"
            disabled={rows.length === 0}
            onClick={() =>
              download(
                "calls.csv",
                recordsToCsv(rows, (ref) => appOf(ref)?.name),
                "text/csv"
              )
            }
          >
            Export CSV
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Period"
            className={filterClass}
            value={period}
            options={PERIODS}
            onValueChange={setPeriod}
          />
          <Select
            aria-label="Direction"
            className={filterClass}
            value={direction}
            options={DIRECTIONS}
            onValueChange={setDirection}
          />
          <Select
            aria-label="Agent or app"
            className={filterClass}
            value={appRef}
            options={[
              { value: ANY, label: "All agents & apps" },
              ...apps.map((a) => ({ value: a.ref, label: a.name }))
            ]}
            onValueChange={setAppRef}
          />
          <Select
            aria-label="Status"
            className={filterClass}
            value={status}
            options={STATUSES}
            onValueChange={setStatus}
          />
          {!calls.isPending && !calls.error && (
            <span className="ml-auto font-display text-[13px] text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        <DataTable
          label="Calls"
          columns={columns}
          rows={rows}
          rowKey={(c) => c.callRef}
          onRowClick={(c) => navigate(c.callRef)}
          loading={calls.isPending}
          error={calls.error ? errorMessage(calls.error) : undefined}
          onRetry={() => void calls.refetch()}
          hasMore={calls.hasNextPage}
          loadingMore={calls.isFetchingNextPage}
          onLoadMore={() => void calls.fetchNextPage()}
          empty={
            filtered ? (
              <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                No calls match the filters.
              </p>
            ) : (
              <EmptyState
                icon={PhoneCall}
                title="No calls yet"
                description="Records appear here when calls end and their records are sealed."
              />
            )
          }
        />
      </div>
    </>
  );
}

/** A recording fetched with the access token, played and downloaded from an object URL. */
function Recording({ call }: { call: CallRecord }) {
  const api = useSessionApi();
  const [state, setState] = useState<{ url?: string; error?: string }>({});
  useEffect(() => {
    let url: string | undefined;
    let live = true;
    api
      .recordingUrl(call.callRef)
      .then((u) => {
        url = u;
        if (live) setState({ url: u });
      })
      .catch((e) => live && setState({ error: errorMessage(e) }));
    return () => {
      live = false;
      if (url?.startsWith("blob:")) URL.revokeObjectURL?.(url);
    };
  }, [api, call.callRef]);
  if (state.error)
    return (
      <Alert variant="error">
        The recording couldn't be loaded: {state.error}
      </Alert>
    );
  if (!state.url)
    return (
      <p className="py-2 text-xs text-muted-foreground">
        Loading the recording…
      </p>
    );
  return (
    <WaveformPlayer
      url={state.url}
      filename={`${call.callRef}.wav`}
      durationMs={call.durationMs}
    />
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-display text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function Tag({
  children,
  tone = "muted"
}: {
  children: ReactNode;
  tone?: "muted" | "success" | "warning" | "error";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded bg-muted px-1.5 py-px font-mono text-[11px]",
        tone === "muted" && "text-muted-foreground",
        tone === "success" && "text-primary",
        tone === "warning" && "text-warning-foreground",
        tone === "error" && "text-destructive"
      )}
    >
      {children}
    </span>
  );
}

/** One row of the transcript timeline: time, icon, a title line and an optional body. */
function Row({
  at,
  icon,
  title,
  children,
  label
}: {
  at: number;
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  label?: string;
}) {
  return (
    <li aria-label={label} className="flex gap-4 py-3">
      <span className="w-10 shrink-0 pt-1 font-mono text-xs text-muted-foreground tabular-nums">
        {clock(at)}
      </span>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground [&_svg]:size-3.5">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          {title}
        </div>
        {children}
      </div>
    </li>
  );
}

type Entry =
  | { kind: "turn"; at: number; turn: Turn }
  | { kind: "knowledge"; at: number; search: KnowledgeSearch }
  | { kind: "tool"; at: number; tool: ToolCall };

/** A tool's parameters or response: JSON shown indented, anything else as it is. */
function Payload({ label, text }: { label: string; text: string }) {
  let shown = text;
  try {
    shown = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    // Not JSON (or cut short): shown as recorded.
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap text-foreground">
        {shown}
      </pre>
    </div>
  );
}

function ToolRow({ tool }: { tool: ToolCall }) {
  const payloads = [
    ["Parameters", tool.parameters],
    ["Response", tool.response],
    ["Error", tool.error]
  ].filter((p): p is [string, string] => Boolean(p[1]));
  return (
    <Row
      at={tool.at}
      icon={<Wrench />}
      label="tool call"
      title={
        <>
          Tool call <Tag>{tool.name}</Tag>
          {tool.method && <Tag>{tool.method}</Tag>}
          {tool.status !== undefined && (
            <Tag tone={tool.status >= 400 ? "error" : "muted"}>
              {tool.status}
            </Tag>
          )}
          {tool.durationMs !== undefined && <Tag>{tool.durationMs} ms</Tag>}
          <Tag tone={tool.ok ? "success" : "error"}>
            {tool.ok ? "ok" : "failed"}
          </Tag>
        </>
      }
    >
      {payloads.length > 0 && (
        <details className="text-[13px]">
          <summary className="cursor-pointer text-muted-foreground">
            {payloads
              .map(([label], i) => (i ? label.toLowerCase() : label))
              .join(" and ")}
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {payloads.map(([label, text]) => (
              <Payload key={label} label={label} text={text} />
            ))}
          </div>
        </details>
      )}
    </Row>
  );
}

function KnowledgeRow({ search }: { search: KnowledgeSearch }) {
  const top = search.passages[0];
  return (
    <Row
      at={search.at}
      icon={<BookOpen />}
      label="knowledge search"
      title={
        <>
          Searched knowledge
          {search.source && <Tag>{search.source}</Tag>}
          {search.durationMs !== undefined && <Tag>{search.durationMs} ms</Tag>}
          {search.timedOut && <Tag tone="warning">too slow, not used</Tag>}
        </>
      }
    >
      <p className="text-[13px] text-foreground">“{search.query}”</p>
      {top ? (
        <p className="text-[13px] text-muted-foreground">
          Top match: {top.text}
        </p>
      ) : (
        !search.timedOut && (
          <p className="text-[13px] text-muted-foreground">Nothing found.</p>
        )
      )}
    </Row>
  );
}

function Timeline({ call, app }: { call: CallRecord; app?: SessionApp }) {
  const entries: Entry[] = [
    ...call.turns.map((turn) => ({
      kind: "turn" as const,
      at: turn.startMs,
      turn
    })),
    ...call.knowledgeSearches.map((search) => ({
      kind: "knowledge" as const,
      at: search.at,
      search
    })),
    ...call.toolCalls.map((tool) => ({
      kind: "tool" as const,
      at: tool.at,
      tool
    }))
  ].sort((a, b) => a.at - b.at);
  const failed = call.status === "failed";
  const AgentIcon = app?.type === "STREAM" ? Code : SmartToy;
  return (
    <ol className="flex flex-col">
      {!failed && (
        <Row
          at={0}
          icon={<PhoneIncoming />}
          title={
            <>
              Call answered
              {call.amd && (
                <>
                  <Tag>AMD</Tag>
                  <Tag>
                    {call.amd.status}
                    {call.amd.confidence !== undefined
                      ? ` ${call.amd.confidence.toFixed(2)}`
                      : ""}
                  </Tag>
                  {call.amd.audioMs !== undefined && (
                    <Tag>{call.amd.audioMs} ms</Tag>
                  )}
                </>
              )}
            </>
          }
        />
      )}
      {entries.map((e, i) =>
        e.kind === "tool" ? (
          <ToolRow key={`tool-${e.at}-${e.tool.name}-${i}`} tool={e.tool} />
        ) : e.kind === "knowledge" ? (
          <KnowledgeRow key={`knowledge-${e.at}-${i}`} search={e.search} />
        ) : (
          <Row
            key={`turn-${e.turn.index}`}
            at={e.at}
            label={`${e.turn.side} turn`}
            icon={e.turn.side === "agent" ? <AgentIcon /> : <User />}
            title={
              <>
                {e.turn.side === "agent" ? "Agent" : "Caller"}
                {e.turn.endMs > e.turn.startMs && (
                  <Tag>
                    {((e.turn.endMs - e.turn.startMs) / 1000).toFixed(1)} s
                  </Tag>
                )}
                {e.turn.firstAudioMs !== undefined && (
                  <Tag>
                    <Timer className="size-3" aria-hidden />
                    first audio {e.turn.firstAudioMs} ms
                  </Tag>
                )}
                {e.turn.outcome === "interrupted" && (
                  <Tag tone="warning">
                    <Scissors className="size-3" aria-hidden />
                    interrupted
                    {e.turn.heardMs !== undefined
                      ? ` at ${clock(e.turn.startMs + e.turn.heardMs)}`
                      : ""}
                  </Tag>
                )}
                {e.turn.outcome === "false_cutoff" && (
                  <Tag tone="warning">false cut-off</Tag>
                )}
                {e.turn.outcome === "abandoned" && <Tag>abandoned</Tag>}
                {e.turn.outcome === "backchannel" && <Tag>backchannel</Tag>}
              </>
            }
          >
            <p className="text-[15px] leading-relaxed text-foreground">
              {e.turn.text}
            </p>
          </Row>
        )
      )}
      {entries.length === 0 && !failed && (
        <li className="py-3 pl-[88px] text-xs text-muted-foreground">
          Nothing was said.
        </li>
      )}
      <Row
        at={call.durationMs}
        icon={<PhoneOff />}
        title={
          <>
            {failed ? "Call failed" : "Call ended"}
            <span className="text-foreground">
              {endedText(
                call.failure?.reason ?? call.endReason,
                call.failure?.sipStatus
              )}
            </span>
          </>
        }
      />
      {entries.length === 0 && failed && (
        <li className="py-3 pl-[88px] text-xs text-muted-foreground">
          Nothing was said.
        </li>
      )}
    </ol>
  );
}

function Panel({
  title,
  aside,
  children
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-medium">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

const STAGE_STYLE: Record<Stage, { label: string; color: string }> = {
  llm: { label: "LLM", color: "bg-foreground" },
  tts: { label: "Text-to-speech", color: "bg-primary" },
  other: { label: "Other", color: "bg-muted-foreground/40" }
};

type Segment = { label: string; ms: number; color: string };

/** One answer's wait, `ms` of `max` wide; split by stage when there are segments to name. */
function StageBar({
  ms,
  max,
  segments
}: {
  ms: number;
  max: number;
  segments?: Segment[];
}) {
  const label = segments?.map((s) => `${s.label} ${s.ms} ms`).join(", ");
  const parts = segments ?? [{ label: "", ms, color: "bg-foreground" }];
  return (
    <span className="h-1.5 rounded-full bg-muted">
      <span
        {...(label ? { role: "img", "aria-label": label, title: label } : {})}
        className="flex h-full overflow-hidden rounded-full"
        style={{ width: `${(ms / max) * 100}%` }}
      >
        {parts.map((s) => (
          <span
            key={s.label}
            className={cn("block h-full", s.color)}
            style={{ width: `${ms ? (s.ms / ms) * 100 : 0}%` }}
          />
        ))}
      </span>
    </span>
  );
}

function ResponseTime({ turns }: { turns: Turn[] }) {
  const times = responseTimes(turns);
  if (!times.length) return null;
  const max = Math.max(...times.map((t) => t.ms), 1);
  const bars = times.map((t) => ({
    ...t,
    segments: t.stages
      ? stageSegments(t.ms, t.stages).map((s) => ({
          ...STAGE_STYLE[s.stage],
          ms: s.ms
        }))
      : undefined
  }));
  const shown = new Set(
    bars.flatMap((t) => t.segments ?? []).map((s) => s.label)
  );
  const legend = Object.values(STAGE_STYLE).filter((s) => shown.has(s.label));
  return (
    <Panel
      title="Response time"
      aside={
        <span className="font-mono text-xs text-muted-foreground">
          p50 {median(times.map((t) => t.ms))} ms
        </span>
      }
    >
      <p className="text-[13px] text-muted-foreground">
        From the caller's last word to the agent's first audio, per turn.
      </p>
      {legend.length > 0 && (
        <ul
          aria-label="Stages"
          className="flex gap-4 text-xs text-muted-foreground"
        >
          {legend.map((stage) => (
            <li key={stage.label} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", stage.color)} />
              {stage.label}
            </li>
          ))}
        </ul>
      )}
      <ol className="flex flex-col gap-3">
        {bars.map((t) => (
          <li key={t.turn} className="flex flex-col gap-1.5">
            <span className="flex justify-between text-[13px]">
              Turn {t.turn}
              <span className="font-mono text-xs">{t.ms} ms</span>
            </span>
            <StageBar ms={t.ms} max={max} segments={t.segments} />
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function Usage({ call }: { call: CallRecord }) {
  if (!call.usage.length) return null;
  return (
    <Panel title="Usage">
      <dl className="flex flex-col gap-2 text-[13px]">
        {call.usage.map((line, i) => {
          const row = usageRow(line);
          return (
            <div key={i} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-mono text-xs">{row.amount}</dd>
            </div>
          );
        })}
      </dl>
    </Panel>
  );
}

function InThisCall({ call }: { call: CallRecord }) {
  if (!call.turns.length && !call.toolCalls.length) return null;
  const agent = call.turns.filter((t) => t.side === "agent").length;
  const caller = call.turns.length - agent;
  const interruptions = call.turns.filter(
    (t) => t.outcome === "interrupted"
  ).length;
  const tools = [...new Set(call.toolCalls.map((t) => t.name))];
  const facts: [string, ReactNode][] = [
    ["Turns", `${agent} agent · ${caller} caller`],
    ["Interruptions", interruptions],
    ["Tools", tools.length ? tools.join(", ") : "None"]
  ];
  return (
    <Panel title="In this call">
      <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-[13px]">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function Breadcrumb({ callRef }: { callRef: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 px-4 pt-7 font-display text-[13px] text-muted-foreground sm:px-8"
    >
      <Link to=".." relative="path" className="hover:text-foreground">
        Calls
      </Link>
      <span aria-hidden>/</span>
      <span className="font-mono text-foreground">{callRef}</span>
    </nav>
  );
}

export function CallRecordView() {
  const { callRef = "" } = useParams();
  const { data: region, isPrivate } = useRegion();
  const offline = isPrivate && region?.status === "offline";
  const {
    data: call,
    loading,
    error
  } = useSessionQuery(["calls", callRef], (api) => api.getCall(callRef));
  const { data: apps } = useSessionQuery(["apps"], (api) => api.listApps());
  const back = (
    <Button asChild variant="ghost">
      <Link to=".." relative="path">
        All calls
      </Link>
    </Button>
  );
  if (loading) return <p className="p-8">Loading…</p>;
  if (error)
    return (
      <Alert variant="error" className="m-8">
        {error}
      </Alert>
    );
  if (call === "erased")
    return (
      <>
        <PageHeader title="Call record erased" actions={back} />
        <p className="px-4 text-sm text-muted-foreground sm:px-8">
          This call's record was erased. Its details, transcript and recording
          are gone.
        </p>
      </>
    );
  if (!call)
    return (
      <>
        <PageHeader title="Call record not found" actions={back} />
        <p className="px-4 text-sm text-muted-foreground sm:px-8">
          This workspace has no record of call {callRef}.
        </p>
      </>
    );
  const app = apps?.find((a) => a.ref === call.appRef);
  const { customer, fonosterNumber } = recordParties(call);
  const direction = recordDirection(call.direction);
  const failed = call.status === "failed";

  return (
    <>
      <Breadcrumb callRef={call.callRef} />
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 pb-5 pt-3 sm:px-8">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <DirectionIcon direction={direction} className="size-5" />
            <h1 className="text-[22px] font-semibold leading-tight">
              <span className="font-mono">{customer}</span>
              {app && (
                <>
                  {" "}
                  <span className="mx-1 text-[15px] font-normal text-muted-foreground">
                    with
                  </span>{" "}
                  {app.name}
                </>
              )}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip>{direction[0].toUpperCase() + direction.slice(1)}</Chip>
            <Chip>{formatStarted(call.startedAt)}</Chip>
            {!failed && (
              <Chip>
                <span className="font-mono">{clock(call.durationMs)}</span>
              </Chip>
            )}
            <Chip>
              <StatusWord
                call={{ ...call, failureReason: call.failure?.reason }}
              />
            </Chip>
            {answeredByWord(call.amd?.status) && (
              <Chip>
                Answered by {answeredByWord(call.amd?.status)!.toLowerCase()}
              </Chip>
            )}
            {fonosterNumber && (
              <Chip>
                via {fonosterNumber}
                {call.trunkName && <> · Trunk {call.trunkName}</>}
              </Chip>
            )}
            {isPrivate && !offline && <Chip>Stored in your region</Chip>}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            download(
              `${call.callRef}.vcon.json`,
              JSON.stringify(call.vcon, null, 2),
              "application/json"
            )
          }
        >
          Export JSON
        </Button>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-10 sm:px-8">
        {call.unfiltered?.map((u, i) => (
          <Alert key={i} variant="warning">
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Unfiltered</Badge>
              <span>
                {u.name ? `${u.name}: ` : ""}
                {u.reason}
              </span>
            </span>
          </Alert>
        ))}
        {offline && (
          <Alert variant="error">
            Your region is offline. Only call details are shown.
          </Alert>
        )}
        {call.warnings
          .filter((w) => !(w === "Missing: recording" && !call.recording))
          .map((w) => (
            <Alert key={w} variant="warning">
              {w}
            </Alert>
          ))}

        {!offline && (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card">
              <section
                aria-label="Recording"
                className="border-b border-border px-5 py-4"
              >
                {call.recording ? (
                  <Recording call={call} />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This call wasn't recorded.
                  </p>
                )}
              </section>
              <Tabs defaultValue="transcript" className="flex flex-col">
                <TabsList className="mx-5 mt-1 h-auto gap-5 self-stretch rounded-none border-b border-border bg-transparent p-0">
                  <TabsTrigger value="transcript" className={tab}>
                    Transcript
                  </TabsTrigger>
                  <TabsTrigger value="events" className={tab}>
                    Events
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="transcript" className="px-5 pb-3 pt-2">
                  <section aria-label="Transcript">
                    {call.redacted && call.turns.length > 0 && (
                      <p className="pt-2 text-xs text-muted-foreground">
                        Personal data in the transcript is masked.
                      </p>
                    )}
                    <Timeline call={call} app={app} />
                  </section>
                </TabsContent>
                <TabsContent value="events" className="px-5 pb-4 pt-2">
                  {call.messages.length === 0 ? (
                    <p className="py-3 text-xs text-muted-foreground">
                      No turn decisions or notes were recorded.
                    </p>
                  ) : (
                    <ol
                      aria-label="Events"
                      className="flex flex-col font-mono text-xs"
                    >
                      {call.messages.map((m, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 border-b border-border py-1.5 last:border-0"
                        >
                          <span className="w-12 shrink-0 text-muted-foreground">
                            {clock(m.at)}
                          </span>
                          <Badge variant={SOURCE_BADGE[m.source]}>
                            {m.source}
                          </Badge>
                          <span className="break-all">
                            {describeMessage(m.message)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {call.recording?.sha256 && (
                    <p className="break-all pt-3 text-xs text-muted-foreground">
                      Recording hash {call.recording.sha256}
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            <aside className="flex flex-col gap-4">
              <ResponseTime turns={call.turns} />
              <Usage call={call} />
              <InThisCall call={call} />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
