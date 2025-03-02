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
import { DialRecordDirection, DialRequest } from "@fonoster/common";
import { Bridge, Channel, Client } from "ari-client";
import { recordChannel } from "./recordChannel";

function handleStasisStart(params: {
  ari: Client;
  request: DialRequest;
  bridge: Bridge;
  dialed: Channel;
}) {
  const { ari, request, dialed, bridge } = params;
  const { recordDirection } = request;

  return async (_: undefined, channel: Channel) => {
    try {
      await bridge.addChannel({ channel: dialed.id });

      await ari.channels.ringStop({ channelId: channel.id });

      if (
        [DialRecordDirection.IN, DialRecordDirection.BOTH].includes(
          recordDirection
        )
      ) {
        recordChannel(ari, DialRecordDirection.IN, channel.id);
      }

      if (
        [DialRecordDirection.OUT, DialRecordDirection.BOTH].includes(
          recordDirection
        )
      ) {
        recordChannel(ari, DialRecordDirection.OUT, dialed.id);
      }
    } catch (e) {
      // It is possible that the originating side was already closed
      await dialed.hangup();
    }
  };
}

export { handleStasisStart };
