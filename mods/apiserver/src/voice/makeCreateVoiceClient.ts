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
import { createCallAccessToken } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { Channel, Client, StasisStart } from "ari-client";
import { CreateContainer } from "./integrations/types";
import { makeGetChannelVar } from "./makeGetChannelVar";
import { ChannelVar, VoiceClient } from "./types";
import { VoiceClientImpl } from "./VoiceClientImpl";
import { identityConfig } from "../core/identityConfig";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const createToken = createCallAccessToken(identityConfig);

// Note: By the time the call arrives here the owner of the app MUST be authenticated
function makeCreateVoiceClient(createContainer: CreateContainer) {
  return async (params: {
    ari: Client;
    event: StasisStart;
    channel: Channel;
  }): Promise<VoiceClient> => {
    const { ari, event, channel } = params;
    const { id: sessionRef, caller } = event.channel;
    const { name: callerName, number: callerNumber } = caller;

    const getChannelVar = makeGetChannelVar(channel);

    // Variables set by Asterisk's dialplan
    const appRef = (await getChannelVar(ChannelVar.APP_REF))?.value;
    const ingressNumber =
      (await getChannelVar(ChannelVar.INGRESS_NUMBER))?.value || "";

    const { accessKeyId, appEndpoint, tts, stt } =
      await createContainer(appRef);

    const sessionToken = await createToken({ accessKeyId, appRef });

    let metadataStr: string;

    try {
      metadataStr = (await getChannelVar(ChannelVar.METADATA))?.value;
    } catch (e) {
      // Do nothing
    }

    const config = {
      appRef,
      sessionRef,
      accessKeyId,
      appEndpoint,
      callerName,
      callerNumber,
      ingressNumber,
      sessionToken,
      metadata: metadataStr ? JSON.parse(metadataStr) : {}
    };

    logger.verbose("creating voice client with config: ", {
      appRef,
      callerNumber,
      ingressNumber
    });

    return new VoiceClientImpl({ ari, config, tts, stt });
  };
}

export { makeCreateVoiceClient };
