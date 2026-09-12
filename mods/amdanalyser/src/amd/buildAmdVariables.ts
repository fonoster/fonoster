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
import { AmdStatus } from "@fonoster/common";
import { ProbeResult } from "../probe/runProbe";

type AmdMode = "compact" | "full";

type AmdVariables = Record<string, string>;

/**
 * Parses the mode passed as the AGI session's first dialplan argument (e.g.
 * `AGI(agi://amdanalyser:4573,${AMD_MODE})` -> `agi_arg_1` -> here).
 * Anything but the literal "full" is treated as "compact" — the safe,
 * native-AMD-compatible default when the argument is absent, empty, or
 * misspelled.
 */
function parseMode(raw: string | undefined): AmdMode {
  return raw === "full" ? "full" : "compact";
}

/**
 * Collapses the classifier's 5-way AmdStatus onto the 4-way AMDSTATUS
 * vocabulary Asterisk's own AMD() app uses (HUMAN/MACHINE/NOTSURE/HANGUP —
 * this module never reports HANGUP, that's apiserver's read of a channel
 * that is already gone). This is the seam that lets apiserver's
 * `mapAsteriskAmd.ts` and `createCreateVoiceClient.ts` stay unmodified: in
 * compact mode they only ever see the same four values native AMD() already
 * produces. Confidence, detector, latency, and the VOICEMAIL/IVR distinction
 * are discarded here — that's exactly what "full" mode below is for.
 */
function buildCompactVariables(
  result: ProbeResult,
  minConfidence: number
): AmdVariables {
  if (result.kind === "unknown") {
    return { AMDSTATUS: "NOTSURE", AMDCAUSE: result.cause };
  }
  if (result.confidence < minConfidence) {
    return { AMDSTATUS: "NOTSURE", AMDCAUSE: "ML-LOW-CONFIDENCE" };
  }
  switch (result.status) {
    case AmdStatus.HUMAN:
      return { AMDSTATUS: "HUMAN", AMDCAUSE: "HUMAN" };
    case AmdStatus.MACHINE:
      return { AMDSTATUS: "MACHINE", AMDCAUSE: "MACHINE-MACHINE" };
    case AmdStatus.VOICEMAIL:
      return { AMDSTATUS: "MACHINE", AMDCAUSE: "MACHINE-VOICEMAIL" };
    case AmdStatus.IVR:
      return { AMDSTATUS: "MACHINE", AMDCAUSE: "MACHINE-IVR" };
    default:
      // Reached only when the classifier itself reports UNKNOWN/UNSPECIFIED
      // — a label AmdModel's mapLabelToStatus didn't recognize — which is
      // independent of (and must not be confused with) the confidence-
      // threshold downgrade above: that one already returned by this point.
      return { AMDSTATUS: "NOTSURE", AMDCAUSE: "ML-UNKNOWN-LABEL" };
  }
}

/**
 * Reports the classifier's own vocabulary and every measurement it
 * produced, untouched (no confidence thresholding) — a consumer that opted
 * into "full" mode is expected to apply its own policy over AMDCONFIDENCE
 * rather than have this module decide NOTSURE for it. Not native-AMD
 * compatible: a consumer reading AMDSTATUS here must expect VOICEMAIL/IVR/
 * UNKNOWN in addition to HUMAN/MACHINE.
 */
function buildFullVariables(result: ProbeResult): AmdVariables {
  if (result.kind === "unknown") {
    return {
      AMDSTATUS: "UNKNOWN",
      AMDCAUSE: result.cause,
      AMDCONFIDENCE: "0",
      AMDDETECTOR: "",
      AMDLATENCYMS: String(result.latencyMs)
    };
  }
  return {
    AMDSTATUS: result.status,
    AMDCAUSE: result.status,
    AMDCONFIDENCE: result.confidence.toFixed(4),
    AMDDETECTOR: result.detector,
    AMDLATENCYMS: String(result.latencyMs)
  };
}

function buildAmdVariables(
  result: ProbeResult,
  mode: AmdMode,
  minConfidence: number
): AmdVariables {
  return mode === "full"
    ? buildFullVariables(result)
    : buildCompactVariables(result, minConfidence);
}

export { AmdMode, AmdVariables, buildAmdVariables, parseMode };
