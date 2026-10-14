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
/**
 * Small building blocks the agent screens share. Candidates for
 * src/components once another screen needs them.
 */
import { Construction, FileUp, Terminal } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export const CLI_COMMAND =
  "npx @fonoster/ctl applications:create -f agent.yaml";

/** A titled card section of a detail page (14/500 title, 12 muted subtitle). */
export function Panel({
  title,
  description,
  action,
  className,
  children
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-display text-sm font-medium">{title}</h2>
          {description && (
            <p className="font-display text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A muted text action in a panel header, e.g. "+ Add tool" or "Send test". */
export function PanelAction({
  children,
  accent,
  className,
  ...props
}: ComponentProps<"button"> & { accent?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 cursor-pointer font-display text-[13px] outline-none hover:underline focus-visible:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60",
        accent ? "text-brand-text" : "text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * A setting: label (13) and description (12, muted) on the left, a compact
 * value box on the right; rows are separated by dividers.
 */
export function SettingRow({
  label,
  hint,
  htmlFor,
  error,
  children
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-t border-border py-3 last:pb-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <label htmlFor={htmlFor} className="font-display text-[13px]">
            {label}
          </label>
          {hint && (
            <span className="font-display text-xs text-muted-foreground">
              {hint}
            </span>
          )}
        </div>
        {children}
      </div>
      {error && (
        <p
          role="alert"
          className="text-right font-display text-[11px] text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The 150px box on the right of a SettingRow: right-aligned mono values with
 * their units inside ("5000 ms", "10 s · 3×").
 */
export function ValueBox({
  children,
  invalid,
  className
}: {
  children: ReactNode;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[30px] w-[150px] shrink-0 items-center justify-end gap-1 rounded-[8px] border border-input bg-background px-2.5 font-mono text-xs text-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
        invalid && "border-destructive",
        className
      )}
    >
      {children}
    </div>
  );
}

/** A borderless input for a ValueBox. */
export function ValueInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full min-w-0 bg-transparent text-right font-mono text-xs outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className
      )}
      {...props}
    />
  );
}

/** "Import YAML" isn't possible from the browser yet: point at the CLI. */
export function ImportYamlButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="rounded-control">
          <Button variant="outline" disabled aria-label="Import YAML">
            <FileUp aria-hidden /> Import YAML
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Use the ctl CLI: {CLI_COMMAND}</TooltipContent>
    </Tooltip>
  );
}

export function CliHint() {
  return (
    <p className="flex flex-wrap items-center gap-2 font-display text-xs text-muted-foreground">
      <Terminal className="size-3.5" aria-hidden />
      Prefer code? Agents are YAML files:
      <code className="rounded-[6px] bg-muted px-2 py-0.5 font-mono text-[12px] text-foreground">
        {CLI_COMMAND}
      </code>
    </p>
  );
}

/** A tab whose backend isn't there yet. Says what's missing; no fake data. */
export function ComingSoon({
  title,
  description,
  missing,
  children
}: {
  title: string;
  description: string;
  missing: string;
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Construction className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <h2 className="font-display text-base font-medium">
        {title} <span className="text-muted-foreground">· coming soon</span>
      </h2>
      <p className="max-w-lg font-display text-sm text-muted-foreground">
        {description}
      </p>
      <p className="max-w-lg font-display text-xs text-text-secondary">
        {missing}
      </p>
      {children}
    </section>
  );
}
