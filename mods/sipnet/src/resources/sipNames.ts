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
import { GrpcErrorMessage } from "@fonoster/common";
import { status } from "@grpc/grpc-js";

/** One DNS label: lowercase letters, digits and inner dashes. */
const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Whether a SIP name (a trunk's inbound URI, a domain) is one label under `root`
 * (e.g. `acme.sip.example.com` under `sip.example.com`). Without a root
 * (features.sip.names: any) every name passes; the request schema still checks
 * it's a host or an IP.
 */
export function isSipNameAllowed(name: string, root?: string): boolean {
  if (!root) return true;
  const suffix = `.${root}`;
  return name.endsWith(suffix) && LABEL.test(name.slice(0, -suffix.length));
}

type Handler<R> = (
  call: { request: R },
  callback: (error?: GrpcErrorMessage, response?: unknown) => void
) => Promise<void>;

/**
 * Rejects a create or update whose `field` isn't one label under `root` with
 * INVALID_ARGUMENT. An update that leaves the field blank keeps the current value.
 */
export function withSipNameCheck<R>(
  handler: Handler<R>,
  field: string,
  what: string,
  root?: string
): Handler<R> {
  return async (call, callback) => {
    const value = (call.request as Record<string, unknown>)[field];
    const name = typeof value === "string" ? value : undefined;
    if (name && !isSipNameAllowed(name, root)) {
      callback({
        code: status.INVALID_ARGUMENT,
        message: `The ${what} must be one label under ${root}, such as acme.${root} at "${field}"`
      });
      return;
    }
    return handler(call, callback);
  };
}
