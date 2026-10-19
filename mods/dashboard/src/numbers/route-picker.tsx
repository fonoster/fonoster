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
import type { Agent, Application, INumber } from "@fonoster/types";
import { Bot, Check, Search, UserRound, Workflow } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { errorMessage } from "~/lib/errors";
import { cn } from "~/lib/utils";
import {
  applicationKind,
  ROUTE_KINDS,
  sipAgentAor,
  type Route,
  type RouteKind
} from "./routing";

export const ROUTE_ICONS: Record<RouteKind, typeof Bot> = {
  agent: Bot,
  app: Workflow,
  sip: UserRound
};

type Option = { value: string; name: string; sub: string };

function plural(count: number, other: boolean) {
  if (count === 0) return "no numbers";
  const noun = count === 1 ? "number" : "numbers";
  return `${count} ${other ? "other " : ""}${noun}`;
}

/**
 * "When this number is called, send it to": a segmented choice between
 * agents, apps and SIP agents, and a searchable list of the chosen kind.
 */
export function RoutePicker({
  value,
  onChange,
  apps,
  sipAgents,
  numbers,
  currentRef,
  loading,
  error
}: {
  value?: Route;
  onChange: (route: Route) => void;
  apps: Application[];
  sipAgents: Agent[];
  /** All numbers, to say how many already use each target. */
  numbers: INumber[];
  /** The number being edited, left out of those counts. */
  currentRef?: string;
  loading?: boolean;
  error?: unknown;
}) {
  const labelId = useId();
  const [kind, setKind] = useState<RouteKind>(value?.kind ?? "agent");
  const [query, setQuery] = useState("");
  // Follow the value when it's set from outside (e.g. apps finished loading).
  useEffect(() => {
    if (value?.kind) setKind(value.kind);
  }, [value?.kind]);
  const noun = ROUTE_KINDS.find((k) => k.value === kind)!.noun;

  const options = useMemo<Option[]>(() => {
    const others = numbers.filter((n) => n.ref !== currentRef);
    const count = (match: (n: INumber) => boolean) =>
      plural(others.filter(match).length, Boolean(currentRef));
    if (kind === "sip") {
      return sipAgents.flatMap((user) => {
        const aor = sipAgentAor(user);
        if (!aor) return [];
        return [
          {
            value: aor,
            name: user.name || user.username,
            sub: `${aor.replace(/^sips?:/, "")} · ${count((n) => n.agentAor === aor)}`
          }
        ];
      });
    }
    return apps
      .filter((app) => applicationKind(app) === kind)
      .map((app) => ({
        value: app.ref,
        name: app.name,
        sub: `${app.ref} · ${count((n) => n.appRef === app.ref)}`
      }));
  }, [kind, apps, sipAgents, numbers, currentRef]);

  const term = query.trim().toLowerCase();
  const visible = term
    ? options.filter((o) => `${o.name} ${o.sub}`.toLowerCase().includes(term))
    : options;

  return (
    <div className="flex flex-col gap-2.5">
      <span id={labelId} className="font-display text-xs text-foreground">
        When this number is called, send it to
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid grid-cols-3 gap-1 rounded-control bg-muted p-1"
      >
        {ROUTE_KINDS.map((k) => {
          const Icon = ROUTE_ICONS[k.value];
          const active = k.value === kind;
          return (
            <button
              key={k.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setKind(k.value);
                setQuery("");
              }}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 font-display text-[13px] text-text-secondary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-background text-foreground shadow-sm"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {k.label}
            </button>
          );
        })}
      </div>
      <div className="overflow-hidden rounded-control border border-input bg-background">
        <label className="flex h-10 items-center gap-2 border-b border-border px-3">
          <Search className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="sr-only">Search {noun}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${noun}`}
            className="h-full flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-muted"
          />
        </label>
        <div
          role="radiogroup"
          aria-label={ROUTE_KINDS.find((k) => k.value === kind)!.label}
          className="flex max-h-56 flex-col overflow-y-auto p-1"
        >
          {loading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="m-2 h-7 w-3/4" />)
          ) : error ? (
            <p className="px-3 py-4 text-[13px] text-destructive">
              {errorMessage(error)}
            </p>
          ) : visible.length === 0 ? (
            <p className="px-3 py-4 font-display text-[13px] text-muted-foreground">
              {term ? `No ${noun} match “${query.trim()}”.` : `No ${noun} yet.`}
            </p>
          ) : (
            visible.map((option) => {
              const checked = value?.kind === kind && value.to === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onChange({ kind, to: option.value })}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-[6px] px-3 py-2 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                    checked && "bg-accent"
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] text-foreground">
                      {option.name}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {option.sub}
                    </span>
                  </span>
                  {checked && (
                    <Check className="size-4 text-primary" aria-hidden />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
