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

/** A column: a fixed width in px, or the one that takes the rest (`width` omitted). */
export type Column = { label: string; width?: number };

const cell = (c: Column) =>
  c.width ? { width: c.width, flex: "none" } : { flex: 1, minWidth: 0 };

/** A bordered table like the design's: a muted header row, rows split by a hairline. */
export function Table({
  columns,
  rows,
  empty
}: {
  columns: Column[];
  rows: {
    key: string;
    cells: ReactNode[];
    selected?: boolean;
    onClick?: () => void;
    after?: ReactNode;
  }[];
  empty: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-4 border-b border-border bg-muted px-4 py-2">
        {columns.map((c, i) => (
          <div
            key={i}
            style={cell(c)}
            className="text-[11px] font-medium uppercase tracking-wide text-text-muted"
          >
            {c.label}
          </div>
        ))}
      </div>
      {rows.length === 0 && (
        <div className="px-4 py-6 text-center text-[13px] text-text-muted">
          {empty}
        </div>
      )}
      {rows.map((r, i) => (
        <div key={r.key} className={i ? "border-t border-border" : ""}>
          <div
            role="row"
            onClick={r.onClick}
            className={`flex items-center gap-4 px-4 py-2.5 text-[13px] ${r.selected ? "bg-muted" : ""} ${r.onClick ? "cursor-pointer hover:bg-muted" : ""}`}
          >
            {r.cells.map((content, j) => (
              <div key={j} style={cell(columns[j])} className="truncate">
                {content}
              </div>
            ))}
          </div>
          {r.after}
        </div>
      ))}
    </div>
  );
}

export const Mono = ({ children }: { children: ReactNode }) => (
  <span className="font-mono">{children}</span>
);

export const Muted = ({
  children,
  danger
}: {
  children: ReactNode;
  danger?: boolean;
}) => (
  <span className={`text-xs ${danger ? "text-danger" : "text-text-muted"}`}>
    {children}
  </span>
);

export function PageHeader({
  title,
  sub,
  breadcrumb,
  action
}: {
  title: ReactNode;
  sub?: ReactNode;
  breadcrumb?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {breadcrumb && (
          <div className="text-xs text-text-muted">{breadcrumb}</div>
        )}
        <h1 className="m-0 text-[22px] font-semibold">{title}</h1>
        {sub && <div className="text-[13px] text-text-muted">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export const Section = ({
  title,
  children
}: {
  title?: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-2.5">
    {title && <h2 className="m-0 text-[15px] font-semibold">{title}</h2>}
    {children}
  </section>
);

export function Tile({
  label,
  value,
  sub,
  bar
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  bar?: number;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-1 flex-col gap-2 rounded-lg border border-border bg-surface p-4"
    >
      <div className="text-xs text-text-muted">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
      {bar !== undefined && (
        <div className="h-1 rounded-sm bg-muted">
          <div
            className="h-1 rounded-sm bg-text-muted"
            style={{ width: `${Math.round(bar * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function Button({
  children,
  onClick,
  primary,
  disabled,
  title
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs disabled:cursor-default disabled:opacity-50 ${
        primary
          ? "bg-accent font-semibold text-on-accent hover:opacity-90"
          : "border border-border bg-surface text-text hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
