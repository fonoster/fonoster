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
import * as http from "http";
import { keySet } from "@fonoster/callrecord";
import { GatewayConfig } from "../config";
import { keyCustody } from "../record/keyCustody";

/** Where the region's call-record keys are published (the records' jku points here). */
export const KEY_SET_PATH = "/.well-known/call-record-keys.json";

/**
 * Serves the region's published call-record key set: the current signing key's public half plus
 * every earlier key in callRecord.keyHistory, so old records keep verifying after rotation.
 */
export function keySetHandler(
  config: GatewayConfig["callRecord"]
): http.RequestListener | undefined {
  if (!config) return undefined;
  const custody = keyCustody(config);
  // Rebuilt at most every 5 s, so a rotation shows up without a restart.
  let cached: { at: number; body: string } | undefined;
  return (_req, res) => {
    if (!cached || Date.now() - cached.at > 5000)
      cached = {
        at: Date.now(),
        body: JSON.stringify(keySet(custody.publicKeys()))
      };
    res.writeHead(200, {
      "content-type": "application/jwk-set+json",
      "cache-control": "public, max-age=300"
    });
    res.end(cached.body);
  };
}
