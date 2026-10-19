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
/** One working-record entry, as AppBridge appends it (voice-session, "Every message is part of the call record"). */
export type RecordEntry = {
  at: number;
  source: "app" | "appbridge" | "event";
  message: Record<string, unknown>;
};

/** A part stored next to the vCon (vCon external references with content hashes). */
export type Part = { name: string; mimetype: string; data: Buffer };

/**
 * A part on local disk, uploaded by streaming (large recordings, LO-B7). Its hash and size were
 * computed while the file was written.
 */
export type FilePart = {
  name: string;
  mimetype: string;
  file: string;
  size: number;
  content_hash: string;
};

/** A part an earlier version already stored (new versions share parts; nothing is uploaded). */
export type StoredPart = {
  name: string;
  mimetype: string;
  size: number;
  content_hash: string;
  stored: true;
};

/** Any part a version being sealed can reference. */
export type SealingPart = Part | FilePart | StoredPart;

/** A sealed version as stored: the signed original, the signed redacted copy and the parts. */
export type SealedVersion = {
  version: number;
  signed: SignedVcon;
  redacted: SignedVcon;
  parts: Part[];
};

/** A version being written: like SealedVersion, but parts may be files or already stored. */
export type SealingVersion = Omit<SealedVersion, "parts"> & {
  parts: SealingPart[];
};

/** JWS general JSON serialization of a vCon (RFC 7515 section 7.2.1). */
export type SignedVcon = {
  payload: string;
  signatures: {
    protected: string;
    signature: string;
    header: { kid: string; uuid?: string };
  }[];
};

export type Vcon = {
  vcon: string;
  uuid: string;
  created_at: string;
  updated_at?: string;
  subject?: string;
  parties: Record<string, unknown>[];
  dialog: Record<string, unknown>[];
  analysis: Record<string, unknown>[];
  attachments: Record<string, unknown>[];
  redacted?: Record<string, unknown>;
  amended?: Record<string, unknown>;
  /** Fonoster extension: why the record is incomplete, if it is. */
  fonoster?: Record<string, unknown>;
};
