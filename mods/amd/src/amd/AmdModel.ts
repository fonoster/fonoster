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
import { readFileSync } from "fs";
import { join } from "path";
import { AmdStatus } from "@fonoster/common";
import * as ort from "onnxruntime-node";
import {
  INPUT_FEATURES_SHAPE,
  logMelSpectrogram,
  pcmToFloat32
} from "./featureExtractor";

// Bundled with the package (see package.json "files"). __dirname is
// dist/amd at runtime and src/amd under tsx, so ../../amd-model resolves to
// the package root in both.
const DEFAULT_MODEL_DIR = join(__dirname, "..", "..", "amd-model");

type AmdMeta = {
  id2label: Record<string, string>;
  source_model?: string;
};

type AmdClassification = {
  status: AmdStatus;
  confidence: number;
  detector: string;
};

function mapLabelToStatus(label: string | undefined): AmdStatus {
  switch ((label ?? "").toLowerCase().replace(/[\s_]+/g, "-")) {
    case "human":
    case "person":
      return AmdStatus.HUMAN;
    case "voicemail":
    case "voice-mail":
      return AmdStatus.VOICEMAIL;
    case "ivr":
    case "menu":
      return AmdStatus.IVR;
    case "machine":
    case "answering-machine":
      return AmdStatus.MACHINE;
    default:
      return AmdStatus.UNKNOWN;
  }
}

function softmaxTop(logits: ArrayLike<number>): {
  index: number;
  confidence: number;
} {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) if (logits[i] > max) max = logits[i];
  let sum = 0;
  const exps = new Float64Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    exps[i] = Math.exp(logits[i] - max);
    sum += exps[i];
  }
  let index = 0;
  let best = -Infinity;
  for (let i = 0; i < exps.length; i++) {
    if (exps[i] > best) {
      best = exps[i];
      index = i;
    }
  }
  return { index, confidence: sum > 0 ? exps[index] / sum : 0 };
}

type LoadedModel = {
  dir: string;
  labels: string[];
  detector: string;
  melFiltersPath: string;
  session: Promise<ort.InferenceSession>;
};

let loaded: LoadedModel | null = null;

function load(modelDir: string): LoadedModel {
  if (loaded && loaded.dir === modelDir) return loaded;

  const meta = JSON.parse(
    readFileSync(join(modelDir, "meta.json"), "utf8")
  ) as AmdMeta;
  const labels = Object.keys(meta.id2label)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => meta.id2label[k]);

  const session = ort.InferenceSession.create(join(modelDir, "model.onnx"), {
    executionProviders: ["cpu"],
    graphOptimizationLevel: "all",
    intraOpNumThreads: 1
  });

  const entry: LoadedModel = {
    dir: modelDir,
    labels,
    detector:
      (meta.source_model ?? "").split("/").pop() || "whisper-telephony-amd",
    melFiltersPath: join(modelDir, "mel_filters.bin"),
    session
  };

  // A failed load must not be cached forever — drop it so the next call retries.
  session.catch(() => {
    if (loaded === entry) loaded = null;
  });

  loaded = entry;
  return entry;
}

/**
 * Classify a buffer of raw slin16 PCM (16 kHz mono) as human / voicemail / IVR /
 * machine. Loads and caches the ONNX session on first call. Throws on model or
 * inference failure; `runProbe` turns that into a fail-open UNKNOWN verdict.
 */
async function classifyPcm(
  pcm: Buffer,
  modelDir: string = DEFAULT_MODEL_DIR
): Promise<AmdClassification> {
  const model = load(modelDir);
  const features = await logMelSpectrogram(
    pcmToFloat32(pcm),
    model.melFiltersPath
  );

  const session = await model.session;
  const output = await session.run({
    input_features: new ort.Tensor("float32", features, INPUT_FEATURES_SHAPE)
  });

  const outName = "logits" in output ? "logits" : Object.keys(output)[0];
  const logits = output[outName]?.data as Float32Array | undefined;
  if (!logits || logits.length !== model.labels.length) {
    throw new Error(
      `amd model output "${outName}" has ${logits?.length ?? 0} values, expected ${model.labels.length}`
    );
  }

  const { index, confidence } = softmaxTop(logits);

  return {
    status: mapLabelToStatus(model.labels[index]),
    confidence,
    detector: model.detector
  };
}

export {
  AmdClassification,
  DEFAULT_MODEL_DIR,
  classifyPcm,
  mapLabelToStatus,
  softmaxTop
};
