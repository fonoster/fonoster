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
import { createHmac, timingSafeEqual } from "crypto";

// Connection signing as proposed in add-voice-session-gateway (open question 5): HMAC-SHA256 over
// "<timestamp>.<url>" with the app's signing secret, hex encoded. Until that question is settled,
// these names live here only, so changing them touches one file.
export const SIGNATURE_HEADER = "x-fonoster-signature";
export const TIMESTAMP_HEADER = "x-fonoster-timestamp";
export const MAX_SKEW_MS = 5 * 60 * 1000;

export function sign(url: string, timestamp: number, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${url}`)
    .digest("hex");
}

export function signatureHeaders(
  url: string,
  secret: string,
  now = Date.now()
): Record<string, string> {
  return {
    [SIGNATURE_HEADER]: sign(url, now, secret),
    [TIMESTAMP_HEADER]: String(now)
  };
}

export type VerifyResult = {
  ok: boolean;
  reason?: "missing" | "stale" | "mismatch";
};

export function verify(
  url: string,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
  now = Date.now()
): VerifyResult {
  const signature = headers[SIGNATURE_HEADER];
  const timestamp = Number(headers[TIMESTAMP_HEADER]);
  if (typeof signature !== "string" || !Number.isFinite(timestamp))
    return { ok: false, reason: "missing" };
  if (Math.abs(now - timestamp) > MAX_SKEW_MS)
    return { ok: false, reason: "stale" };
  const expected = Buffer.from(sign(url, timestamp, secret), "hex");
  const given = Buffer.from(signature, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true };
}
