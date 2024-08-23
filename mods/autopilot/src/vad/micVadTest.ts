/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import record from "node-record-lpcm16";
import { makeVad } from "./makeVad";

const logger = getLogger({ service: "autopilot", filePath: __filename });

async function main() {
  const vad = await makeVad();

  // Start recording from the default microphone
  const mic = record
    .record({
      sampleRate: 16000, // 16 kHz sample rate
      channels: 1,
      threshold: 0.5
    })
    .stream();

  mic.on("data", async (data) => {
    const chunk = new Float32Array(data.buffer);
    await vad(chunk, (event, _data) => {
      logger.info("vad event:", { event, data: _data });
    });
  });

  mic.on("error", (err) => {
    logger.error("an error occurred:", { err });
  });
}

main().catch(logger.error);
