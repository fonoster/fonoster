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
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import { AudioFilter, SAMPLE_RATE } from "../types";
import {
  AiCousticsProcessor,
  AiCousticsSdk,
  BYPASS_PARAMETER,
  ENHANCEMENT_LEVEL_PARAMETER
} from "./types";

const AI_COUSTICS_NAME = "aiCoustics";
const PACKAGE = "@ai-coustics/aic-sdk";
const FULL_SCALE = 32767;

const logger = getLogger({ service: "apiserver", filePath: __filename });

const aiCousticsOptionsSchema = z.object({
  // Voice Focus suppresses competing speech; Multi Speaker keeps every voice
  model: z.string().default("quail-vf-2.2-s-16khz"),
  modelDir: z.string().default("./models"),
  // Exact .aicmodel file to load; overrides model/modelDir lookup
  modelFile: z.string().optional(),
  // Download the model on first use when it isn't on disk yet
  autoDownload: z.boolean().default(true),
  // Higher values suppress more, competing speech included
  enhancementLevel: z.number().min(0).max(1).default(1),
  // Keeps the delay but stops enhancing; useful for A/B tests
  bypass: z.boolean().default(false),
  // Name of the environment variable holding the license key. The key itself
  // never goes in application config.
  licenseEnv: z.string().default("AIC_SDK_LICENSE")
});

type AiCousticsOptions = z.input<typeof aiCousticsOptionsSchema>;

// What a voice application may set. modelDir, modelFile, autoDownload and
// licenseEnv are deliberately absent: they read the media server's filesystem
// and environment, and applications are untrusted input. The model name is
// restricted to the vendor's id shape so it cannot walk the filesystem.
const aiCousticsPublicOptionsSchema = aiCousticsOptionsSchema
  .pick({ enhancementLevel: true, bypass: true })
  .extend({
    model: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9.]+)*$/, {
        message: "Invalid model name"
      })
      .default("quail-vf-2.2-s-16khz")
  })
  // Reject anything else outright, so an application that sets a server-only
  // option is told rather than having it quietly ignored
  .strict();

function loadSdk(): AiCousticsSdk {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(PACKAGE) as AiCousticsSdk;
  } catch {
    throw new Error(
      `${PACKAGE} is not installed. Run "npm install ${PACKAGE}" to use the ${AI_COUSTICS_NAME} filter.`
    );
  }
}

// Downloaded files are named after the model with underscores, plus a content
// hash and model version, e.g. quail_vf_2_2_s_16khz_gf70x7zf_v14.aicmodel
function findModelFile(modelDir: string, model: string): string | undefined {
  if (!existsSync(modelDir)) {
    return undefined;
  }

  const prefix = model.replace(/[-.]/g, "_");
  const match = readdirSync(modelDir)
    .filter((file) => file.startsWith(prefix) && file.endsWith(".aicmodel"))
    .sort()
    .pop();

  return match ? join(modelDir, match) : undefined;
}

function toFloat32(frame: Int16Array): Float32Array {
  return Float32Array.from(frame, (sample) => sample / FULL_SCALE);
}

function toInt16(samples: Float32Array, length: number): Int16Array {
  return Int16Array.from({ length }, (_, i) => {
    const value = Math.round((samples[i] ?? 0) * FULL_SCALE);
    return Math.max(-32768, Math.min(32767, value));
  });
}

/**
 * ai-coustics speech enhancement (Quail Voice Focus by default), which keeps
 * the primary speaker and suppresses noise and competing voices.
 *
 * The SDK works on fixed blocks of Float32 samples at the model's optimal
 * size, so frames are re-chunked here and the output is delayed by one block.
 * Processing runs on libuv worker threads, off the event loop.
 *
 * Until the model is loaded, audio passes through untouched rather than
 * stalling the call.
 */
