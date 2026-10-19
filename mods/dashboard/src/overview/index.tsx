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
import type { CallDetailRecord } from "@fonoster/types";
import { ArrowRight, PhoneCall, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CreateAgentDialog } from "~/agents/create-agent-dialog";
import { Panel } from "~/agents/parts";
import { DataTable, type Column } from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { PageHeader } from "~/app/shell/page";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  callParties,
  formatDuration,
  formatStarted,
  type Tone
} from "~/calls/format";
import { DirectionIcon, StatusDot } from "~/calls/parts";
import { errorMessage } from "~/lib/errors";
import { cn } from "~/lib/utils";
import { useWorkspace } from "~/lib/workspace";
import { MAX_CALLS, useRangeCalls } from "./overview.service";
import { RANGES, callStats, type Bucket, type Range } from "./stats";

const RANGE_TITLE: Record<Range, string> = {
  today: "today",
  "7d": "last 7 days",
  "30d": "last 30 days"
};

const COUNT = new Intl.NumberFormat("en-US");

function useRange(): [Range, (range: Range) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get("range");
  const range = RANGES.some((r) => r.value === value) ? (value as Range) : "7d";
  return [
    range,
    (next) => setParams(next === "7d" ? {} : { range: next }, { replace: true })
  ];
}

function RangePicker({
  value,
  onChange
}: {
  value: Range;
  onChange: (range: Range) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Range"
      className="inline-flex items-center gap-1 rounded-control bg-muted p-1"
    >
      {RANGES.map((range) => (
        <button
          key={range.value}
          type="button"
          role="radio"
          aria-checked={value === range.value}
          onClick={() => onChange(range.value)}
          className={cn(
            "cursor-pointer rounded-[6px] px-3 py-1.5 font-mono text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === range.value && "bg-background text-foreground"
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4">
      <dt className="font-display text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-2xl">{value}</dd>
    </div>
  );
}

const INBOUND = "bg-foreground/80";
const OUTBOUND = "bg-muted-foreground/45";

function VolumeChart({ volume }: { volume: Bucket[] }) {
  const peak = Math.max(1, ...volume.map((b) => b.inbound + b.outbound));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-44 items-end gap-[2px]" aria-hidden>
        {volume.map((bucket) => {
          const total = bucket.inbound + bucket.outbound;
          return (
            <div
              key={bucket.label}
              title={`${bucket.label}: ${bucket.inbound} inbound, ${bucket.outbound} outbound`}
              className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-[2px] rounded-t-[4px] hover:bg-muted/60"
            >
              {bucket.outbound > 0 && (
                <div
                  className={cn("rounded-t-[4px]", OUTBOUND)}
                  style={{ height: `${(bucket.outbound / peak) * 100}%` }}
                />
              )}
              {bucket.inbound > 0 && (
                <div
                  className={cn(
                    bucket.outbound === 0 && "rounded-t-[4px]",
                    INBOUND
                  )}
                  style={{ height: `${(bucket.inbound / peak) * 100}%` }}
                />
              )}
              {total === 0 && <div className="h-px bg-border" />}
            </div>
          );
        })}
      </div>
      <div
        className="flex justify-between font-mono text-[11px] text-muted-foreground"
        aria-hidden
      >
        <span>{volume[0]?.label}</span>
        <span>{volume[volume.length - 1]?.label}</span>
      </div>
      <div
        className="flex gap-4 font-display text-xs text-muted-foreground"
        aria-hidden
      >
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-[2px]", INBOUND)} /> Inbound
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-[2px]", OUTBOUND)} /> Outbound
        </span>
      </div>
      {/* sr-only on a wrapper: a table ignores height: 1px and would stretch the page. */}
      <div className="sr-only">
        <table>
          <caption>Calls per period</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Inbound</th>
              <th scope="col">Outbound</th>
            </tr>
          </thead>
          <tbody>
            {volume.map((bucket) => (
              <tr key={bucket.label}>
                <th scope="row">{bucket.label}</th>
                <td>{bucket.inbound}</td>
                <td>{bucket.outbound}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const BAR: Record<Tone, string> = {
  success: "bg-foreground/80",
  muted: "bg-muted-foreground/60",
  warning: "bg-warning-foreground",
  error: "bg-destructive"
};

function Reasons({
  reasons
}: {
  reasons: ReturnType<typeof callStats>["reasons"];
}) {
  return (
    <ul className="flex flex-col gap-4">
      {reasons.map((reason) => (
        <li key={reason.label} className="flex flex-col gap-2">
          <div className="flex justify-between font-display text-[13px]">
            <span>{reason.label}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {Math.round(reason.share * 100)}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-muted">
            <div
              className={cn("h-1 rounded-full", BAR[reason.tone as Tone])}
              style={{ width: `${Math.max(2, reason.share * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function OverviewScreen() {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const [range, setRange] = useRange();
  const [creating, setCreating] = useState(false);
  const query = useRangeCalls(range);
  const callsBase = `/w/${workspace.ref}/calls`;

  const calls = query.data?.items ?? [];
  const stats = callStats(calls, range);
  const plus = query.data?.capped ? "+" : "";

  const columns: Column<CallDetailRecord>[] = [
    {
      header: "Customer",
      cell: (c) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <DirectionIcon direction={c.direction} />
          <span className="font-mono">{callParties(c).customer}</span>
        </span>
      )
    },
    {
      header: "Ended reason",
      className: "w-36",
      cell: (c) => (
        <span className="font-display">
          <StatusDot status={c.status} />
        </span>
      )
    },
    {
      header: "Duration",
      className: "w-24",
      cell: (c) => (
        <span className="font-mono">{formatDuration(c.duration)}</span>
      )
    },
    {
      header: "Started",
      className: "w-36 whitespace-nowrap",
      cell: (c) => (
        <span className="font-display text-muted-foreground">
          {formatStarted(c.startedAt)}
        </span>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Calls in ${workspace.name}, ${RANGE_TITLE[range]}.`}
        actions={
          <>
            <RangePicker value={range} onChange={setRange} />
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden /> Create agent
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-5 px-4 pb-8 sm:px-8">
        {query.error ? (
          <Alert variant="error">
            {errorMessage(query.error)}{" "}
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={() => void query.refetch()}
            >
              Try again
            </button>
          </Alert>
        ) : query.isPending ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[88px] rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-72 rounded-xl" />
          </>
        ) : (
          <>
            <dl
              aria-label="Totals"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <Stat label="Calls" value={COUNT.format(stats.calls) + plus} />
              <Stat
                label="Minutes"
                value={COUNT.format(stats.minutes) + plus}
              />
              <Stat
                label="Completed"
                value={
                  stats.answerRate === undefined
                    ? "—"
                    : `${Math.round(stats.answerRate * 100)}%`
                }
              />
              <Stat
                label="Avg call length"
                value={formatDuration(stats.averageDuration)}
              />
            </dl>
            {query.data?.capped && (
              <p className="font-display text-xs text-muted-foreground">
                Totals and charts cover the latest {COUNT.format(MAX_CALLS)}{" "}
                calls in this range.
              </p>
            )}
            {stats.calls === 0 ? (
              <EmptyState
                icon={PhoneCall}
                title={`No calls ${RANGE_TITLE[range]}`}
                description="Point a number at an agent or stream and its calls show up here."
                action={
                  <Button asChild variant="outline">
                    <Link to={`/w/${workspace.ref}/numbers`}>
                      Route a number
                    </Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                  <Panel
                    title="Call volume"
                    action={
                      <span className="font-mono text-[11px] text-muted-foreground">
                        Inbound / Outbound ·{" "}
                        {RANGES.find((r) => r.value === range)?.label}
                      </span>
                    }
                  >
                    <VolumeChart volume={stats.volume} />
                  </Panel>
                  <Panel title="Ended reasons">
                    <Reasons reasons={stats.reasons} />
                  </Panel>
                </div>
                <Panel
                  title="Recent calls"
                  action={
                    <Link
                      to={callsBase}
                      className="flex items-center gap-1 font-display text-xs text-muted-foreground hover:text-foreground"
                    >
                      View all <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  }
                >
                  <DataTable
                    label="Recent calls"
                    columns={columns}
                    rows={calls.slice(0, 5)}
                    rowKey={(c) => c.ref}
                    onRowClick={(c) => navigate(`${callsBase}/${c.ref}`)}
                  />
                </Panel>
              </>
            )}
          </>
        )}
      </div>
      <CreateAgentDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}
