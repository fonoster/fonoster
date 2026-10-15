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
import { IncomingHttpHeaders } from "http";

// voice-session, "Connection requests are signed".
export const SIGNATURE_HEADER = "x-fonoster-signature";
export const TIMESTAMP_HEADER = "x-fonoster-timestamp";
export const MAX_SKEW_SECONDS = 300;

export type Verification = {
  ok: boolean;
  reason?: "missing" | "stale" | "mismatch";
};

export function sign(url: string, timestamp: number, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${url}`)
    .digest("hex");
}

/** Checks the gateway's signature against each candidate URL (the URL as configured on the app). */
export function verifySignature(
  urls: string[],
  headers: IncomingHttpHeaders,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): Verification {
  const signature = headers[SIGNATURE_HEADER];
  const timestamp = Number(headers[TIMESTAMP_HEADER]);
  if (typeof signature !== "string" || !Number.isFinite(timestamp))
    return { ok: false, reason: "missing" };
  if (Math.abs(nowSeconds - timestamp) > MAX_SKEW_SECONDS)
    return { ok: false, reason: "stale" };
  const given = Buffer.from(signature, "hex");
  for (const url of urls) {
    const expected = Buffer.from(sign(url, timestamp, secret), "hex");
    if (given.length === expected.length && timingSafeEqual(given, expected))
      return { ok: true };
  }
  return { ok: false, reason: "mismatch" };
}
