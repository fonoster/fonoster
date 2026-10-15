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
import { Link, useParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useAsync, useSessionApi } from "./api";
import type { SessionMessage, Turn } from "./types";

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
  backchannel: { label: "backchannel", variant: "neutral" }
};

const SOURCE_BADGE = {
  app: "info",
  gateway: "neutral",
  event: "success"
} as const;

/** One-line description of a session message for the timeline. */
export function describeMessage(m: SessionMessage["message"]): string {
  const { type, ...rest } = m;
  const text = typeof rest.text === "string" ? rest.text : undefined;
  if (text) return `${type}: ${text}`;
  if (typeof rest.reason === "string") return `${type}: ${rest.reason}`;
  return type;
}

export function CallRecordsList() {
  const api = useSessionApi();
  const { data, loading } = useAsync(() => api.listCalls(), [api]);
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="font-display text-lg font-medium">
        Call records (preview)
      </h1>
      {loading && <p>Loading…</p>}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th>Call</th>
            <th>App</th>
            <th>From</th>
            <th>To</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((c) => (
            <tr key={c.callRef}>
              <td>
                <Link className="underline" to={c.callRef}>
                  {c.callRef}
                </Link>
              </td>
              <td>{c.appRef}</td>
              <td>{c.from}</td>
              <td>{c.to}</td>
              <td>{formatMs(c.durationMs)}</td>
              <td>
                <Badge variant={c.status === "sealed" ? "success" : "warning"}>
                  {c.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CallRecordView() {
  const { callRef = "" } = useParams();
  const api = useSessionApi();
  const { data: call, loading } = useAsync(
    () => api.getCall(callRef),
    [api, callRef]
  );
  if (loading) return <p className="p-6">Loading…</p>;
  if (!call) return <Alert variant="error">Call record not found</Alert>;
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-medium">
            Call {call.callRef}
          </h1>
          <p className="text-xs text-muted-foreground">
            {call.from} to {call.to} · {call.direction} · app {call.appRef} ·{" "}
            {formatMs(call.durationMs)} · ended: {call.endReason} · version{" "}
            {call.version}
          </p>
        </div>
        {call.recording ? (
          <Button asChild variant="outline">
            <a href={call.recording.url} download>
              Download recording
            </a>
          </Button>
        ) : (
          <Badge>No recording</Badge>
        )}
      </div>
      {call.warnings.map((w) => (
        <Alert key={w} variant="warning">
          {w}
        </Alert>
      ))}

      <section aria-label="Turns" className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Turns</h2>
        <ol className="flex flex-col gap-2">
          {call.turns.map((t) => (
            <li
              key={t.index}
              className={`flex gap-3 rounded-xl border border-border p-3 ${t.side === "agent" ? "bg-card" : ""}`}
            >
              <span className="w-16 shrink-0 text-xs text-muted-foreground">
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

      <section aria-label="Session messages" className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Session messages</h2>
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
      {call.recording && (
        <p className="text-xs text-muted-foreground">
          Recording sha256 {call.recording.sha256} ·{" "}
          {Math.round(call.recording.sizeBytes / 1024)} KB
        </p>
      )}
    </div>
  );
}
