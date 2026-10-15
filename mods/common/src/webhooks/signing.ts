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

// add-workspace-webhooks, "Deliveries are signed": X-Fonoster-Timestamp (Unix seconds) and
// X-Fonoster-Signature = hex HMAC-SHA256 of "<timestamp>.<raw body>", one per valid secret,
// comma-separated during a rotation window.

export const WEBHOOK_SIGNATURE_HEADER = "X-Fonoster-Signature";
export const WEBHOOK_TIMESTAMP_HEADER = "X-Fonoster-Timestamp";

const hmac = (secret: string, timestamp: number, body: string) =>
  createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

export function webhookHeaders(
  body: string,
  secrets: string[],
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  return {
    [WEBHOOK_TIMESTAMP_HEADER]: String(nowSeconds),
    [WEBHOOK_SIGNATURE_HEADER]: secrets
      .map((s) => hmac(s, nowSeconds, body))
      .join(",")
  };
}

/** For receivers: true when one of the signatures matches and the timestamp is fresh (±300 s). */
export function verifyWebhook(
  body: string,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  const timestamp = Number(lower[WEBHOOK_TIMESTAMP_HEADER.toLowerCase()]);
  const header = lower[WEBHOOK_SIGNATURE_HEADER.toLowerCase()];
  if (!Number.isFinite(timestamp) || typeof header !== "string") return false;
  if (Math.abs(nowSeconds - timestamp) > 300) return false;
  const expected = Buffer.from(hmac(secret, timestamp, body), "hex");
  return header.split(",").some((sig) => {
    const given = Buffer.from(sig.trim(), "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
