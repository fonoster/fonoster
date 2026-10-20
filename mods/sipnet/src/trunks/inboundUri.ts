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
 * Whether an inbound URI is one label under `root` (e.g. `claro.sip.acme.com`
 * under `sip.acme.com`). Without a root (features.trunks.inboundUri: any) every
 * host passes; the request schema still checks it's a host or an IP.
 */
export function isInboundUriAllowed(uri: string, root?: string): boolean {
  if (!root) return true;
  const suffix = `.${root}`;
  return uri.endsWith(suffix) && LABEL.test(uri.slice(0, -suffix.length));
}

type Handler<R> = (
  call: { request: R },
  callback: (error?: GrpcErrorMessage, response?: unknown) => void
) => Promise<void>;

/**
 * Rejects a create or update whose inbound URI isn't under `root` with
 * INVALID_ARGUMENT. An update that leaves the URI blank keeps the current one.
 */
export function withInboundUriCheck<R extends { inboundUri?: string }>(
  handler: Handler<R>,
  root?: string
): Handler<R> {
  return async (call, callback) => {
    const uri = call.request.inboundUri;
    if (uri && !isInboundUriAllowed(uri, root)) {
      callback({
        code: status.INVALID_ARGUMENT,
        message: `The inbound URI must be one label under ${root}, such as carrier.${root}`
      });
      return;
    }
    return handler(call, callback);
  };
}
