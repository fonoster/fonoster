#!/usr/bin/env node
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
import VoiceServer, { VoiceRequest, VoiceResponse } from "@fonoster/voice";
import { loadAndValidateAssistant } from "./assistants";
import { Autopilot } from "./Autopilot";
import { OPENAI_API_KEY } from "./envs";

const logger = getLogger({ service: "autopilot", filePath: __filename });

const skipIdentity = process.env.NODE_ENV === "dev";

new VoiceServer({ skipIdentity }).listen(
  async (req: VoiceRequest, voice: VoiceResponse) => {
    const { ingressNumber, sessionRef, appRef } = req;
    logger.verbose("voice request", { ingressNumber, sessionRef, appRef });

    const assistantPath = process.argv[2];
    const assistant = loadAndValidateAssistant(assistantPath);

    logger.verbose("interacting with assistant", { name: assistant.name });

    const autopilot = new Autopilot({
      voice,
      assistantConfig: {
        ...assistant,
        apiKey: OPENAI_API_KEY!
      }
    });

    autopilot.start();
  }
);
