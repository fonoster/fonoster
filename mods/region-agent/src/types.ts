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
  sub: string;
  wsp: string;
  cp: string;
  leaf: string;
  jti: string;
  iat: number;
  exp: number;
};

export type Components = {
  mediaNodes: number;
  gateways: number;
  autopilot: boolean;
};

/** `200` of `POST {cp}/api/regions/enroll` (contract 2). */
export type EnrollResponse = {
  regionRef: string;
  workspaceRef: string;
  leafUrl: string;
  credentials: string;
  subjects: string;
  configVersion: number;
};

/** What the cell keeps after enrolling (file 0600 or a Kubernetes Secret). */
export type RegionIdentity = {
  regionRef: string;
  workspaceRef: string;
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
  at: string;
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

export type ConfigSnapshot = {
  type: "region.config";
  configVersion: number;
  full: boolean;
  kinds: {
    numbers?: Row[];
    apps?: Row[];
    assistants?: Row[];
    routr?: RoutrKinds;
    catalog?: Row[];
    webhooks?: Row[];
    /** RG-B4: `{transcripts?, recordings?, retention: [{part, days}]}`; a string is an app default. */
    recordingPolicy?: RecordingPolicySnapshot | string | null;
  };
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
  revoked: `region.${regionRef}.revoked`,
  /** Reply subjects for requests that cross the link (RG-B4): the link client's inboxPrefix. */
  inbox: `region.${regionRef}._INBOX`
});
