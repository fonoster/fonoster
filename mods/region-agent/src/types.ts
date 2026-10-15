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
// The wire contract with the control plane (openspec/changes/add-private-regions/contract.md,
// `fonoster.region.v1`). Additive only: unknown fields and message types are ignored.

export const CONTRACT_VERSION = "fonoster.region.v1";

/** Claims of the one-time enrollment token (contract 1). */
export type EnrollmentClaims = {
  iss: string;
  aud: string | string[];
  /** The region ref (`rg_…`). */
  sub: string;
  /** The region id (`acme-hq`, `us-east-2`). */
  rid?: string;
  /** `public` | `private`. */
  knd?: RegionKind;
  /** Gone since PR-14 (a region serves several workspaces); read only from old tokens. */
  wsp?: string;
  cp: string;
  leaf: string;
  jti: string;
  iat: number;
  exp: number;
};

export type RegionKind = "public" | "private";

export type Components = {
  mediaNodes: number;
  gateways: number;
  autopilot: boolean;
};

/** `200` of `POST {cp}/api/regions/enroll` (contract 2). */
export type EnrollResponse = {
  regionRef: string;
  regionId?: string;
  kind?: RegionKind;
  sipDomain?: string | null;
  /** Informational; the config snapshot is authoritative. */
  workspaceRefs?: string[];
  /** Old control planes (one workspace per region). */
  workspaceRef?: string;
  leafUrl: string;
  credentials: string;
  subjects: string;
  configVersion: number;
};

/** What the cell keeps after enrolling (file 0600 or a Kubernetes Secret). */
export type RegionIdentity = {
  regionRef: string;
  regionId?: string;
  kind?: RegionKind;
  sipDomain?: string | null;
  /** Old identity files (one workspace per region); a snapshot's single `kinds` maps to it. */
  workspaceRef?: string;
  controlPlane: string;
  leafUrl: string;
  subjects: string;
  /** Config version at enrollment. */
  configVersion: number;
  enrolledAt: string;
  tokenId: string;
  /** The cell's Ed25519 public key (base64url, raw 32 bytes). */
  publicKey: string;
};

export type Heartbeat = {
  type: "region.heartbeat";
  regionRef: string;
  version: string;
  components: Components;
  activeCalls: number;
  secretsSet: string[];
  configVersion: number;
  /** Hash of the last `region.endpoints` sent (contract 3); absent when none are known. */
  endpointsHash?: string;
  at: string;
};

export type SipEndpoint = {
  host: string;
  port: number;
  transport: "udp" | "tcp" | "tls" | "ws" | "wss";
};

/** `region.R.endpoints` (cell → cp): public connection details, on connect and on change. */
export type Endpoints = {
  type: "region.endpoints";
  sip: SipEndpoint[];
  signalingAddresses: string[];
  mediaAddresses: string[];
  rtpPorts?: { min: number; max: number };
  updatedAt: string;
};

/** Rows as the control plane holds them; the cell takes the fields it knows (RC-B6). */
export type Row = Record<string, unknown>;

export type RoutrKinds = {
  domains?: Row[];
  agents?: Row[];
  trunks?: Row[];
  acls?: Row[];
  /** Not in contract 3; accepted when the control plane sends it (RC-B8). */
  credentials?: Row[];
};

/** One workspace's part of a snapshot. */
export type WorkspaceKinds = {
  numbers?: Row[];
  apps?: Row[];
  assistants?: Row[];
  routr?: RoutrKinds;
  /** Old single-workspace snapshots carried the catalog here. */
  catalog?: Row[];
  webhooks?: Row[];
  /** RG-B4: `{transcripts?, recordings?, retention: [{part, days}]}`; a string is an app default. */
  recordingPolicy?: RecordingPolicySnapshot | string | null;
};

export type SnapshotRegion = {
  ref?: string;
  id?: string;
  kind?: RegionKind;
  sipDomain?: string | null;
  /** The cloud's SIP root domain; cloud domains end with it. */
  rootDomain?: string | null;
};

export type SnapshotWorkspace = {
  ref?: string;
  name?: string;
  domain?: string | null;
  kinds: WorkspaceKinds;
};

/** `region.R.config` (contract 3): one snapshot per region, keyed by workspace. */
export type ConfigSnapshot = {
  type: "region.config";
  configVersion: number;
  full: boolean;
  region?: SnapshotRegion;
  catalog?: Row[];
  workspaces?: Record<string, SnapshotWorkspace>;
  /** Old single-workspace shape; mapped to the identity's workspaceRef. */
  kinds?: WorkspaceKinds;
};

export type RecordingPolicySnapshot = {
  transcripts?: unknown;
  recordings?: unknown;
  retention?: { part: string; days: number }[];
};

export type RelayRequest = {
  type: "region.relay";
  id: string;
  userRef: string;
  /** The caller's workspace; only its records are served (contract 5). */
  workspaceRef?: string;
  op: "record.get" | "record.part";
  callRef: string;
  part?: string;
  range?: { start?: number; end?: number } | string;
  /** The unredacted original (the control plane checked the role; RG-B4). */
  original?: boolean;
  version?: number;
};

export type RelayChunk = {
  type: "region.relay.chunk";
  id: string;
  seq: number;
  last: boolean;
  contentType: string;
  data: string;
  /** Not in contract 3: total bytes of the content (or of the range). */
  size?: number;
};

/** The one reply to a relay the cell cannot serve (RG-B4). */
export type RelayErrorReply = {
  type: "region.relay.error";
  id: string;
  code: string;
  message?: string;
};

export const subjects = (regionRef: string) => ({
  heartbeat: `region.${regionRef}.heartbeat`,
  config: `region.${regionRef}.config`,
  configRequest: `region.${regionRef}.config.request`,
  secretsNeeded: `region.${regionRef}.secrets.needed`,
  relay: `region.${regionRef}.relay`,
  index: `region.${regionRef}.index`,
  usage: `region.${regionRef}.usage`,
  endpoints: `region.${regionRef}.endpoints`,
  /** cp → cell: publish the endpoints again (RE-B2). */
  endpointsRequest: `region.${regionRef}.endpoints.request`,
  revoked: `region.${regionRef}.revoked`,
  /** region → cp request/reply: a workspace's bring-your-own key (contract 6, PR-20). */
  secretsGet: `region.${regionRef}.secrets.get`,
  /** Reply subjects for requests that cross the link (RG-B4): the link client's inboxPrefix. */
  inbox: `region.${regionRef}._INBOX`
});

/** Cell-local subject the gateway asks for a workspace's key on (contract 6; never crosses the link). */
export const CELL_WORKSPACE_KEYS_SUBJECT = "cell.workspacekeys.get";
