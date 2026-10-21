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
import { RANGES, formatStarted, rangeStart } from "~/calls/format";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PhoneCall } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "~/app/shell/page";
import {
  DataTable,
  MutedCell,
  NameCell,
  type Column
} from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Select } from "~/components/ui/select";
import { useRegion } from "~/regions";
import {
  errorMessage,
  useSessionApi,
  useSessionKey,
  useSessionQuery
} from "./api";
import type { CallRecordSummary, SessionMessage, Turn } from "./types";

export function formatMs(ms: number): string {
  const s = ms / 1000;
  return s < 60
    ? `${s.toFixed(1)} s`
    : `${Math.floor(s / 60)} m ${Math.round(s % 60)} s`;
}

const OUTCOME: Record<
  NonNullable<Turn["outcome"]>,
  { label: string; variant: "success" | "warning" | "neutral" }
> = {
  ok: { label: "turn ended", variant: "success" },
  false_cutoff: { label: "false cut-off", variant: "warning" },
  abandoned: { label: "abandoned", variant: "neutral" },
  backchannel: { label: "backchannel", variant: "neutral" },
  interrupted: { label: "interrupted", variant: "warning" }
};

const SOURCE_BADGE = {
  app: "info",
  appbridge: "neutral",
  event: "success"
} as const;

const STATUS_BADGE: Record<string, "success" | "warning" | "error"> = {
  completed: "success",
  incomplete: "warning",
  failed: "error",
  erased: "warning"
};

/** One-line description of a session message for the timeline. */
export function describeMessage(m: SessionMessage["message"]): string {
  const { type, ...rest } = m;
  const text = typeof rest.text === "string" ? rest.text : undefined;
  if (text) return `${type}: ${text}`;
  if (typeof rest.reason === "string") return `${type}: ${rest.reason}`;
  return type;
}

/** List dates read like the rest of the dashboard ("Today 14:31", "Oct 2"). */
const when = (iso?: string) => formatStarted(iso);

const ANY = "any";
const filterClass = "h-8 w-auto gap-2 rounded-control px-3 text-[13px]";
const STATUSES = [
  { value: ANY, label: "Any status" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "incomplete", label: "Incomplete" }
];
const PERIODS = [...RANGES, { value: ANY, label: "All time" }];

