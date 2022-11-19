/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import Stream from "stream";
import PubSub from "pubsub-js";
import { SGatherOptions } from "./types";
import { startMediaTransfer } from "../utils";
import { Verb } from "../verb";
import { SpeechProvider } from "@fonoster/common";

export default async function startSpeechSource(
  sessionId: string,
  options: SGatherOptions,
  verb: Verb,
  speechProvider: SpeechProvider
) {
  const speechTracker = speechProvider.createSpeechTracker(options);
  const readable = new Stream.Readable({
    // The read logic is omitted since the data is pushed to the socket
    // outside of the script's control. However, the read() function
    // must be defined.
    read() {}
  });
  await startMediaTransfer(verb, sessionId);
  const token = PubSub.subscribe(
    `ReceivingMedia.${sessionId}`,
    (type, data) => {
      readable.push(data);
    }
  );
  const speechStream = speechTracker.streamTranscribe(readable);
  return { speechStream, token };
}
