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
import { VoiceRequest } from "./types";
import { VoiceResponse } from "./VoiceResponse";
import VoiceServer from "./VoiceServer";

const logger = getLogger({ service: "voice", filePath: __filename });

const serverConfig = {
  pathToFiles: `${process.cwd()}/sounds`
};

new VoiceServer(serverConfig).listen(
  async (req: VoiceRequest, res: VoiceResponse) => {
    logger.verbose(req);
    await res.answer();
    await res.play(`sound:${req.endpoint}/sounds/hello-world.sln16`);
    // await res.hangup();
  }
);
