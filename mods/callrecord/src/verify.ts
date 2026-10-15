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
import { contentHash, decodeVcon, KeyHistory, verifySignature } from "./sign";
import { SealedVersion } from "./types";

export type Verification =
  | { ok: true; kid: string }
  | { ok: false; failure: string };

/**
 * Checks a sealed version: both signatures against the region's key history, then every part's
 * content hash. Reports the first mismatch (call-record task 1.4).
 */
export function verifyRecord(
  sealed: SealedVersion,
  keys: KeyHistory
): Verification {
  const kid = verifySignature(sealed.signed, keys);
  if (!kid) return { ok: false, failure: "signature" };
  if (!verifySignature(sealed.redacted, keys))
    return { ok: false, failure: "signature (redacted copy)" };
  const vcon = decodeVcon(sealed.signed);
  for (const attachment of vcon.attachments) {
    const name = String(attachment.url ?? "").replace(/^parts\//, "");
    const part = sealed.parts.find((p) => p.name === name);
    if (!part) return { ok: false, failure: `part ${name} is missing` };
    if (contentHash(part.data) !== attachment.content_hash)
      return { ok: false, failure: `part ${name} hash mismatch` };
  }
  return { ok: true, kid };
}
