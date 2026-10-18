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
import { Components, RegionRow, RegionStatus } from "./types";

export const OFFLINE_AFTER_MS = 2 * 60_000;

const parse = (v: string) => {
  const m = /^v?(\d+)\.(\d+)(?:\.(\d+))?/.exec(v.trim());
  return m ? { major: Number(m[1]), minor: Number(m[2]) } : undefined;
};

/** The oldest supported version: the previous minor release of `current` (PR-6). */
export function requiredVersion(current: string) {
  const c = parse(current);
  if (!c) return current;
  return c.minor > 0 ? `${c.major}.${c.minor - 1}.0` : `${c.major}.0.0`;
}

/** True when `version` is the current or the previous minor release, or newer. */
export function isSupportedVersion(version: string, current: string) {
  const v = parse(version);
  const r = parse(requiredVersion(current));
  if (!v || !r) return false;
  return v.major > r.major || (v.major === r.major && v.minor >= r.minor);
}

export type StatusView = {
  status: RegionStatus;
  reason?: string;
  requiredVersion?: string;
};

/** The shown status of a region from its row and the heartbeat rules (contract §4). */
export function regionStatus(
  row: Pick<
    RegionRow,
    "state" | "lastHeartbeatAt" | "enrolledAt" | "version" | "components"
  >,
  options: { now: Date; currentVersion: string; offlineAfterMs?: number }
): StatusView {
  if (row.state !== "enrolled") return { status: "waiting" };
  const offlineAfter = options.offlineAfterMs ?? OFFLINE_AFTER_MS;
  const last = row.lastHeartbeatAt ?? undefined;
  if (!last) {
    // Enrolled, first heartbeat not yet in: waiting for a grace period, then offline.
    const since = row.enrolledAt?.getTime() ?? 0;
    return options.now.getTime() - since > offlineAfter
      ? { status: "offline", reason: "no heartbeat since enrollment" }
      : { status: "waiting" };
  }
  if (options.now.getTime() - last.getTime() > offlineAfter)
    return { status: "offline", reason: "no heartbeat for 2 minutes" };
  if (row.version && !isSupportedVersion(row.version, options.currentVersion)) {
    const required = requiredVersion(options.currentVersion);
    return {
      status: "unsupported",
      requiredVersion: required,
      reason: `version ${row.version} is no longer supported; upgrade the region to ${required} or later (config sync is paused)`
    };
  }
  const c = (row.components ?? {}) as Partial<Components>;
  const down: string[] = [];
  if (!c.roomrNodes) down.push("Roomr nodes");
  if (!c.gateways) down.push("gateways");
  if (c.autopilot === false) down.push("autopilot");
  if (down.length)
    return { status: "degraded", reason: `no healthy ${down.join(", ")}` };
  return { status: "connected" };
}
