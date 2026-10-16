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
import { Link, useNavigate } from "react-router-dom";
import { DataTable, type Column } from "~/components/data/data-table";
import { Skeleton } from "~/components/ui/skeleton";
import { useWorkspace } from "~/lib/workspace";
import { useCallsForNumbers } from "./calls.service";
import { callParties, formatDuration, formatStarted } from "./format";
import { DirectionIcon, StatusDot } from "./parts";

/**
 * The latest calls on an app's numbers, linking to each call. Used where the
 * designs show "calls this agent handled", which the API can't answer yet.
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
  const calls = useCallsForNumbers(numbers.map((n) => n.telUrl));

  if (loadingNumbers) return <Skeleton className="h-24 w-full" />;
  if (numbers.length === 0) {
    return (
      <p className="font-display text-xs text-muted-foreground">{noNumbers}</p>
    );
  }

  const columns: Column<CallDetailRecord>[] = [
    {
      header: "Started",
      className: "w-36 whitespace-nowrap",
      cell: (c) => (
        <span className="font-display text-muted-foreground">
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
      header: "Duration",
      className: "w-24",
      cell: (c) => (
        <span className="font-mono">{formatDuration(c.duration)}</span>
      )
    },
    {
      header: "Status",
      className: "w-32",
      cell: (c) => (
        <span className="font-display">
          <StatusDot status={c.status} />
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
    <div className="flex flex-col gap-2">
      <DataTable
        label={label}
        columns={columns}
        rows={calls.data ?? []}
        rowKey={(c) => c.ref}
        onRowClick={(c) => navigate(`${base}/${c.ref}`)}
        loading={calls.isPending}
        error={calls.error}
        onRetry={() => void calls.refetch()}
        empty={
          <p className="font-display text-xs text-muted-foreground">
            No calls on these numbers in the last 30 days.
          </p>
        }
      />
      <p className="font-display text-xs text-muted-foreground">
        Calls to and from {numbers.length === 1 ? "its number" : "its numbers"}{" "}
        in the last 30 days.{" "}
        <Link to={base} className="underline hover:text-foreground">
          All calls
        </Link>
      </p>
    </div>
  );
}
