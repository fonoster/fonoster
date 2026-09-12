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
/**
 * Sets AMDANALYSER_* env vars for the AGI/AudioSocket integration test,
 * isolated in its own module and imported first: esbuild (via tsx) hoists
 * `import` statements above other top-level code within a file, so setting
 * `process.env` directly in the test file — after its own imports, in source
 * order — would run too late for ../src/envs.ts to see the overrides. A
 * separate module imported before the ones under test still executes in
 * import order, so its top-level side effect runs first.
 */
export const AGI_PORT = 14573;
export const AUDIOSOCKET_PORT = 19092;
export const FRAME_BYTES = 640; // 20 ms of slin16 @ 16 kHz mono
export const PROBE_MS = 500; // -> exactly 16000 bytes -> exactly 25 frames
// Kept short (rather than a more production-like value) so the test that
// exercises this deadline directly (a stuck EXEC AudioSocket) doesn't turn
// the suite into a 20s+ wait.
export const TIMEOUT_MS = 3000;

process.env.AMDANALYSER_AGI_PORT = String(AGI_PORT);
process.env.AMDANALYSER_AUDIOSOCKET_PORT = String(AUDIOSOCKET_PORT);
process.env.AMDANALYSER_AUDIOSOCKET_ADVERTISE_HOST = "127.0.0.1";
process.env.AMDANALYSER_AUDIOSOCKET_BIND_ADDR = "127.0.0.1";
process.env.AMDANALYSER_PROBE_MS = String(PROBE_MS);
process.env.AMDANALYSER_TIMEOUT_MS = String(TIMEOUT_MS);
process.env.AMDANALYSER_MIN_CONFIDENCE = "0";
