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
import { SpeechProvider } from "@fonoster/common";
import { VoiceRequest } from "../types";
import { Verb } from "../verb";
import { SGatherOptions, SGatherStream } from "./types";
import PubSub from "pubsub-js";
import logger from "@fonoster/logger";
import merge from "deepmerge";
import StreamData from "./stream_data";
import startSpeechSource from "./source_speech";

const defaultOptions: SGatherOptions = {
  source: "speech,dtmf"
};

export default class SGatherVerb extends Verb {
  speechProvider: SpeechProvider;
  constructor(request: VoiceRequest, speechProvider?: SpeechProvider) {
    super(request);
    this.speechProvider = speechProvider;
    // Assert speech provider is available if source includes speech
  }

  async run(opts: SGatherOptions): Promise<SGatherStream> {
    const options = merge(defaultOptions, opts);
    const streamData = new StreamData();
    logger.verbose(
      `@fonoster/voice started sgather [source = ${options.source}]`
    );
    if (options.source.includes("dtmf")) {
      const token = PubSub.subscribe(
        `DtmfReceived.${this.request.sessionId}`,
        (type, data) => {
          const key = data.data;
          streamData.emit("dtmf", key);
        }
      );
      streamData.setDtmfSubscribeToken(token);
    }

    if (options.source.includes("speech")) {
      const { speechStream, token } = await startSpeechSource(
        this.request.sessionId,
        opts,
        super.getSelf(),
        this.speechProvider
      );
      streamData.setSpeechSubscribeToken(token);
      speechStream.on("transcript", (data) =>
        streamData.emit("transcript", data)
      );
    }

    return streamData;
  }
}

export { SGatherOptions };
