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
import type { ReactNode } from "react";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { errorMessage } from "~/lib/errors";
import { cn } from "~/lib/utils";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  /** Width/alignment classes for the header and cells, e.g. "w-40". */
  className?: string;
};

/**
 * The card table every list screen uses. Rows open on click when `onRowClick`
 * is given; the last column usually holds RowActions.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  error,
  onRetry,
  empty,
  hasMore,
  loadingMore,
  onLoadMore,
  label
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: ReactNode;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  /** Accessible name of the table, e.g. "Secrets". */
  label: string;
}) {
  if (error) {
    return (
      <Alert variant="error">
        {errorMessage(error)}{" "}
        {onRetry && (
          <button
            type="button"
            className="cursor-pointer underline"
            onClick={onRetry}
          >
            Try again
          </button>
        )}
      </Alert>
    );
  }

  if (!loading && rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table
          className="w-full min-w-[640px] border-collapse text-left"
          aria-label={label}
        >
          <thead>
            <tr className="h-10 bg-muted">
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    "px-5 text-[11px] font-normal uppercase text-muted-foreground first:rounded-tl-xl last:rounded-tr-xl",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [0, 1, 2].map((i) => (
                  <tr key={i} className="h-[58px] border-t border-border">
                    {columns.map((_, index) => (
                      <td key={index} className="px-5">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "h-[58px] border-t border-border text-[13px]",
                      onRowClick &&
                        "cursor-pointer transition-colors hover:bg-muted/60"
                    )}
                  >
                    {columns.map((column, index) => (
                      <td
                        key={index}
                        className={cn("px-5 py-2", column.className)}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <Button
          variant="outline"
          className="self-center"
          loading={loadingMore}
          onClick={onLoadMore}
        >
          Load more
        </Button>
      )}
    </div>
  );
}

/** A name over a smaller muted line (usually the ref), the first cell of most tables. */
export function NameCell({ name, sub }: { name: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate font-medium text-foreground">{name}</span>
      {sub && (
        <span className="truncate text-[11px] text-muted-foreground">
          {sub}
        </span>
      )}
    </div>
  );
}

export function MutedCell({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}
