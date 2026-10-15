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
import { Badge } from "~/components/ui/badge";
import type { RegionStatus } from "./types";

const PILL: Record<
  RegionStatus,
  {
    label: string;
    variant: "success" | "warning" | "error" | "neutral" | "info";
  }
> = {
  waiting: { label: "Waiting", variant: "info" },
  connected: { label: "Connected", variant: "success" },
  degraded: { label: "Degraded", variant: "warning" },
  offline: { label: "Offline", variant: "error" },
  unsupported: { label: "Needs upgrade", variant: "warning" }
};

export const PILL_LABEL = Object.fromEntries(
  Object.entries(PILL).map(([k, v]) => [k, v.label])
) as Record<RegionStatus, string>;

export function StatusPill({ status }: { status: RegionStatus }) {
  const { label, variant } = PILL[status];
  return <Badge variant={variant}>{label}</Badge>;
}

/** "3 min ago", "just now"; empty when the region was never seen. */
export function ago(iso?: string, now = Date.now()): string {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

/** "23h 59m" until `iso`, or undefined once it has passed. */
export function remaining(iso: string, now = Date.now()): string | undefined {
  const ms = Date.parse(iso) - now;
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  const m = Math.floor(ms / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
