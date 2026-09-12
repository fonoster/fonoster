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
import { getLogger } from "@fonoster/logger";
import { AudioStream } from "@fonoster/streams";
import {
  AmdClassification,
  classifyPcm,
  DEFAULT_MODEL_DIR
} from "../amd/AmdModel";
import { collectPcm } from "./collectPcm";

const logger = getLogger({ service: "amd", filePath: __filename });

type Classify = (pcm: Buffer) => Promise<AmdClassification>;

type RunProbeParams = {
  stream: AudioStream;
  // How much leading audio to gather before classifying, in milliseconds.
  probeMs: number;
  // Hard deadline for the whole probe. On expiry the result is "unknown".
  timeoutMs: number;
  // Directory holding model.onnx / mel_filters.bin / meta.json. Defaults to
  // the copy bundled with the package.
  modelDir?: string;
  // Injectable classifier (tests). Defaults to the in-process ONNX model.
  classify?: Classify;
};

/**
 * Raw, mode-agnostic outcome of one probe — the classifier's own status
 * vocabulary (HUMAN/MACHINE/VOICEMAIL/IVR/UNKNOWN) with confidence, detector,
 * and latency untouched. What this becomes on the wire (compact, native-
 * vocabulary channel vars vs. the full range) is a policy decision made by
 * `buildAmdVariables`, not here — this function only measures.
 */
type ProbeResult =
  | {
      kind: "classified";
      status: AmdClassification["status"];
      confidence: number;
      detector: string;
      latencyMs: number;
    }
  | {
      kind: "unknown";
      // Machine-readable reason: ML-TIMEOUT, ML-NO-AUDIO, or ML-ERROR.
      cause: string;
      latencyMs: number;
    };

/**
 * Runs Answering Machine Detection on the leading audio of one AGI/AudioSocket
 * session. Always resolves and never throws: any model error, timeout, or
 * empty capture yields `{ kind: "unknown" }` so the caller can always report
 * *something* back over AGI. Confidence thresholding is deliberately not
 * applied here — see `buildAmdVariables`.
 */
async function runProbe(params: RunProbeParams): Promise<ProbeResult> {
  const { stream, probeMs, timeoutMs, modelDir } = params;
  const classify: Classify =
    params.classify ??
    ((pcm) => classifyPcm(pcm, modelDir ?? DEFAULT_MODEL_DIR));

  const startedAt = Date.now();
  const latencyMs = () => Date.now() - startedAt;
  const unknown = (cause: string): ProbeResult => ({
    kind: "unknown",
    cause,
    latencyMs: latencyMs()
  });

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), timeoutMs);

  const TIMED_OUT = Symbol("amd-timed-out");
  const onDeadline = new Promise<typeof TIMED_OUT>((resolve) => {
    if (controller.signal.aborted) resolve(TIMED_OUT);
    else
      controller.signal.addEventListener("abort", () => resolve(TIMED_OUT), {
        once: true
      });
  });

  try {
    const pcm = await collectPcm({
      stream,
      probeMs,
      signal: controller.signal
    });

    if (controller.signal.aborted) {
      logger.warn("amd probe: deadline hit while collecting audio");
      return unknown("ML-TIMEOUT");
    }

    if (pcm.length === 0) {
      logger.verbose("amd probe: no usable audio before deadline");
      return unknown("ML-NO-AUDIO");
    }

    // The deadline must also bound classification: a cold model load or a hung
    // inference cannot be allowed to stall the AGI session. ONNX Runtime has no
    // cancellation, so the losing promise is left to settle on its own.
    const classification = classify(pcm);
    classification.catch(() => undefined); // no unhandled rejection if the deadline wins

    const outcome = await Promise.race([classification, onDeadline]);
    if (outcome === TIMED_OUT) {
      logger.warn(
        "amd probe: classification did not finish before the deadline"
      );
      return unknown("ML-TIMEOUT");
    }

    logger.verbose("amd probe: verdict", outcome);
    return {
      kind: "classified",
      status: outcome.status,
      confidence: outcome.confidence,
      detector: outcome.detector,
      latencyMs: latencyMs()
    };
  } catch (err) {
    logger.warn("amd probe failed; reporting unknown", {
      error: (err as Error).message
    });
    return unknown("ML-ERROR");
  } finally {
    clearTimeout(deadline);
  }
}

export { ProbeResult, runProbe, RunProbeParams };
