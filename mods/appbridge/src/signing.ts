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
import { createHmac } from "crypto";

// voice-session, "Connection requests are signed".
export const SIGNATURE_HEADER = "X-Fonoster-Signature";
export const TIMESTAMP_HEADER = "X-Fonoster-Timestamp";
// voice-session, "Connection requests are bound to the app": the app and workspace the gateway
// dials for, and an HMAC over them, so a signature made for one app cannot open a session for
// another (Autopilot apps share one secret).
export const APP_REF_HEADER = "X-Fonoster-App-Ref";
export const WORKSPACE_REF_HEADER = "X-Fonoster-Workspace-Ref";
export const APP_SIGNATURE_HEADER = "X-Fonoster-App-Signature";

/** Who a connection is for: the app and the workspace that owns it ("" when unknown). */
export type AppBinding = { appRef: string; workspaceRef?: string };

/** The bound string: `<timestamp>\n<url>\n<appRef>\n<workspaceRef>` (no part has a newline). */
export function appSigningInput(
  timestamp: number,
  url: string,
  binding: AppBinding
) {
  return [timestamp, url, binding.appRef, binding.workspaceRef ?? ""].join(
    "\n"
  );
}

export function signatureHeaders(
  url: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  binding?: AppBinding
): Record<string, string> {
  const signature = createHmac("sha256", secret)
    .update(`${nowSeconds}.${url}`)
    .digest("hex");
  const headers: Record<string, string> = {
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: String(nowSeconds)
  };
  if (binding) {
    headers[APP_REF_HEADER] = binding.appRef;
    headers[WORKSPACE_REF_HEADER] = binding.workspaceRef ?? "";
    headers[APP_SIGNATURE_HEADER] = createHmac("sha256", secret)
      .update(appSigningInput(nowSeconds, url, binding))
      .digest("hex");
  }
  return headers;
}
