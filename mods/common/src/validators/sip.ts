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
import { z } from "zod";

// What apps and API callers may put into a SIP request the platform sends (CreateCall's
// from/to, the `transfer` command's target and headers). sipgo does not escape header values or
// URI users, so anything that reaches an INVITE or REFER must be safe as-is.

/**
 * Headers the platform (Routr, the Roomr node, the gateway, the apiserver) sets and trusts: they
 * pick the app, the call, the workspace and the trunk. Callers and apps may never set them.
 */
export const RESERVED_SIP_HEADERS: ReadonlySet<string> = new Set(
  [
    "X-App-Ref",
    "X-Call-Ref",
    "X-Call-Direction",
    "X-Dod-Number",
    "X-Dod-Privacy",
    "X-Access-Key-Id",
    "X-Is-Api-Originated-Type",
    "X-Connect-Token",
    "X-Edgeport-Ref",
    "X-Gateway-Auth",
    "X-Request-Uri",
    "X-Session-Count"
  ].map((h) => h.toLowerCase())
);

/** Custom headers only: `X-` (any case) and up to 64 letters, digits or dashes. */
export const SIP_HEADER_NAME = /^X-[A-Za-z0-9-]{1,64}$/i;
export const SIP_HEADER_VALUE_MAX = 256;
export const SIP_HEADERS_MAX = 16;

/** E.164: a leading `+` is optional, up to 15 digits, no leading zero. */
export const E164 = /^\+?[1-9][0-9]{1,14}$/;

// The user part of a SIP URI as the node dials it (a number, an extension or an agent name).
const SIP_USER = "[A-Za-z0-9+*#._~-]{1,64}";
const SIP_HOST =
  "[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?(?::[0-9]{1,5})?";

/** A dial target: an E.164 number, a SIP user, or `sip:`/`sips:user@host[:port]`. */
export const SIP_TARGET = new RegExp(
  `^(?:${SIP_USER}|sips?:${SIP_USER}@${SIP_HOST}|tel:\\+?[0-9*#-]{1,32})$`
);

/** Why a custom SIP header may not be sent (undefined: it may). */
export function sipHeaderProblem(
  name: string,
  value: unknown
): string | undefined {
  if (!SIP_HEADER_NAME.test(name))
    return `header ${JSON.stringify(name)} is not an X- header name`;
  if (RESERVED_SIP_HEADERS.has(name.toLowerCase()))
    return `header ${name} is reserved for the platform`;
  if (typeof value !== "string") return `header ${name} must be a string`;
  if (value.length > SIP_HEADER_VALUE_MAX)
    return `header ${name} is longer than ${SIP_HEADER_VALUE_MAX} characters`;
  // CR, LF and every other control character (a tab is allowed).
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000a-\u001f\u007f]/.test(value))
    return `header ${name} has control characters`;
  return undefined;
}

/** Why a set of custom SIP headers may not be sent (undefined: they may). */
export function sipHeadersProblem(headers: unknown): string | undefined {
  if (headers === undefined || headers === null) return undefined;
  if (typeof headers !== "object" || Array.isArray(headers))
    return "headers must be an object";
  const entries = Object.entries(headers as Record<string, unknown>);
  if (entries.length > SIP_HEADERS_MAX)
    return `at most ${SIP_HEADERS_MAX} headers`;
  for (const [name, value] of entries) {
    const problem = sipHeaderProblem(name, value);
    if (problem) return problem;
  }
  return undefined;
}

/** Whether `to` is a target the Roomr node may dial or refer to. */
export function isSipTarget(to: unknown): to is string {
  return typeof to === "string" && SIP_TARGET.test(to);
}

export const e164Schema = z
  .string()
  .regex(E164, { message: "Must be an E.164 number (e.g. +17853178070)" });

export const sipTargetSchema = z.string().regex(SIP_TARGET, {
  message: "Must be an E.164 number, a SIP user or a sip: URI"
});
