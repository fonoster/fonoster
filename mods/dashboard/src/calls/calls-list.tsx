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
import { ChevronRight, PhoneCall } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DataTable, type Column } from "~/components/data/data-table";
import { EmptyState } from "~/components/data/empty-state";
import { Button } from "~/components/ui/button";
import { Select } from "~/components/ui/select";
import { PageHeader } from "~/app/shell/page";
import { useCalls, type CallFilters } from "./calls.service";
import {
  RANGES,
  STATUS_FILTERS,
  answeredBy,
  callParties,
  callsToCsv,
  download,
  formatDuration,
  formatStarted
} from "./format";
import { DirectionIcon, StatusDot } from "./parts";

const ANY_STATUS = "any";
const DEFAULT_RANGE = "7";

/** The filters live in the URL so going back from a call keeps them. */
function useFilters(): [CallFilters, (next: Partial<CallFilters>) => void] {
  const [params, setParams] = useSearchParams();
  const range = params.get("range");
  const filters = {
    range: RANGES.some((r) => r.value === range) ? range! : DEFAULT_RANGE,
    status: params.get("status") ?? ""
  };
  const update = (next: Partial<CallFilters>) => {
    const merged = { ...filters, ...next };
    const search = new URLSearchParams();
    if (merged.range !== DEFAULT_RANGE) search.set("range", merged.range);
    if (merged.status) search.set("status", merged.status);
    setParams(search, { replace: true });
  };
  return [filters, update];
}

const FILTER_CLASS = "h-8 w-auto px-3";

export function CallsList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useFilters();
  const list = useCalls(filters);
  const filtered = Boolean(filters.status) || filters.range !== DEFAULT_RANGE;

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
      header: "Fonoster number",
      className: "whitespace-nowrap",
      cell: (c) => (
        <span className="font-mono text-muted-foreground">
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
      cell: (c) => (
        <span className="font-display">
          <StatusDot status={c.status} />
        </span>
      )
    },
    {
      header: "Answered by",
      className: "w-32",
      cell: (c) => (
        <span className="font-display text-muted-foreground">
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
    <>
      <PageHeader
        title="Calls"
        description="Every call in this workspace. Open one to see its details."
        actions={
          list.items.length > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                download("calls.csv", callsToCsv(list.items), "text/csv")
              }
            >
              Export CSV
            </Button>
          )
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Date range"
            className={FILTER_CLASS}
            value={filters.range}
            onValueChange={(range) => setFilters({ range })}
            options={RANGES}
          />
          <Select
            aria-label="Status"
            className={FILTER_CLASS}
            value={filters.status || ANY_STATUS}
            onValueChange={(status) =>
              setFilters({ status: status === ANY_STATUS ? "" : status })
            }
            options={[
              { value: ANY_STATUS, label: "Any status" },
              ...STATUS_FILTERS
            ]}
          />
        </div>
        <DataTable
          label="Calls"
          columns={columns}
          rows={list.items}
          rowKey={(c) => c.ref}
          onRowClick={(c) => navigate(c.ref)}
          loading={list.isPending}
          error={list.error}
          onRetry={() => void list.refetch()}
          hasMore={list.hasNextPage}
          loadingMore={list.isFetchingNextPage}
          onLoadMore={() => void list.fetchNextPage()}
          empty={
            <EmptyState
              icon={PhoneCall}
              title={filtered ? "No calls match these filters" : "No calls yet"}
              description={
                filtered
                  ? "Try a longer date range or another status."
                  : "Calls to and from your numbers show up here once they end."
              }
              action={
                filtered && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFilters({ range: DEFAULT_RANGE, status: "" })
                    }
                  >
                    Clear filters
                  </Button>
                )
              }
            />
          }
        />
      </div>
    </>
  );
}
