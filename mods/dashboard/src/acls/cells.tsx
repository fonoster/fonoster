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
import { MutedCell } from "~/components/data/data-table";

/** Monospace pill for an address or range, as in the design. */
function Chip({ children, title }: { children: string; title?: string }) {
  return (
    <span
      title={title}
      className="rounded-[6px] bg-muted px-[7px] py-0.5 font-mono text-[11px] whitespace-nowrap text-muted-foreground"
    >
      {children}
    </span>
  );
}

/** The first two entries, then "+N". */
export function AllowChips({ allow }: { allow: string[] }) {
  if (allow.length === 0) return <MutedCell>—</MutedCell>;
  const rest = allow.length - 2;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allow.slice(0, 2).map((entry) => (
        <Chip key={entry}>{entry}</Chip>
      ))}
      {rest > 0 && <Chip title={allow.slice(2).join(", ")}>{`+${rest}`}</Chip>}
    </div>
  );
}

/** "Trunk · Claro", or the first use and "+N more"; "—" when unknown or unused. */
export function UsedByCell({ labels }: { labels?: string[] }) {
  if (!labels || labels.length === 0) return <MutedCell>—</MutedCell>;
  return (
    <MutedCell>
      <span title={labels.join(", ")}>
        {labels[0]}
        {labels.length > 1 && ` +${labels.length - 1} more`}
      </span>
    </MutedCell>
  );
}
