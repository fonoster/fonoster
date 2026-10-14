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
import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export const CLI_COMMAND =
  "npx @fonoster/ctl applications:create -f agent.yaml";

/** A titled card section of a detail page. */
export function Panel({
  title,
  description,
  action,
  className,
  children
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
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

/** A label and hint on the left, a compact control on the right. */
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
    <div className="flex flex-col gap-1.5 border-t border-border pt-3 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <label
            htmlFor={htmlFor}
            className="font-display text-[13px] font-medium"
          >
            {label}
          </label>
          {hint && (
            <span className="font-display text-xs text-muted-foreground">
              {hint}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
      {error && (
        <p role="alert" className="text-right text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
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
