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
import { Stream } from "stream";
import { Amd, AmdStatus } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { AmdClassification, classifyPcm, DEFAULT_MODEL_DIR } from "./AmdModel";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const SAMPLE_RATE = 16000;
const BYTES_PER_SAMPLE = 2; // mono, 16-bit little-endian
const DEFAULT_DETECTOR = "whisper-telephony-amd";

type Classify = (pcm: Buffer) => Promise<AmdClassification>;

type RunAmdProbeParams = {
  // Stream emitting "data" events with raw slin16 PCM Buffers (the
  // transcriptions stream fed by the media server's external-media socket).
  audio: Stream;
  // How much leading audio to gather before classifying, in milliseconds.
  probeMs: number;
  // Hard deadline for the whole probe. On expiry the verdict is UNKNOWN and the
  // call is dispatched unchanged.
  timeoutMs: number;
  // Verdicts below this confidence are downgraded to UNKNOWN.
  minConfidence: number;
  // Directory holding model.onnx / mel_filters.bin / meta.json. Defaults to the
  // copy bundled with the package.
  modelDir?: string;
  // Injectable classifier (tests). Defaults to the in-process ONNX model.
  classify?: Classify;
};

/**
 * Buffers the first `probeMs` of call audio (or whatever arrives before the
 * shared deadline) and returns it as one Buffer. Resolves early once enough
 * audio has accumulated. Never rejects.
 */
function collectAudio(params: {
  audio: Stream;
  probeMs: number;
  signal: AbortSignal;
}): Promise<Buffer> {
  const { audio, probeMs, signal } = params;
  const bytesNeeded = Math.ceil(
    (probeMs / 1000) * SAMPLE_RATE * BYTES_PER_SAMPLE
  );

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      audio.removeListener("data", onData);
      clearTimeout(windowTimer);
      signal.removeEventListener("abort", finish);
      resolve(Buffer.concat(chunks, total));
    };

    const onData = (chunk: Buffer) => {
      chunks.push(chunk);
      total += chunk.length;
      if (total >= bytesNeeded) finish();
    };

    const windowTimer = setTimeout(finish, probeMs);
    audio.on("data", onData);
    signal.addEventListener("abort", finish, { once: true });
  });
}

/**
 * Runs Answering Machine Detection on the leading audio of an answered outbound
 * call. Always resolves with an Amd verdict and never throws: any model error,
 * timeout, empty capture, or low-confidence result yields `{ status: UNKNOWN }`
 * so the voice application is dispatched unchanged.
 */
async function runAmdProbe(params: RunAmdProbeParams): Promise<Amd> {
  const { audio, probeMs, timeoutMs, minConfidence, modelDir } = params;
  const classify: Classify =
    params.classify ??
    ((pcm) => classifyPcm(pcm, modelDir ?? DEFAULT_MODEL_DIR));

  const startedAt = Date.now();
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), timeoutMs);
  const latencyMs = () => Date.now() - startedAt;
  const unknown = (confidence = 0, detector = DEFAULT_DETECTOR): Amd => ({
    status: AmdStatus.UNKNOWN,
    confidence,
    detector,
    latencyMs: latencyMs()
  });

  const TIMED_OUT = Symbol("amd-timed-out");
  const onDeadline = new Promise<typeof TIMED_OUT>((resolve) => {
    if (controller.signal.aborted) resolve(TIMED_OUT);
    else
      controller.signal.addEventListener("abort", () => resolve(TIMED_OUT), {
        once: true
      });
  });

  try {
    const pcm = await collectAudio({
      audio,
      probeMs,
      signal: controller.signal
    });

    if (controller.signal.aborted || pcm.length === 0) {
      logger.verbose("amd probe: no usable audio before deadline", {
        bytes: pcm.length
      });
      return unknown();
    }

    // The deadline must also bound classification: a cold model load or a hung
    // inference cannot be allowed to stall call dispatch. ONNX Runtime has no
    // cancellation, so the losing promise is left to settle on its own.
    const classification = classify(pcm);
    classification.catch(() => undefined); // no unhandled rejection if the deadline wins

    const outcome = await Promise.race([classification, onDeadline]);
    if (outcome === TIMED_OUT) {
      logger.warn(
        "amd probe: classification did not finish before the deadline"
      );
      return unknown();
    }

    const { status, confidence, detector } = outcome;

    if (confidence < minConfidence) {
      logger.verbose(
        "amd probe: confidence below threshold, reporting UNKNOWN",
        { status, confidence, minConfidence }
      );
      return unknown(confidence, detector);
    }

    logger.verbose("amd probe: verdict", { status, confidence, detector });
    return { status, confidence, detector, latencyMs: latencyMs() };
  } catch (err) {
    logger.warn("amd probe failed; dispatching call with UNKNOWN verdict", {
      error: (err as Error).message
    });
    return unknown();
  } finally {
    clearTimeout(deadline);
  }
}

export { runAmdProbe, RunAmdProbeParams };
