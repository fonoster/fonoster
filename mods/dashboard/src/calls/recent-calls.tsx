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
import type { INumber } from "@fonoster/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "~/components/data/data-table";
import { Select } from "~/components/ui/select";
import { formatNumber } from "~/lib/format";
import { cn } from "~/lib/utils";
import { useWorkspace } from "~/lib/workspace";
import { errorMessage, useSessionApi, useSessionKey } from "~/session/api";
import type { CallRecordSummary } from "~/session/types";
import { DIRECTION_LABEL, RANGES, formatStarted, rangeStart } from "./format";
import { DirectionIcon, TONE_DOT } from "./parts";
import {
  answeredByWord,
  callCount,
  clock,
  recordDirection,
  recordParties,
  recordStatus
} from "./records";

const ALL = "all";
const filterClass = "h-8 w-auto gap-2 rounded-control px-3 text-[13px]";
const STATUSES = [
  { value: ALL, label: "Any status" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "incomplete", label: "Incomplete" }
];
const DIRECTIONS = [
  { value: ALL, label: "All directions" },
  { value: "inbound", label: DIRECTION_LABEL.inbound },
  { value: "outbound", label: DIRECTION_LABEL.outbound }
];

/** The next page: where the last one ended, and the range's start the first one used. */
type PageParam = { pageToken: string; after: string };

/** The workspace's own number on a call, as the API matches it (empty for a browser call). */
function ownNumber(call: CallRecordSummary): string {
  if (!recordParties(call).fonosterNumber) return "";
  return recordDirection(call.direction) === "outbound" ? call.from : call.to;
}

/**
 * The calls this app handled (by appRef), filtered by range, direction, number and status, a
 * page at a time.
 */
export function RecentCalls({
  appRef,
  numbers,
  label
}: {
  appRef: string;
  /** The numbers routed to the app now, offered first in the Number filter. */
  numbers: INumber[];
  label: string;
}) {
  const navigate = useNavigate();
  const api = useSessionApi();
  const base = `/w/${useWorkspace().ref}/calls`;
  const [range, setRange] = useState("7");
  const [direction, setDirection] = useState(ALL);
  const [number, setNumber] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const calls = useInfiniteQuery({
    queryKey: [
      ...useSessionKey(),
      "calls",
      "app",
      appRef,
      range,
      direction,
      number,
      status
    ],
    initialPageParam: undefined as PageParam | undefined,
    // Later pages keep the first page's start, so they page through the calls it counted.
    queryFn: async ({ pageParam }) => {
      const after = pageParam ? pageParam.after : rangeStart(range);
      const page = await api.listCalls({
        appRef,
        after,
        ...(direction !== ALL ? { direction } : {}),
        ...(number !== ALL ? { number } : {}),
        ...(status !== ALL ? { status } : {}),
        ...(pageParam ? { pageToken: pageParam.pageToken } : {})
      });
      return { ...page, after };
    },
    getNextPageParam: (page): PageParam | undefined =>
      page.nextPageToken
        ? { pageToken: page.nextPageToken, after: page.after }
        : undefined
  });
  const rows = calls.data?.pages.flatMap((page) => page.items) ?? [];
  const count = callCount(
    rows.length,
    calls.hasNextPage,
    calls.data?.pages[0]?.total
  );
  const filtered = direction !== ALL || number !== ALL || status !== ALL;
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "";

  const numberValues = numbers.map((n) => n.telUrl.replace(/^tel:/, ""));
  for (const value of [...rows.map(ownNumber), number])
    if (value && value !== ALL && !numberValues.includes(value))
      numberValues.push(value);

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
    {
      header: "Customer",
      cell: (c) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <DirectionIcon direction={recordDirection(c.direction)} />
          <span className="font-mono">{recordParties(c).customer}</span>
        </span>
      )
    },
    {
      header: "Agent's number",
      className: "w-44",
      cell: (c) => (
        <span className="whitespace-nowrap font-mono text-muted-foreground">
          {recordParties(c).fonosterNumber || "—"}
        </span>
      )
    },
    {
      header: "Duration",
      className: "w-24",
      cell: (c) => (
        <span className="font-mono">
          {c.status === "failed" || !c.durationMs ? "—" : clock(c.durationMs)}
        </span>
      )
    },
    {
      header: "Status",
      className: "w-36",
      cell: (c) => {
        const { label, tone } = recordStatus(c);
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
          options={DIRECTIONS}
          onValueChange={setDirection}
        />
        <Select
          aria-label="Number"
          className={filterClass}
          value={number}
          options={[
            { value: ALL, label: "All numbers" },
            ...numberValues.map((value) => ({
              value,
              label: formatNumber(value)
            }))
          ]}
          onValueChange={setNumber}
        />
        <Select
          aria-label="Status"
          className={filterClass}
          value={status}
          options={STATUSES}
          onValueChange={setStatus}
        />
        {!calls.isPending && !calls.error && (
          <span className="ml-auto text-[13px] text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <DataTable
        label={label}
        columns={columns}
        rows={rows}
        rowKey={(c) => c.callRef}
        onRowClick={(c) => navigate(`${base}/${c.callRef}`)}
        loading={calls.isPending}
        error={calls.error ? errorMessage(calls.error) : undefined}
        onRetry={() => void calls.refetch()}
        hasMore={calls.hasNextPage}
        loadingMore={calls.isFetchingNextPage}
        onLoadMore={() => void calls.fetchNextPage()}
        empty={
          <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            {filtered
              ? "No calls match the filters."
              : `No calls in the ${rangeLabel.toLowerCase()}.`}
          </p>
        }
      />
    </div>
  );
}
