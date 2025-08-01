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
import { createGenerateCallAccessToken } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { Channel, Client, StasisStart } from "ari-client";
import { identityConfig } from "../core/identityConfig";
import { mapCallDirectionToEnum } from "../events/mapCallDirectionToEnum";
import { VoiceClientImpl } from "./client";
import { CreateContainer } from "./integrations/types";
import { ChannelVar, VoiceClient } from "./types";
import { createGetChannelVarWithoutThrow } from "./utils/createGetChannelVarWithoutThrow";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const generateCallAccessToken = createGenerateCallAccessToken(identityConfig);

// Note: By the time the call arrives here the owner of the app MUST be authenticated
function createCreateVoiceClient(createContainer: CreateContainer) {
  return async function createVoiceClient(params: {
    ari: Client;
    event: StasisStart;
    channel: Channel;
  }): Promise<VoiceClient> {
    const { ari, event, channel } = params;
    const { id: sessionRef, caller } = event.channel;
    const { name: callerName, number: callerNumber } = caller;

    const getChannelVar = createGetChannelVarWithoutThrow(channel);

    // Variables set by Asterisk's dialplan
    const callDirection = (await getChannelVar(ChannelVar.CALL_DIRECTION))
      ?.value;
    const appRef = (await getChannelVar(ChannelVar.APP_REF))?.value;
    const ingressNumber =
      (await getChannelVar(ChannelVar.INGRESS_NUMBER))?.value || "";

    const { accessKeyId, endpoint, tts, stt } = await createContainer(appRef);

    const sessionToken = await generateCallAccessToken({ accessKeyId, appRef });

    const metadataStr =
      (await getChannelVar(ChannelVar.METADATA))?.value ?? "{}";

    const config = {
      appRef,
      sessionRef,
      accessKeyId,
      endpoint,
      callerName,
      callerNumber,
      ingressNumber,
      sessionToken,
      callDirection: mapCallDirectionToEnum(callDirection),
      metadata: JSON.parse(metadataStr)
    };

    logger.verbose("creating voice client with config: ", {
      appRef,
      callerNumber,
      ingressNumber
    });

    return new VoiceClientImpl({ ari, config, tts, stt });
  };
}

export { createCreateVoiceClient };
