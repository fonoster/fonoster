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
import { createPublicKey, createVerify, KeyObject } from "crypto";
import { readFileSync } from "fs";

export const CONNECT_TOKEN_HEADER = "x-connect-token";

/** `test` is true when the call carried a valid test token (a browser test call). */
export type TestCallCheck = { ok: boolean; reason?: string; test?: boolean };

/** A header's value, matched case-insensitively (SIP header names are). */
export function headerValue(
  headers: Record<string, unknown> | undefined,
  name: string
): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers))
    if (k.toLowerCase() === lower && typeof v === "string") return v;
  return undefined;
}

const b64url = (s: string) => Buffer.from(s, "base64url");

/** The payload of an RS256 JWT that verifies with `key` and is not expired, else a reason. */
export function verifyRs256(
  token: string,
  key: KeyObject,
  nowSeconds = Math.floor(Date.now() / 1000)
): { payload: Record<string, unknown> } | { reason: string } {
  const parts = token.split(".");
  if (parts.length !== 3) return { reason: "malformed" };
  let header: { alg?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(b64url(parts[0]).toString("utf8"));
    payload = JSON.parse(b64url(parts[1]).toString("utf8"));
  } catch {
    return { reason: "malformed" };
  }
  if (header.alg !== "RS256") return { reason: "algorithm" };
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  if (!verifier.verify(key, b64url(parts[2]))) return { reason: "signature" };
  if (typeof payload.exp === "number" && payload.exp <= nowSeconds)
    return { reason: "expired" };
  if (typeof payload.nbf === "number" && payload.nbf > nowSeconds)
    return { reason: "not_yet_valid" };
  return { payload };
}

/** Checks a call's test token against the app it names (no token: not a test call, ok). */
export class TestCallVerifier {
  private key?: KeyObject;

  constructor(private readonly publicKeyFile?: string) {}

  check(
    headers: Record<string, unknown> | undefined,
    workspaceRef: string | undefined
  ): TestCallCheck {
    const token = headerValue(headers, CONNECT_TOKEN_HEADER);
    if (!token) return { ok: true, test: false };
    if (!this.publicKeyFile) return { ok: false, reason: "not_configured" };
    try {
      this.key ??= createPublicKey(readFileSync(this.publicKeyFile, "utf8"));
    } catch {
      return { ok: false, reason: "key_unreadable" };
    }
    const result = verifyRs256(token, this.key);
    if ("reason" in result) return { ok: false, reason: result.reason };
    const { payload } = result;
    const methods = payload.allowedMethods;
    if (!Array.isArray(methods) || !methods.includes("INVITE"))
      return { ok: false, reason: "method" };
    if (workspaceRef !== undefined && payload.accessKeyId !== workspaceRef)
      return { ok: false, reason: "workspace" };
    return { ok: true, test: true };
  }
}
