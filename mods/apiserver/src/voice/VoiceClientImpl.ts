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
import { Stream } from "stream";
import {
  GRPCError,
  SayOptions,
  StreamEvent,
  VoiceClientConfig,
  VoiceIn,
  VoiceSessionStreamClient,
  createServiceDefiniton
} from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { VoiceClient } from "./types";

const VoiceServiceClient = grpc.makeGenericClientConstructor(
  createServiceDefiniton({
    serviceName: "Voice",
    pckg: "voice",
    proto: "voice.proto",
    version: "v1beta2"
  }),
  "",
  {}
);

type TextToSpeech = {
  synthesize: (
    text: string,
    options: Record<string, unknown>
  ) => Promise<string>;
};

type GRPCClient = {
  createSession: (metadata: grpc.Metadata) => VoiceSessionStreamClient;
  close: () => void;
};

class VoiceClientImpl implements VoiceClient {
  config: VoiceClientConfig;
  stream: Stream;
  voice: VoiceSessionStreamClient;
  tts: TextToSpeech;
  grpcClient: GRPCClient;

  constructor(config: VoiceClientConfig, tts: TextToSpeech) {
    this.config = config;
    this.stream = new Stream();
    this.tts = tts;
  }

  connect() {
    this.grpcClient = new VoiceServiceClient(
      this.config.endpoint,
      grpc.credentials.createInsecure()
    ) as unknown as GRPCClient;

    const metadata = new grpc.Metadata();
    metadata.add("accessKeyId", this.config.accessKeyId);
    metadata.add("token", this.config.sessionToken);

    this.voice = this.grpcClient.createSession(metadata);

    this.voice.on(StreamEvent.DATA, (data: VoiceIn) => {
      this.stream.emit(data.content, data);
    });

    this.voice.write({ request: this.config });

    this.voice.on(StreamEvent.ERROR, (error: GRPCError) => {
      if (error.code === grpc.status.UNAVAILABLE) {
        this.stream.emit(
          StreamEvent.ERROR,
          new Error(`voice server not available at "${this.config.endpoint}"`)
        );
        return;
      }
      this.stream.emit(StreamEvent.ERROR, error);
    });
  }

  on(type: string, callback: (data: VoiceIn) => void) {
    this.stream.on(type.toString(), (data: VoiceIn) => {
      callback(data[type]);
    });
  }

  sendResponse(response: VoiceIn): void {
    this.voice.write(response);
  }

  async synthesize(text: string, options: SayOptions): Promise<string> {
    const opts = {
      ...this.config.ttsOptions,
      ...options
    };
    return await this.tts.synthesize(text, opts);
  }

  close() {
    try {
      this.grpcClient.close();
    } catch (e) {
      // Do nothing
    }
  }
}

export { VoiceClientImpl };
