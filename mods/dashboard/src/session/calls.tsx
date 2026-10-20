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
import { formatStarted } from "~/calls/format";
import { PhoneCall } from "lucide-react";
import { useState } from "react";
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
import { useRegion } from "~/regions";
import { errorMessage, useSessionApi, useSessionQuery } from "./api";
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

export function CallRecordsList() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useSessionQuery(["calls"], (api) =>
    api.listCalls()
  );
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
      <div className="px-4 pb-8 sm:px-8">
        <DataTable
          label="Calls"
          columns={columns}
          rows={data ?? []}
          rowKey={(c) => c.callRef}
          onRowClick={(c) => navigate(c.callRef)}
          loading={loading}
          error={error}
          onRetry={reload}
          empty={
            <EmptyState
              icon={PhoneCall}
              title="No calls yet"
              description="Records appear here when calls end and their records are sealed."
            />
          }
        />
      </div>
    </>
  );
}

export function CallRecordView() {
  const { callRef = "" } = useParams();
  const api = useSessionApi();
  const [download, setDownload] = useState<{ url?: string; error?: string }>(
    {}
  );
  const { data: region, isPrivate } = useRegion();
  const offline = isPrivate && region?.status === "offline";
  const {
    data: call,
    loading,
    error
  } = useSessionQuery(["calls", callRef], (api) => api.getCall(callRef));
  if (loading) return <p className="p-8">Loading…</p>;
  if (error)
    return (
      <Alert variant="error" className="m-8">
        {error}
      </Alert>
    );
  if (!call)
    return (
      <Alert variant="error" className="m-8">
        Call record not found
      </Alert>
    );
  const fetchRecording = async () => {
    try {
      setDownload({ url: await api.recordingUrl(call.callRef) });
    } catch (e) {
      setDownload({ error: errorMessage(e) });
    }
  };
  return (
    <>
      <PageHeader
        title={`Call ${call.callRef}`}
        description={`${call.from} to ${call.to} · ${call.direction} · app ${call.appRef || "none"} · ${formatMs(call.durationMs)} · ended: ${call.endReason || "unknown"} · version ${call.version}`}
        actions={
          <>
            <Button asChild variant="ghost">
              <Link to=".." relative="path">
                All calls
              </Link>
            </Button>
            {offline ? null : call.recording ? (
              download.url ? (
                <Button asChild variant="outline">
                  <a href={download.url} download={`${call.callRef}.wav`}>
                    Save recording
                  </a>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => void fetchRecording()}>
                  Download recording
                </Button>
              )
            ) : (
              <Badge>No recording</Badge>
            )}
          </>
        }
      />
      <div className="flex flex-col gap-5 px-4 pb-10 sm:px-8">
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
        {download.error && <Alert variant="error">{download.error}</Alert>}
        {call.redacted && (
          <Alert variant="note">
            Redacted copy: personal data in the transcript is masked.
          </Alert>
        )}
        {call.warnings.map((w) => (
          <Alert key={w} variant="warning">
            {w}
          </Alert>
        ))}

        {!offline && (
          <>
            <section aria-label="Turns" className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">Turns</h2>
              {call.turns.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nothing was said.
                </p>
              )}
              <ol className="flex flex-col gap-2">
                {call.turns.map((t) => (
                  <li
                    key={t.index}
                    className={`flex gap-3 rounded-xl border border-border p-3 ${t.side === "agent" ? "bg-card" : ""}`}
                  >
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">
                      {t.side} {formatMs(t.startMs)}
                    </span>
                    <span className="flex-1">{t.text}</span>
                    {t.outcome && (
                      <Badge variant={OUTCOME[t.outcome].variant}>
                        {OUTCOME[t.outcome].label}
                      </Badge>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            <section
              aria-label="Turn decisions"
              className="flex flex-col gap-2"
            >
              <h2 className="text-sm font-medium">Turn decisions and notes</h2>
              <ol className="flex flex-col font-mono text-xs">
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
            </section>
            {call.recording?.sha256 && (
              <p className="text-xs text-muted-foreground">
                Recording {call.recording.sha256}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
