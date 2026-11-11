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
import { decodeToken, getTokenFromCall, TokenUseEnum } from "@fonoster/common";
import { ServerInterceptingCall, status } from "@grpc/grpc-js";
import { providerKeySecretName } from "../providers/createProvidersHandlers";

/** Secrets whose name starts with this are vendor keys, managed through the Providers API. */
const VENDOR_KEY_PREFIX = providerKeySecretName("");

const isVendorKey = (name?: string | null) =>
  typeof name === "string" && name.startsWith(VENDOR_KEY_PREFIX);

/**
 * True when the call is made with an API key's token. API keys get access key ids starting with
 * "AP"; people signed in get "US".
 */
function isApiKeyCall(call: unknown): boolean {
  const token = getTokenFromCall(call as ServerInterceptingCall);
  if (!token) return false;
  try {
    const decoded = decodeToken<TokenUseEnum.ACCESS>(token) as {
      accessKeyId?: string;
    };
    return decoded.accessKeyId?.startsWith("AP") ?? false;
  } catch {
    return false;
  }
}

/** A Secret as anyone but an API key reading an app secret sees it: no value. */
function withoutValue<T extends { secret?: unknown }>(secret: T): T {
  return { ...secret, secret: "" };
}

const vendorKeyError = () => ({
  code: status.INVALID_ARGUMENT,
  message:
    "This is a vendor key. Manage it with fonoster providers:keys:set or Vendor keys in the dashboard"
});

export { isApiKeyCall, isVendorKey, vendorKeyError, withoutValue };