export function CallRecordsList() {
  const navigate = useNavigate();
  const api = useSessionApi();
  const [status, setStatus] = useState(ANY);
  const [period, setPeriod] = useState("30");
  const calls = useInfiniteQuery({
    queryKey: [...useSessionKey(), "calls", "list", status, period],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      api.listCalls({
        ...(status !== ANY ? { status } : {}),
        ...(period !== ANY ? { after: rangeStart(period) } : {}),
        ...(pageParam ? { pageToken: pageParam } : {})
      }),
    getNextPageParam: (page) => page.nextPageToken
  });
  const rows = calls.data?.pages.flatMap((page) => page.items) ?? [];
  const filtered = status !== ANY || period !== ANY;
  const columns: Column<CallRecordSummary>[] = [
    {
      header: "Call",
      cell: (c) => (
        <NameCell mono name={`${c.from} → ${c.to}`} sub={c.callRef} />
      )
    },
    {
      header: "Started",
      className: "w-48",
      cell: (c) => <MutedCell>{when(c.startedAt)}</MutedCell>
    },
    {
      header: "Duration",
      className: "w-24",
      cell: (c) => <MutedCell>{formatMs(c.durationMs)}</MutedCell>
    },
    {
      header: "Direction",
      className: "w-24",
      cell: (c) => <MutedCell>{c.direction}</MutedCell>
    },
    {
      header: "Status",
      className: "w-28",
      cell: (c) => (
        <Badge variant={STATUS_BADGE[c.status] ?? "neutral"}>{c.status}</Badge>
      )
    }
  ];
  return (
    <>
      <PageHeader
        title="Calls"
        description="Every call's record: who called, what was said and how each turn was decided."
      />
      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Status"
            className={filterClass}
            value={status}
            options={STATUSES}
            onValueChange={setStatus}
          />
          <Select
            aria-label="Period"
            className={filterClass}
            value={period}
            options={PERIODS}
            onValueChange={setPeriod}
          />
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

/** How a call ended, in words (the record's end reason or failure reason). */
const ENDED: Record<string, string> = {
  caller_hangup: "The caller hung up",
  app_hangup: "The app hung up",
  agent_hangup: "The agent hung up",
  busy: "The line was busy",
  no_answer: "No one answered",
  rejected: "The call was rejected",
  app_unreachable: "The app couldn't be reached",
  no_app: "No app was set for the number",
  node_error: "The media node failed",
  max_duration: "It reached the maximum call length",
  transferred: "It was transferred"
};
const ended = (reason?: string) =>
  reason ? (ENDED[reason] ?? reason.replace(/_/g, " ")) : "Unknown";

/** A recording fetched with the access token, played and downloaded from an object URL. */
function Recording({ callRef }: { callRef: string }) {
  const api = useSessionApi();
  const [state, setState] = useState<{ url?: string; error?: string }>({});
  useEffect(() => {
    let url: string | undefined;
    let live = true;
    api
      .recordingUrl(callRef)
      .then((u) => {
        url = u;
        if (live) setState({ url: u });
      })
      .catch((e) => live && setState({ error: errorMessage(e) }));
    return () => {
      live = false;
      if (url?.startsWith("blob:")) URL.revokeObjectURL?.(url);
    };
  }, [api, callRef]);
  if (state.error)
    return (
      <Alert variant="error">
        The recording couldn't be loaded: {state.error}
      </Alert>
    );
  if (!state.url)
    return (
      <p className="text-xs text-muted-foreground">Loading the recording…</p>
    );
  return (
    <div className="flex flex-wrap items-center gap-3">
      <audio
        controls
        src={state.url}
        aria-label="Call recording"
        className="h-9"
      />
      <Button asChild variant="outline" size="sm">
        <a href={state.url} download={`${callRef}.wav`}>
          Download
        </a>
      </Button>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-display text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
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
  // A browser test call is recorded to the agent's ref (#1060): show its name.
  const callee = app && call.to === app.ref ? app.name : call.to;
  return (
    <>
      <PageHeader
        title={`${call.from || "Unknown"} → ${callee || "Unknown"}`}
        description={call.callRef}
        actions={back}
      />
      <div className="flex flex-col gap-5 px-4 pb-10 sm:px-8">
        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 sm:grid-cols-3 lg:grid-cols-6">
          <Fact label="Direction">{call.direction || "Unknown"}</Fact>
          <Fact label="Started">{when(call.startedAt)}</Fact>
          <Fact label="Duration">{formatMs(call.durationMs)}</Fact>
          <Fact label="Answered by">
            {app ? app.name : call.appRef || "No app"}
          </Fact>
          <Fact label="Ended">
            {ended(call.failure?.reason ?? call.endReason)}
            {call.failure?.sipStatus ? ` (SIP ${call.failure.sipStatus})` : ""}
          </Fact>
          <Fact label="Status">
            <Badge variant={STATUS_BADGE[call.status] ?? "neutral"}>
              {call.status}
            </Badge>
          </Fact>
        </dl>
        {isPrivate && !offline && (
          <Badge variant="info" className="self-start">
            Stored in your region
          </Badge>
        )}
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
          <>
            <section aria-label="Recording" className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">Recording</h2>
              {call.recording ? (
                <Recording callRef={call.callRef} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  This call wasn't recorded.
                </p>
              )}
            </section>

            <section aria-label="Transcript" className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">Transcript</h2>
              {call.redacted && call.turns.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Personal data in the transcript is masked.
                </p>
              )}
              {call.turns.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nothing was said.
                </p>
              )}
              <ol className="flex flex-col gap-2">
                {call.turns.map((t) => (
                  <li
                    key={t.index}
                    aria-label={`${t.side} turn`}
                    className={`flex gap-3 rounded-xl border border-border p-3 ${t.side === "agent" ? "bg-card" : ""}`}
                  >
                    <span className="flex w-28 shrink-0 flex-col text-xs text-muted-foreground">
                      <span className="capitalize text-foreground">
                        {t.side}
                      </span>
                      <span>
                        {formatMs(t.startMs)}
                        {t.endMs > t.startMs
                          ? ` · ${formatMs(t.endMs - t.startMs)}`
                          : ""}
                      </span>
                    </span>
                    <span className="flex-1">{t.text}</span>
                    {t.outcome && t.outcome !== "ok" && (
                      <Badge variant={OUTCOME[t.outcome].variant}>
                        {OUTCOME[t.outcome].label}
                      </Badge>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            {call.messages.length > 0 && (
              <details className="flex flex-col gap-2">
                <summary className="cursor-pointer text-sm font-medium">
                  Turn decisions and notes
                </summary>
                <ol className="mt-2 flex flex-col font-mono text-xs">
                  {call.messages.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 border-b border-border py-1.5"
                    >
                      <span className="w-16 shrink-0 text-muted-foreground">
                        {formatMs(m.at)}
                      </span>
                      <Badge variant={SOURCE_BADGE[m.source]}>{m.source}</Badge>
                      <span>{describeMessage(m.message)}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}
            {call.recording?.sha256 && (
              <p className="break-all text-xs text-muted-foreground">
                Recording hash {call.recording.sha256}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
