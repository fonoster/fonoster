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
import { DialRequest, STASIS_APP_NAME } from "@fonoster/common";
import { ASTERISK_TRUNK } from "../../../envs";
import { createGetChannelVar } from "../../createGetChannelVar";
import { AriClient, AriEvent, ChannelVar, VoiceClient } from "../../types";

function dialHandler(ari: AriClient, voiceClient: VoiceClient) {
  return async (request: DialRequest) => {
    // const { sessionRef, destination } = request;
    // const timeout = 30000;

    // const channel = await ari.channels.get({ channelId: sessionRef });
    // const getChannelVar = createGetChannelVar(channel);
    // const bridgeId = await getChannelVar(ChannelVar.CURRENT_BRIDGE);
    // let bridge = await ari.bridges.get({ bridgeId });

    // if (!bridge) {
    //   bridge = await ari.bridges.create({
    //     type: "mixing"
    //   });
    // }

    // // eslint-disable-next-line new-cap
    // const dialed = ari.Channel();

    // // FIXME: Hardcoded values
    // const domain = "sip.local";

    // await dialed.originate({
    //   app: STASIS_APP_NAME,
    //   endpoint: `PJSIP/${ASTERISK_TRUNK}/sip:${destination}@${domain}`,
    //   timeout
    // });

    // dialed.on(AriEvent.STASIS_START, handleStasisStart);
    // dialed.on(AriEvent.CHANNEL_LEFT_BRIDGE, handleStasisStart);
    // dialed.on(AriEvent.STASIS_END, handleStasisStart);
    // dialed.on(AriEvent.DIAL, handleStasisStart);

    // TODO: Send the initial status
  };
}

export { dialHandler };
