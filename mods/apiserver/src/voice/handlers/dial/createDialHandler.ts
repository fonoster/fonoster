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
import { DialRequest, DialStatus, STASIS_APP_NAME } from "@fonoster/common";
import { Client } from "ari-client";
import { v4 as uuidv4 } from "uuid";
import { ASTERISK_SYSTEM_DOMAIN, ASTERISK_TRUNK } from "../../../envs";
import { createHandleDialEventsWithVoiceClient } from "../../../utils";
import { AriEvent as AE, ChannelVar, VoiceClient } from "../../types";
import { createGetChannelVar } from "../../utils/createGetChannelVar";
import { handleChannelLeftBridge } from "./handleChannelLeftBridge";
import { handleStasisEnd } from "./handleStasisEnd";
import { handleStasisStart } from "./handleStasisStart";

// TODO: Needs request validation
function createDialHandler(ari: Client, voiceClient: VoiceClient) {
  return async function dial(request: DialRequest) {
    const { mediaSessionRef: channelId, destination, timeout } = request;

    const bridge = await ari.bridges.create({
      type: "mixing"
    });

    // eslint-disable-next-line new-cap
    const dialed = ari.Channel();

    await bridge.addChannel({ channel: channelId });

    const callerChannel = await ari.channels.get({ channelId });
    const getChannelVar = createGetChannelVar(callerChannel);

    const ingressNumber = (await getChannelVar(ChannelVar.INGRESS_NUMBER))
      .value;

    const ref = uuidv4();

    await dialed.originate({
      app: STASIS_APP_NAME,
      endpoint: `PJSIP/${ASTERISK_TRUNK}/sip:${destination}@${ASTERISK_SYSTEM_DOMAIN}`,
      timeout,
      variables: {
        "PJSIP_HEADER(add,X-Call-Ref)": ref,
        "PJSIP_HEADER(add,X-Dod-Number)": ingressNumber,
        "PJSIP_HEADER(add,X-Is-Api-Originated-Type)": "true"
      }
    });

    await ari.channels.ring({ channelId });

    dialed.once(
      AE.STASIS_START,
      handleStasisStart({ ari, request, bridge, dialed })
    );

    dialed.once(
      AE.CHANNEL_LEFT_BRIDGE,
      handleChannelLeftBridge({ bridge, dialed })
    );

    dialed.once(AE.STASIS_END, handleStasisEnd(request));

    dialed.on(AE.DIAL, createHandleDialEventsWithVoiceClient(voiceClient));

    voiceClient.sendResponse({
      dialResponse: {
        status: DialStatus.TRYING
      }
    });
  };
}

export { createDialHandler };
