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
import { AzureVoice } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { VoiceRequest } from "./types";
import { VoiceResponse } from "./VoiceResponse";
import VoiceServer from "./VoiceServer";

const logger = getLogger({ service: "voice", filePath: __filename });

const config = {
  // Needed when not using the default identity service
  identityAddress: "localhost:50051"
};

new VoiceServer(config).listen(
  async (req: VoiceRequest, res: VoiceResponse) => {
    logger.verbose("voice request", JSON.stringify(req, null, 2));

    await res.answer();
    await res.say(
      "Let's bring this application home, shaould we. Looking real good!",
      {
        voice: AzureVoice.EN_GB_MIA_NEURAL
      }
    );
    await res.play("https://storage.googleapis.com/fonoster/tt-monkeys.g722");
    await res.hangup();
  }
);
