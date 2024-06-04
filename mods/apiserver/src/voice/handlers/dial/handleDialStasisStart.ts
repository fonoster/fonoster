import { DialRequest } from "@fonoster/common";

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
function handleDialStasisStart(request: DialRequest, brid) {
  const { sessionRef, destination } = request;

  // try {
  //   if (bridgeId) {
  //     await bridge.addChannel({ channel: dialed.id });
  //   } else {
  //     // Is a new bridge so we need to add both channels
  //     await bridge.addChannel({ channel: [sessionId, dialed.id] });
  //   }

  //   if (record) {
  //     if (record.direction === "in" || record.direction === "both") {
  //       const channel = await ari.channels.snoopChannel({
  //         app: "mediacontroller",
  //         channelId: sessionId,
  //         spy: "in"
  //       });
  //       await ari.channels.record({
  //         channelId: channel.id,
  //         format: "wav",
  //         name: `${sessionId}_in`,
  //         ifExists: "overwrite"
  //       });
  //     }

  //     if (record.direction === "out" || record.direction === "both") {
  //       const channel = await ari.channels.snoopChannel({
  //         app: "mediacontroller",
  //         channelId: dialed.id,
  //         spy: "in"
  //       });
  //       await ari.channels.record({
  //         channelId: channel.id,
  //         format: "wav",
  //         name: `${sessionId}_out`,
  //         ifExists: "overwrite"
  //       });
  //     }
  //   }
  // } catch (e) {
  //   logger.warn(e);
  //   // It is possible that the originating side was already closed
  //   await dialed.hangup();
  // }
}

export { handleDialStasisStart };
