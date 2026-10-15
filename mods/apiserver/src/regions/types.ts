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
import type { RegionEndpoints } from "./endpoints";

/** Wire names of the private region contract (openspec/changes/add-private-regions/contract.md). */
export const REGION_AUDIENCE = "fonoster.region.v1";

export const PRIVATE_REGION = "private";

/** A private region ref: `rg_` + lowercase base32. */
export const REGION_REF = /^rg_[a-z2-7]{8,32}$/;

export const isPrivateRegionRef = (region?: string | null) =>
  !!region && region.startsWith("rg_");

export const subjects = (ref: string) => ({
  all: `region.${ref}.>`,
  heartbeat: `region.${ref}.heartbeat`,
  config: `region.${ref}.config`,
  configRequest: `region.${ref}.config.request`,
  secretsNeeded: `region.${ref}.secrets.needed`,
  relay: `region.${ref}.relay`,
  index: `region.${ref}.index`,
  usage: `region.${ref}.usage`,
  revoked: `region.${ref}.revoked`,
  endpoints: `region.${ref}.endpoints`,
  /** cp → cell: please publish `region.R.endpoints` again (RE-B2). */
  endpointsRequest: `region.${ref}.endpoints.request`,
  /** Reply subjects for requests that cross the link (RG-B4). */
  inbox: `region.${ref}._INBOX`
});

export type Components = {
  mediaNodes: number;
  gateways: number;
  autopilot: boolean;
};

export type Heartbeat = {
  type: "region.heartbeat";
  regionRef: string;
  version: string;
  components: Components;
  activeCalls: number;
  secretsSet: string[];
  configVersion: number;
  /** See `endpointsHash()` (RE-B2); a change makes the control plane ask for the endpoints. */
  endpointsHash?: string;
  at: string;
};

export type RegionStatus =
  | "waiting"
  | "connected"
  | "degraded"
  | "offline"
  | "unsupported";

export type PublicRegion = {
  id: string;
  name: string;
  default?: boolean;
  /** Configured connection details (contract §3a). */
  endpoints?: RegionEndpoints;
};

/** A Region row (Prisma). */
export type RegionRow = {
  ref: string;
  accessKeyId: string;
  state: string;
  cellPublicKey: string | null;
  version: string | null;
  components: unknown;
  activeCalls: number;
  secretsSet: string[];
  reportedConfig: number;
  configVersion: number;
  lastHeartbeatAt: Date | null;
  enrolledAt: Date | null;
  endpoints?: unknown;
  endpointsHash?: string | null;
  endpointsAt?: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** The Prisma client, narrowed to what the regions code uses (tests pass a real one). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RegionsDb = any;

/** A failure with the HTTP status and contract code to answer with. */
export class RegionError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string
  ) {
    super(message ?? code);
  }
}
