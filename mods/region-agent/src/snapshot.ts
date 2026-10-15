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
import {
  ConfigSnapshot,
  Row,
  SnapshotRegion,
  SnapshotWorkspace
} from "./types";

// A region's snapshot (contract 3) carries every workspace bound to the region, keyed by its
// access key id, plus one catalog. Old single-workspace snapshots (`kinds`) map to the workspace
// the cell enrolled for.

export type NormalizedSnapshot = {
  region: SnapshotRegion;
  catalog?: Row[];
  workspaces: Record<string, SnapshotWorkspace>;
};

/** Placeholder key for an old `kinds` snapshot when the cell knows no workspace. */
export const UNKNOWN_WORKSPACE = "_";

export function normalizeSnapshot(
  snapshot: ConfigSnapshot,
  fallbackWorkspace?: string
): NormalizedSnapshot {
  const workspaces: Record<string, SnapshotWorkspace> = {};
  for (const [id, w] of Object.entries(snapshot.workspaces ?? {}))
    if (id && w && typeof w === "object")
      workspaces[id] = { ...w, kinds: w.kinds ?? {} };
  if (snapshot.kinds && !snapshot.workspaces)
    workspaces[fallbackWorkspace ?? UNKNOWN_WORKSPACE] = {
      kinds: snapshot.kinds
    };
  return {
    region: snapshot.region ?? {},
    catalog: snapshot.catalog ?? snapshot.kinds?.catalog,
    workspaces
  };
}

const lower = (s: string) => s.trim().toLowerCase().replace(/\.$/, "");

/**
 * The domain a cloud domain becomes in this region (PR-16): with a region SIP domain, the cloud's
 * `<label>.<rootDomain>` becomes `<label>.<sipDomain>` (wildcard DNS `*.<sipDomain>` points at the
 * region). A domain outside the root domain keeps its first label. Without a SIP domain, unchanged.
 */
export function regionDomainUri(uri: string, region: SnapshotRegion): string {
  const sip = region.sipDomain ? lower(region.sipDomain) : "";
  if (!sip || !uri) return uri;
  const u = lower(uri);
  if (u === sip || u.endsWith(`.${sip}`)) return u;
  const root = region.rootDomain ? lower(region.rootDomain) : "";
  if (root && u.endsWith(`.${root}`))
    return `${u.slice(0, -(root.length + 1))}.${sip}`;
  return `${u.split(".")[0]}.${sip}`;
}
