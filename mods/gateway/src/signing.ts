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

export function signatureHeaders(
  url: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const signature = createHmac("sha256", secret)
    .update(`${nowSeconds}.${url}`)
    .digest("hex");
  return {
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: String(nowSeconds)
  };
}
