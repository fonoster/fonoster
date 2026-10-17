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
import { Metadata } from "@grpc/grpc-js";

type CallWithAddress = {
  metadata?: Metadata;
  getPeer?: () => string;
};

/** The caller's address: Envoy's x-forwarded-for when present, else the peer. */
function clientAddress(call: CallWithAddress): string {
  const forwarded = call.metadata?.get("x-forwarded-for")?.[0]?.toString();
  return forwarded?.split(",")[0].trim() || call.getPeer?.() || "unknown";
}

export { CallWithAddress, clientAddress };