function createAiCousticsFilter(
  input: AiCousticsOptions = {},
  deps: { loadSdk: () => AiCousticsSdk } = { loadSdk }
): AudioFilter {
  const options = aiCousticsOptionsSchema.parse(input);
  const license = process.env[options.licenseEnv];

  if (!license) {
    throw new Error(
      `The ${AI_COUSTICS_NAME} filter needs a license key in ${options.licenseEnv}. Get one at https://developers.ai-coustics.com`
    );
  }

  let processor: AiCousticsProcessor | null = null;
  // close() can land while the model is still loading; without this the
  // processor built afterwards would never be disposed
  let closed = false;
  let blockSize = 0;
  let delaySamples = 0;
  let pendingInput = new Float32Array(0);
  let pendingOutput = new Float32Array(0);
  let framesPassedThrough = 0;
  let framesProcessed = 0;
  let lastInputDb = -90;
  let lastOutputDb = -90;

  const append = (buffer: Float32Array, samples: Float32Array) => {
    const next = new Float32Array(buffer.length + samples.length);
    next.set(buffer);
    next.set(samples, buffer.length);
    return next;
  };

  // Runs on every frame, so it walks the samples in place rather than
  // allocating a copy per call
  const db = (samples: Int16Array, scale: number) => {
    if (samples.length === 0) {
      return -90;
    }

    const sum = samples.reduce((acc, s) => acc + (s / scale) * (s / scale), 0);
    const rms = Math.sqrt(sum / samples.length);

    return rms > 0 ? Math.max(-90, 20 * Math.log10(rms)) : -90;
  };

  const start = (async () => {
    const sdk = deps.loadSdk();
    const existing =
      options.modelFile ?? findModelFile(options.modelDir, options.model);

    if (!existing && !options.autoDownload) {
      throw new Error(
        `Model ${options.model} not found in ${options.modelDir}`
      );
    }

    if (!existing) {
      logger.verbose("downloading ai-coustics model", {
        model: options.model,
        modelDir: options.modelDir
      });
    }

    const file =
      existing ?? (await sdk.Model.download(options.model, options.modelDir));
    const model = sdk.Model.fromFile(file);
    const optimalRate = model.getOptimalSampleRate();

    if (optimalRate !== SAMPLE_RATE) {
      throw new Error(
        `Model ${options.model} expects ${optimalRate} Hz; call audio is ${SAMPLE_RATE} Hz`
      );
    }

    blockSize = model.getOptimalBlockSize(SAMPLE_RATE);
    processor = await new sdk.ProcessorAsync(model, license).withConfig(
      SAMPLE_RATE,
      blockSize
    );

    if (closed) {
      processor.dispose();
      processor = null;
      return;
    }

    const context = await processor.getContext();

    if (typeof context?.setParameter !== "function") {
      throw new Error(
        `${PACKAGE} returned an unexpected processor context; the SDK version may be incompatible`
      );
    }

    context.setParameter(ENHANCEMENT_LEVEL_PARAMETER, options.enhancementLevel);
    context.setParameter(BYPASS_PARAMETER, options.bypass ? 1 : 0);
    delaySamples = context.getAudioDelay();

    // One block of silence keeps output aligned with input from here on
    pendingOutput = new Float32Array(blockSize);

    logger.verbose("ai-coustics filter ready", {
      model: options.model,
      file,
      blockSize,
      delaySamples
    });
  })();

  // Surfaced by ready(); the chain disables the filter if it rejects
  start.catch(() => undefined);

  const processBlocks = async (): Promise<void> => {
    if (pendingInput.length < blockSize) {
      return;
    }

    const block = pendingInput.slice(0, blockSize);
    pendingInput = pendingInput.slice(blockSize);
    pendingOutput = append(pendingOutput, await processor!.process(block));

    return processBlocks();
  };

  return {
    name: AI_COUSTICS_NAME,

    get delayMs() {
      return delaySamples / (SAMPLE_RATE / 1000);
    },

    ready: () => start,

    async process(frame) {
      if (!processor) {
        framesPassedThrough++;
        return frame;
      }

      lastInputDb = db(frame, FULL_SCALE);
      pendingInput = append(pendingInput, toFloat32(frame));
      await processBlocks();

      const output = toInt16(pendingOutput, frame.length);
      pendingOutput = pendingOutput.slice(frame.length);
      lastOutputDb = db(output, FULL_SCALE);
      framesProcessed++;

      return output;
    },

    getStats() {
      return {
        framesProcessed,
        framesPassedThrough,
        blockSize,
        delaySamples,
        enhancementLevel: options.enhancementLevel
      };
    },

    inspect() {
      return {
        inputDb: lastInputDb,
        outputDb: lastOutputDb,
        reductionDb: lastOutputDb - lastInputDb
      };
    },

    close() {
      closed = true;
      processor?.dispose();
      processor = null;
    }
  };
}

export {
  AI_COUSTICS_NAME,
  aiCousticsOptionsSchema,
  AiCousticsOptions,
  aiCousticsPublicOptionsSchema,
  createAiCousticsFilter
};
