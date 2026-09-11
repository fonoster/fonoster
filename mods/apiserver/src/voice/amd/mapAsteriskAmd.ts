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
import { Amd, AmdStatus } from "@fonoster/common";

// Identifies the detector on the verdict, so a consumer can tell an Asterisk
// AMD() result apart from a future model-based one. Bump the suffix if the
// mapping or the thresholds shipped in amd.conf change meaningfully.
const DETECTOR = "asterisk-amd@1";

// Asterisk's app_amd is a deterministic heuristic, not a classifier: it returns
// a verdict with no probability attached. We report full confidence on a real
// decision and none on an inconclusive one, so a consumer gating on a threshold
// (as it would against a model-based detector) keeps working unchanged.
const statusMap: Record<string, { status: AmdStatus; confidence: number }> = {
  HUMAN: { status: AmdStatus.HUMAN, confidence: 1 },
  MACHINE: { status: AmdStatus.MACHINE, confidence: 1 },
  // The analysis ran out of time without deciding.
  NOTSURE: { status: AmdStatus.UNKNOWN, confidence: 0 },
  // The far end hung up mid-analysis. Rarely observed here, since the call
  // usually never reaches Stasis, but map it rather than leave it undefined.
  HANGUP: { status: AmdStatus.UNKNOWN, confidence: 0 }
};

/**
 * Maps Asterisk's AMDSTATUS channel variable onto the Amd verdict carried on the
 * session request.
 *
 * Returns undefined when AMD did not run for this call — the detector is off, the
 * call is inbound, or the media server predates the AMD dialplan — which the
 * proto loader (`defaults: false`) surfaces to voice applications as an absent
 * `req.amd` rather than an UNSPECIFIED status.
 *
 * Note that app_amd cannot tell a voicemail greeting or an IVR menu apart from a
 * generic answering machine, so VOICEMAIL and IVR are never returned even though
 * the contract carries them.
 *
 * @param {string} amdStatus - the raw AMDSTATUS channel variable, if set
 * @return {Amd | undefined} the verdict, or undefined if AMD did not run
 */
function mapAsteriskAmd(amdStatus?: string): Amd | undefined {
  const mapped = statusMap[amdStatus?.trim().toUpperCase() ?? ""];

  if (!mapped) {
    return undefined;
  }

  return {
    ...mapped,
    detector: DETECTOR,
    // app_amd reports no elapsed time and the dialplan has no millisecond clock,
    // so this is left unmeasured rather than estimated.
    latencyMs: 0
  };
}

export { DETECTOR, mapAsteriskAmd };
