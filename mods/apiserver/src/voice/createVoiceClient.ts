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
import { createGetChannelVar } from "./createGetChannelVar";
import {
  Channel,
  ChannelVar,
  StasisStartEvent,
  VoiceClient,
  VoiceClientConfig
} from "./types";
import { VoiceClientImpl } from "./VoiceClientImpl";

type FonosterSDK = {
  getAppToken: (req: {
    accessKeyId: string;
    expires?: number;
  }) => Promise<string>;
  getAppByNumber: (
    number: string
  ) => Promise<{ ref: string; accessKeyId: string; endpoint: string }>;
};

function createVoiceClient(sdk: FonosterSDK) {
  return async (
    event: StasisStartEvent,
    channel: Channel
  ): Promise<VoiceClient> => {
    const getChannelVar = createGetChannelVar(channel);

    // Variables set by Asterisk's dialplan
    const ingressNumber = (await getChannelVar(ChannelVar.INGRESS_NUMBER))
      .value;
    const appRef = (await getChannelVar(ChannelVar.APP_REF)).value;
    const endpoint = (await getChannelVar(ChannelVar.APP_ENDPOINT)).value;
    const metadataStr = (await getChannelVar(ChannelVar.METADATA)).value;

    const result = await sdk.getAppByNumber(ingressNumber);
    const sessionToken = await sdk.getAppToken({
      accessKeyId: result.accessKeyId
    });

    const config: VoiceClientConfig = {
      accessKeyId: result.accessKeyId,
      endpoint: endpoint || result.endpoint,
      appRef: appRef || result.ref,
      ingressNumber,
      callerId: event.channel.caller?.name,
      callerNumber: event.channel.caller?.number,
      sessionId: event.channel.id,
      sessionToken,
      metadata: metadataStr ? JSON.parse(metadataStr) : {}
    };

    return new VoiceClientImpl(config);
  };
}

export { createVoiceClient };
