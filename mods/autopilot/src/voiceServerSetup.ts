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
import VoiceServer from "@fonoster/voice";
import { IDENTITY_ADDRESS, VOICE_SERVER_BIND, VOICE_SERVER_PORT } from "./envs";
import { handleVoiceRequest } from "./handleVoiceRequest";

function startVoiceServer(skipIdentity: boolean) {
  new VoiceServer({
    bind: VOICE_SERVER_BIND,
    port: VOICE_SERVER_PORT,
    identityAddress: IDENTITY_ADDRESS,
    skipIdentity
  }).listen(handleVoiceRequest);
}

export { startVoiceServer };
