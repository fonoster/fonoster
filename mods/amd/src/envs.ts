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
import { join } from "path";
import dotenv from "dotenv";

if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: join(__dirname, "..", "..", "..", ".env") });
}

const e = process.env;

// A malformed AMD_* number must not silently break the probe (NaN
// thresholds disable the deadline / confidence gate), so fall back to the
// default.
const positiveInt = (raw: string | undefined, fallback: number): number => {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const unitFloat = (raw: string | undefined, fallback: number): number => {
  const n = parseFloat(raw ?? "");
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : fallback;
};

// FastAGI listener. AgiServer binds all interfaces; there is no separate
// bind-address knob.
export const AGI_PORT = positiveInt(e.AMD_AGI_PORT, 4573);

// AudioSocket listener that receives the probed call audio.
export const AUDIOSOCKET_PORT = positiveInt(e.AMD_AUDIOSOCKET_PORT, 9092);
export const AUDIOSOCKET_BIND_ADDR = e.AMD_AUDIOSOCKET_BIND_ADDR || "0.0.0.0";

// The host:port Asterisk is told to connect to for the AudioSocket leg — must
// be reachable FROM Asterisk, which is why this is separate from the bind
// address above (e.g. the compose service name, not 0.0.0.0).
export const AUDIOSOCKET_ADVERTISE_HOST =
  e.AMD_AUDIOSOCKET_ADVERTISE_HOST || "amd";

// Leading audio to gather before classifying, in milliseconds.
export const PROBE_MS = positiveInt(e.AMD_PROBE_MS, 3000);

// Hard deadline for one whole AGI session (buffering + classify + SET
// VARIABLE). On expiry the verdict is NOTSURE/ML-TIMEOUT.
export const TIMEOUT_MS = positiveInt(e.AMD_TIMEOUT_MS, 4000);

// Verdicts below this confidence are downgraded to NOTSURE.
export const MIN_CONFIDENCE = unitFloat(e.AMD_MIN_CONFIDENCE, 0.8);

// Override the model directory (model.onnx / mel_filters.bin / meta.json).
// Empty string -> the copy bundled with @fonoster/amd.
export const MODEL_PATH = e.AMD_MODEL_PATH || "";
