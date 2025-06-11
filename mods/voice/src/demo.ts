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
import VoiceServer, { GatherSource, VoiceRequest, VoiceResponse } from ".";

const logger = getLogger({ service: "voice", filePath: __filename });

const skipIdentity = process.env.NODE_ENV === "development";

// Only skip identity for local development
new VoiceServer({ skipIdentity }).listen(
  async (req: VoiceRequest, res: VoiceResponse) => {
    logger.verbose("voice request", { ...req });

    await res.answer();

    await res.say("Hi there! What's your name?");

    const { speech: name } = await res.gather({
      source: GatherSource.SPEECH
    });

    await res.say("Nice to meet you " + name + "!");

    await res.say("Please enter your 4 digit pin.");

    const { digits } = await res.gather({
      maxDigits: 4,
      finishOnKey: "#"
    });

    await res.say("Your pin is " + digits);

    await res.hangup();
  }
);
