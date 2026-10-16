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
import { createPerCallCache } from "./createPerCallCache";

type CachedAmdResult = {
  status: string;
  confidence: number;
  detector: string;
  latencyMs: number;
  // Asterisk's AMDCAUSE, e.g. "INITIALSILENCE-2500-2500". Persisted to the CDR
  // only: it is how you tell which amd.conf threshold fired, and therefore the
  // lever for tuning the detector against real traffic.
  cause: string;
};

/**
 * Process-local bridge between the voice path and the CDR writer.
 * createCreateVoiceClient stores the AMD verdict here keyed by `callRef` as it
 * reads it off the channel; createInfluxDbPub reads it while building the call's
 * CDR points so the verdict is persisted alongside the rest of the record for
 * later analysis.
 *
 * For API-originated (outbound) calls `callRef` equals the CDR `ref` tag, so the
 * lookup is direct. SIP-originated inbound calls mint independent refs on each
 * side and are not correlated here — AMD only runs on outbound calls.
 */
const amdResultCache = createPerCallCache<CachedAmdResult>(24 * 60 * 60 * 1000);

export { amdResultCache, CachedAmdResult };
