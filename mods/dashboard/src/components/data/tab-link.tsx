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
import { Link, useMatch } from "react-router-dom";
import { cn } from "~/lib/utils";

/** An underlined page tab (agent and app sections, Settings) with an optional count and error dot. */
export function TabLink({
  to,
  label,
  count,
  invalid
}: {
  to: string;
  label: string;
  count?: number;
  invalid?: boolean;
}) {
  const active = Boolean(useMatch({ path: to, end: true }));
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-3 pt-1 font-display text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-foreground font-medium text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="rounded-[4px] bg-muted px-1.5 font-mono text-[11px] font-normal text-muted-foreground">
          {count}
        </span>
      )}
      {invalid && (
        <span
          className="size-1.5 rounded-full bg-destructive"
          aria-label="Has errors"
        />
      )}
    </Link>
  );
}
