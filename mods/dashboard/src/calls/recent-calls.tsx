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
import type { CallDetailRecord, INumber } from "@fonoster/types";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "~/components/data/data-table";
import { Select } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { formatNumber } from "~/lib/format";
import { useWorkspace } from "~/lib/workspace";
import { useCallsForNumbers } from "./calls.service";
import {
  DIRECTION_LABEL,
  RANGES,
  STATUS_FILTERS,
  answeredBy,
  callDirection,
  callParties,
  formatDuration,
  formatStarted
} from "./format";
import { DirectionIcon, StatusDot } from "./parts";

const ALL = "all";
const filterClass = "h-8 w-auto gap-2 rounded-control px-3 text-[13px]";

/**
 * The calls on an app's numbers, filtered by range, direction, number and status, each
 * linking to the call. Used where the designs show "calls this agent handled", which the
 * API can't answer yet: calls to or from the numbers routed to it now.
 */
export function RecentCalls({
  numbers,
  loadingNumbers,
  label,
  noNumbers
}: {
  numbers: INumber[];
  loadingNumbers?: boolean;
  label: string;
  /** What to say when nothing is routed to the app. */
  noNumbers: string;
}) {
  const navigate = useNavigate();
  const base = `/w/${useWorkspace().ref}/calls`;
  const [range, setRange] = useState("7");
  const [direction, setDirection] = useState(ALL);
  const [number, setNumber] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const telUrls = numbers
    .map((n) => n.telUrl)
    .filter((t) => number === ALL || t === number);
  const calls = useCallsForNumbers(telUrls, {
    range,
    status: status === ALL ? "" : status
  });
  const rows = useMemo(
    () =>
      (calls.data ?? []).filter(
        (c) => direction === ALL || callDirection(c.direction) === direction
      ),
    [calls.data, direction]
  );

  if (loadingNumbers) return <Skeleton className="h-24 w-full" />;
  if (numbers.length === 0) {
    return <p className="text-xs text-muted-foreground">{noNumbers}</p>;
  }

  const columns: Column<CallDetailRecord>[] = [
    {
      header: "Started",
      className: "w-36 whitespace-nowrap",
      cell: (c) => (
        <span className="text-muted-foreground">
          {formatStarted(c.startedAt)}
        </span>
      )
    },
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
      header: "Agent's number",
      className: "w-44",
      cell: (c) => (
        <span className="whitespace-nowrap font-mono text-muted-foreground">
          {callParties(c).fonosterNumber}
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
      header: "Status",
      className: "w-36",
      cell: (c) => <StatusDot status={c.status} />
    },
    {
      header: "Answered by",
      className: "w-32",
      cell: (c) => (
        <span className="text-muted-foreground">
          {answeredBy(c.amdStatus) ?? "—"}
        </span>
      )
    },
    {
      header: "",
      className: "w-12",
      cell: () => (
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      )
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Range"
          className={filterClass}
          value={range}
          options={RANGES}
          onValueChange={setRange}
        />
        <Select
          aria-label="Direction"
          className={filterClass}
          value={direction}
          options={[
            { value: ALL, label: "All directions" },
            { value: "inbound", label: DIRECTION_LABEL.inbound },
            { value: "outbound", label: DIRECTION_LABEL.outbound }
          ]}
          onValueChange={setDirection}
        />
        <Select
          aria-label="Number"
          className={filterClass}
          value={number}
          options={[
            { value: ALL, label: "All numbers" },
            ...numbers.map((n) => ({
              value: n.telUrl,
              label: formatNumber(n.telUrl)
            }))
          ]}
          onValueChange={setNumber}
        />
        <Select
          aria-label="Status"
          className={filterClass}
          value={status}
          options={[{ value: ALL, label: "Any status" }, ...STATUS_FILTERS]}
          onValueChange={setStatus}
        />
        {!calls.isPending && (
          <span className="ml-auto text-[13px] text-muted-foreground">
            {rows.length.toLocaleString("en-US")}{" "}
            {rows.length === 1 ? "call" : "calls"}
          </span>
        )}
      </div>
      <DataTable
        label={label}
        columns={columns}
        rows={rows}
        rowKey={(c) => c.ref}
        onRowClick={(c) => navigate(`${base}/${c.ref}`)}
        loading={calls.isPending}
        error={calls.error}
        onRetry={() => void calls.refetch()}
        empty={
          <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            No calls on these numbers match the filters.
          </p>
        }
      />
    </div>
  );
}
