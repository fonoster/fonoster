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
};

/**
 * Process-local bridge between the voice path and the CDR writer. The AMD probe
 * in VoiceClientImpl.connect() stores its verdict here keyed by `callRef`;
 * createInfluxDbPub reads it while building the call's CDR points so the verdict
 * is persisted alongside the rest of the record for later analysis.
 *
 * For API-originated (outbound) calls `callRef` equals the CDR `ref` tag, so the
 * lookup is direct. SIP-originated inbound calls mint independent refs on each
 * side and are not correlated here — the probe only runs on outbound calls.
 */
const amdResultCache = createPerCallCache<CachedAmdResult>(24 * 60 * 60 * 1000);

export { amdResultCache, CachedAmdResult };
